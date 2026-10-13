# Current Feature — International creator payouts

**Status:** 🟡 Implemented — awaiting staging verification (see context/features/fix-international-creator-payouts.md)
**Branch:** `fix/international-creator-payouts`

## Goals

1. Create each creator's Stripe payout account in their own country (not always US).
2. Request only the `transfers` capability; use the `recipient` agreement outside the US.
3. Replace unfinished accounts that were created in the wrong country.
4. Show a clear message when Stripe can't pay out to a creator's country.
