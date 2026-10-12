# Current Feature — Fix creator payout account & wallet figures

**Status:** 🟡 Implemented — awaiting staging verification (see context/features/fix-creator-payout-account.md)
**Branch:** `fix/creator-payout-account`

## Goals

1. Creators can connect / finish / manage their Stripe payout account at any time
   (Settings → Payout Account), not only during onboarding.
2. Payouts for creators without an active account are held (pending), not failed,
   and are sent automatically once the account is active (page sync + Connect webhook).
3. Payouts already failed in prod for "account not active" are recovered.
4. Wallet, dashboard, entries and analytics figures all come from the payout rows
   so they match the payout history.
5. Admin can see held/failed payouts and retry them.
