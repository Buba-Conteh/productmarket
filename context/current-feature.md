# Current Feature — Creator UI Polish: Responsive & Consistency Fixes

**Status:** In Progress
**Branch:** fix/creator-ui-consistency
**Started:** 2026-09-20

## Goal

Part 3 of 4. Three concrete inconsistencies found in the creator-facing UI
survey:

1. **Earnings payout table is not horizontally scrollable.** `creator/earnings.tsx:154`
   wraps the 7-column table in `overflow-hidden rounded-xl border` with no
   `overflow-x-auto`, unlike every other table in the app
   (`growth/referrals.tsx`, `analytics/brand.tsx`). On narrow viewports the
   table will clip or squish instead of scrolling.
2. **Messages list has no page padding.** `messages/index.tsx:26` wraps its
   content in bare `space-y-6` with no `px-*/py-*`, while every sibling
   page (`campaigns/creator/index.tsx`, `entries/creator/index.tsx`,
   `growth/*.tsx`, `analytics/creator.tsx`) uses `px-4 py-6` (or `p-6`).
   Content sits flush against the viewport edge.
3. **Creator profile stats are hand-rolled instead of using `StatCard`.**
   `profiles/creator/show.tsx:122-165` builds 3 stat tiles from scratch
   (plain `Card`/`CardContent` + icon + number), duplicating markup that
   `components/dashboard/stat-card.tsx` already provides and that
   dashboard/earnings/analytics all use.

## Decisions

- Leave `messages/show.tsx` (the chat thread view) untouched — it's
  intentionally full-bleed for a messenger-style layout, unlike the list
  page.
- Leave `profiles/creator/media-kit.tsx`'s stat block untouched — it's a
  minimal, print-friendly one-pager; `StatCard`'s shadow/gradient/rounded-2xl
  styling doesn't belong on a printable sheet, and this page is deliberately
  different from the rest of the app for that reason.
- Gave "Total Earned" `accent="primary"` to match how `creator/earnings.tsx`
  treats the same metric; the other two (Views, Live Campaigns) stay
  `neutral` (default).

## Scope

- `resources/js/pages/creator/earnings.tsx`
- `resources/js/pages/messages/index.tsx`
- `resources/js/pages/profiles/creator/show.tsx`

## Verification

- `npm run types:check` — pass.
- `npm run lint:check` — no errors in the touched files.
- `npm run build` — pass.

## Status: 🟢 Complete
