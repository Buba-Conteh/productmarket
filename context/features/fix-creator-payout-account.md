# Fix — Creator payout account & wallet figures

**Status:** 🟡 Implemented — awaiting staging verification
**Branch:** `fix/creator-payout-account`
**Related roadmap items:** 6.1 Stripe Connect onboarding, 6.7 Payout retry logic, 6.9 Creator earnings dashboard

## Problem

Two completed prod campaigns created payouts that never reached the creators,
and the creators had no payout account listed.

How payouts work: creators do **not** save a card. They get a Stripe Connect
Express account (`creator_profiles.stripe_connect_id`, `acct_…`) and add their
bank account / debit card on Stripe's hosted page. `PayoutService::executeTransfer()`
sends a Stripe transfer from the platform balance (brand escrow) to that account.

Root causes found:

1. **No way to connect after onboarding.** Creators could skip Stripe in
   onboarding ("Continue with free plan"). The dashboard banner linked to
   `/onboarding/creator/payout`, which redirects onboarded users back to the
   dashboard — a dead loop.
2. **Status never refreshed.** The Connect status was only synced when the
   creator came back from Stripe. No `account.updated` webhook, so accounts
   verified later stayed `pending`.
3. **Payouts were failed, not held.** With no active account, the transfer was
   "failed" twice (30 min apart), then marked `failed`, removed from
   `pending_earnings`, and never retried. The money silently left the wallet.
4. Onboarding's Stripe button used `redirect()->away()` on an Inertia XHR, which
   can't follow a cross-origin redirect.
5. "Active" was based on `charges_enabled` (card payments), not on the
   `transfers` capability that payouts actually need.

## What changed

### Payout flow (`PayoutService`)
- No active payout account → payout **stays pending** with
  `failure_reason = Payout::AWAITING_ACCOUNT_REASON`. No retries burned, no admin
  alert, amount stays in the creator's pending balance.
- Payout is claimed atomically (`pending → processing`) before the Stripe call,
  so two queued jobs can never transfer the same payout twice.
- `releaseHeldPayouts(CreatorProfile)` — restores payouts failed by the old flow
  (`LEGACY_INACTIVE_ACCOUNT_REASON`, amount added back to `pending_earnings`),
  then queues every pending payout.
- `retry(Payout)` — admin retry of any failed payout.
- `ReleaseHeldPayoutsJob` only picks creators with an active account.

### Stripe Connect (`StripeConnectService`)
- Status = `active` when details are submitted **and** the `transfers`
  capability is active; `restricted` when submitted but not yet active.
- `applyAccountStatus()` — used by page sync and the webhook; while active it
  releases held payouts (idempotent).
- `createDashboardLink()` — Stripe Express dashboard login link so creators can
  change their bank account.

### Creator: Settings → Payout Account (`/settings/payout-account`)
- `Settings\PayoutAccountController` — connect / continue setup / manage bank
  account; return + refresh URLs for Stripe. Re-syncs status from Stripe on
  page load if not active (self-heals even without the webhook).
- Dashboard and Wallet banners now link here (`PayoutAccountBanner`).

### Connect webhook (`POST /stripe/connect/webhook`)
- `Billing\ConnectWebhookController` handles `account.updated`, verified with
  `STRIPE_CONNECT_WEBHOOK_SECRET` (Connect endpoints have their own secret).

### Wallet figures
- `CreatorWalletService::summary()` computes the wallet from the payouts table
  (paid, pending incl. processing, awaiting account, failed, counts). Used by
  Wallet, Dashboard, My Entries and Creator Analytics, so every surface shows
  the same numbers as the payout history.
- Wallet rows show an **Awaiting payout account** badge.
- `php artisan payouts:reconcile-balances` (dry run) / `--fix` — compares and
  corrects the denormalized `total_earned` / `pending_earnings` columns and
  releases held payouts for already-active creators.

### Admin: Payouts (`/admin/payouts`)
- Totals (failed, awaiting creator account, pending, paid), filters, and a
  **Retry** button on failed payouts.

## Deploy checklist

1. Stripe Dashboard → Developers → Webhooks → **Add endpoint** →
   "Events on Connected accounts" → URL `https://<domain>/stripe/connect/webhook`
   → event `account.updated`. Copy its signing secret into
   `STRIPE_CONNECT_WEBHOOK_SECRET`.
2. Deploy, then `php artisan config:cache`.
3. `php artisan payouts:reconcile-balances` (review output), then `--fix` if correct.
4. Ask affected creators to open Settings → Payout Account and connect Stripe —
   their held/failed payouts go out automatically once Stripe activates them.

## Known gaps
- Referral bonuses (`ReferralService`) are added to `pending_earnings` without a
  payout row, so they are never actually transferred and are not in the wallet
  summary. Needs its own payout type — out of scope here.
- A payout stuck in `processing` (worker crash after claim) needs manual review
  in Stripe before retrying.

## Tests
`tests/Feature/Payout/CreatorPayoutAccountTest.php` — hold vs fail, release +
legacy recovery, restricted status, wallet summary, wallet page props, settings
page, signed/unsigned webhook, admin retry.
