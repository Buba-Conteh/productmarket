# Current Feature: Real Escrow PaymentIntent on Campaign Publish

**Status:** In Progress
**Branch:** feature/escrow-paymentintent
**Started:** 2026-06-24

## Problem

The brand-funding leg of the escrow flow was never implemented. `CampaignService::publish()`
(and `republish()` for cancelled campaigns) created an `escrow_transactions` row with a
**placeholder** `stripe_payment_intent_id` (`pending_<campaign_id>`) and moved the campaign
straight to `active` — no real money was collected from the brand.

This meant the "product owner → creator" money path was only half-wired:

- **Brand → escrow (money IN):** not implemented (placeholder only)
- **Escrow/platform → creator (money OUT):** real, via `PayoutService` (`transfers->create`)

`PayoutService` transfers draw from the **platform's Stripe balance**, so on staging real
payouts would eventually fail once that balance is drained, because campaigns never top it up.

## Charge model decision

This is a **separate charges and transfers** integration (confirmed via Stripe best-practices):

- Escrow is funded at publish time at the **campaign** level — the recipient creators are
  unknown and there can be many (contest winner + runner-up, ripple milestones across creators).
- Destination charges (`transfer_data.destination`) route to a single connected account at
  charge time and do **not** fit escrow.
- So: charge the brand into the **platform** balance now; pay creators later via
  `transfers->create` (exactly what `PayoutService` already does).

The brand pays via their saved default payment method (collected during subscription Checkout),
charged **off-session** through Cashier's `charge()`.

## Implementation

1. `config/escrow.php` — `stub_mode` (default `true`) + `currency` (default `usd`).
   - Stub mode preserves the existing placeholder behaviour so local/dev/test/seeders are
     unaffected. Staging sets `ESCROW_STUB_MODE=false` to perform real charges.
2. `CampaignService::fundEscrow(Campaign, float): string`
   - Stub mode → returns `pending_<id>` placeholder (unchanged behaviour).
   - Real mode → validates the brand has a Stripe customer + default payment method, then
     charges off-session via Cashier. Returns the real PaymentIntent ID. Aborts 422 with a
     clear message on failure / SCA-required.
   - Charge happens **before** the DB transaction (no external calls inside a transaction).
3. `publish()` and `republish()` use `fundEscrow()` to set the real PaymentIntent ID.
4. Verify command (`payout:verify-flow`) extended to mirror staging more faithfully:
   `--connect=acct_...`, Connect active-status check, available-balance check, queue note.
5. `context/project-overview.md` 3.6 status corrected (was wrongly marked 🟢 Complete).

## Staging prerequisites (for a flawless manual test)

1. `ESCROW_STUB_MODE=false` + Stripe **test** keys.
2. Brand has subscribed (has a saved default payment method).
3. Creator has a fully-onboarded Connect account (`stripe_connect_status = active`).
4. A queue worker / Horizon is running (`ProcessPayoutJob` is queued).
5. Payout amount ≥ `min_creator_payout` ($25), else it is silently held.
6. Note: real charges land in Stripe **pending** balance first and become **available** on a
   rolling delay — instant payouts may need available balance to already exist.

## Status

In progress.
