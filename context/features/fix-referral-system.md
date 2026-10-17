# Fix — Referral System End to End

**Branch:** `fix/referral-system`
**Status:** 🟢 Complete (pending staging test)
**Date:** 2026-10-16

## Overview

Referrals (10.1 / 10.2) worked only for the email-signup happy path. Several
paths silently lost referrals or "rewarded" them without paying anything.

## Problems fixed

| # | Problem | Fix |
|---|---|---|
| 1 | Google/LinkedIn users were created without a `referral_code` — their share link was `/register?ref=` | `SocialAuthController` generates a code; `ReferralService::ensureCode()` backfills on the referrals page for older accounts |
| 2 | `?ref` was dropped for Google and phone signups | New `CaptureReferralCode` web middleware stores `?ref` in the session on any guest GET; the role-select step attaches it for every signup path |
| 3 | Creator bonus only bumped `pending_earnings` — never paid, wiped by `creators:reconcile --fix` | Bonus is now a real `payouts` row (`payout_type = referral_bonus`, no fee) transferred via Stripe Connect by `ProcessPayoutJob`; held until the creator has an active payout account and the min-payout threshold applies |
| 4 | Cross-role referrals (brand→creator, creator→brand) marked `rewarded` with nothing given | Reward is based on the **referrer's** role (creator → cash bonus, brand → Stripe balance credit). If no reward can be given the referral stays `qualified` |
| 5 | Brand credit (Stripe call) ran inside the publish/submit DB transaction | `qualify()` now runs after the transaction commits; credit failures are logged and never undo the publish/submission |
| 6 | Code collisions could fail signup | `generateCode()` loops until unique |
| 7 | Double qualification race | Referral is claimed atomically (`pending → qualified`); payout creation is idempotent per referral |

## Where the money comes from

- **Creator bonus** — Stripe Connect transfer from the platform's own Stripe balance (marketing cost). Never touches campaign escrow.
- **Brand credit** — Cashier customer balance credit, applied to the brand's next subscription invoice.
- Amounts: `platform_settings.referral_creator_bonus` / `referral_brand_credit`.

## Schema (additive)

Migration `2026_10_16_100000_add_referral_bonus_to_payouts_table`:
- `payouts.entry_id`, `payouts.campaign_id` → nullable
- `payouts.payout_type` gains `referral_bonus`
- `payouts.referral_id` (nullable, unique FK → referrals)

## Other touch points

- `PayoutService::createReferralPayout()`; transfer omits null campaign/entry metadata; escrow increment is null-safe
- `PayoutProcessed` notification, earnings page, dashboard activity handle payouts with no campaign
- Admin analytics GMV excludes referral bonuses

## Known limitation

Creator bonuses granted before this fix exist only in `pending_earnings` with no payout row. They are not backfilled automatically.

## Tests

`tests/Feature/Growth/ReferralTest.php` — payout creation, idempotency, cross-role reward, unrewardable stays qualified, social signup attaches `?ref`, code backfill.
