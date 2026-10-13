# Fix — International creator payouts

**Status:** 🟡 Implemented — awaiting staging verification
**Branch:** `fix/international-creator-payouts`
**Related:** 6.1 Stripe Connect onboarding · builds on `fix-creator-payout-account.md`

## Problem

Every creator's Stripe Express account was created without a `country`, so
Stripe defaulted it to the platform country (US). A creator in the UK, The
Gambia, Nigeria, etc. was asked for a US bank account and could never finish
onboarding. Accounts also requested `card_payments`, which creators never use
and which Stripe refuses for cross-border (recipient) accounts.

## How it works now

The ProductMarket Stripe platform account is in the **US**
(`config('payouts.platform_country')`, env `STRIPE_PLATFORM_COUNTRY`).

| Creator country | Account created | Agreement | Capabilities |
|---|---|---|---|
| Same as platform (US) | Express, `country=US` | full | `transfers` only |
| Any other country | Express, creator's country | `recipient` | `transfers` only |
| Not supported by Stripe | — | — | Stripe rejects it; creator sees a clear message |

- Transfers are still sent in USD; Stripe converts to the creator's local
  currency (GBP, GMD, NGN, …) when it pays out to their bank. Cross-border
  payout fees apply (see Stripe Connect pricing).
- Transfers to `recipient` accounts take ~24h longer to become available.
- The escrow model (separate charges and transfers, no `on_behalf_of`) is the
  funds flow Stripe requires for cross-border payouts — no change needed.
- Stripe decides which countries are supported. There is no hard-coded list.

Verified against the Stripe sandbox (US platform): account creation succeeds for
US (full, USD), GB (recipient, GBP), GM (recipient, GMD), NG (recipient, NGN).
Without the recipient agreement, GB/DE need `card_payments` and GM/NG are refused.

## Changes

- `StripeConnectService`
  - `createExpressAccount()` — uses the creator's `users.country`; throws
    `UnsupportedPayoutCountryException` if missing or rejected by Stripe.
  - `accountParams()` — builds the params per the table above.
  - `prepareAccount()` — creates the account if missing; replaces an
    **unfinished** account that was created in the wrong country (all pre-fix
    accounts defaulted to US). Active accounts are never replaced.
- `Settings\PayoutAccountController` / `CreatorOnboardingController` — use
  `prepareAccount()`; show the unsupported-country message. Creators with no
  country pick one on the payout page (validated, saved to `users.country`).
- `PayoutAccountCard` — country picker when missing, shows payout country.
- Onboarding payout step shows flash errors.
- `config/payouts.php` — `platform_country`.

## Open risk — verify before relying on it

Stripe's docs page on cross-border payouts says recipient accounts outside
US/UK/EEA/CA/CH are served by "Global Payouts", while the API (sandbox) accepts
recipient accounts in GM/NG/IN. Do one end-to-end sandbox run on staging:
creator with country GM → complete Stripe test onboarding → approve a payout →
confirm the transfer succeeds. If Stripe rejects the transfer, the payout stays
held (not lost) and the admin Payouts page shows it.

## Tests
`tests/Feature/Payout/InternationalPayoutAccountTest.php`
