# UI Polish 3 — Responsive & Consistency Fixes

**Status:** 🟢 Complete
**Branch:** fix/creator-ui-consistency (merged, deleted)

## Overview

Third of four creator-facing UI/process improvements. Fixed three concrete
inconsistencies found in the creator UI survey.

## Changes

1. **Earnings payout table now scrolls horizontally.**
   [creator/earnings.tsx](../../resources/js/pages/creator/earnings.tsx) —
   swapped `overflow-hidden` for `overflow-x-auto` on the table wrapper and
   gave the `<table>` a `min-w-[720px]` so its 7 columns don't clip or
   squish on narrow viewports, matching the pattern already used in
   `growth/referrals.tsx` and `analytics/brand.tsx`.
2. **Messages list now has page padding.**
   [messages/index.tsx](../../resources/js/pages/messages/index.tsx) — added
   `px-4 py-6` to the outer wrapper so content no longer sits flush against
   the viewport edge, matching every sibling page. `messages/show.tsx` (the
   chat thread view) was left untouched — it's intentionally full-bleed.
3. **Creator public profile stats now use the shared `StatCard`.**
   [profiles/creator/show.tsx](../../resources/js/pages/profiles/creator/show.tsx) —
   replaced 3 hand-rolled `Card`/icon/number stat tiles with `StatCard`
   (`components/dashboard/stat-card.tsx`), the same component used on the
   dashboard, earnings, and analytics pages. "Total Earned" gets
   `accent="primary"` to match how the earnings page treats the same
   metric. `profiles/creator/media-kit.tsx`'s stat block was left as-is —
   it's a minimal, print-friendly one-pager where `StatCard`'s
   shadow/gradient styling doesn't belong.

## Verification

- `npm run types:check` — pass.
- `npm run lint:check` — no errors in the touched files.
- `npm run build` — pass.
