# UI Polish 2 — Sidebar Navigation

**Status:** 🟢 Complete
**Branch:** fix/creator-sidebar-nav (merged, deleted)

## Overview

Second of four creator-facing UI/process improvements. Messages, Analytics,
and Referrals were fully built, routed, and documented as shipped
(`context/features/8-messaging-notifications.md`, `9-analytics.md`,
`10-growth.md`), but had no link in the sidebar
([app-sidebar.tsx](../../resources/js/components/app-sidebar.tsx)) — only
reachable by typing the URL directly. A prior commit (`312c3ec`) removed
these links, describing them as "unimplemented," which was inaccurate for
these three (only Achievements/Billing genuinely weren't built).

## Changes

Added to both `brandSections` and `creatorSections`:

| Section | Item | Href |
|---|---|---|
| Communication | Messages | `/messages` (shared route) |
| Insights | Analytics | `/analytics` (brand) / `/creator/analytics` (creator) |
| Growth | Referrals | `/referrals` (shared route) |

## Decisions

- Kept raw path strings to match the file's existing convention rather than
  introducing Wayfinder route helpers.
- Left Achievements/Billing untouched — the removal commit's description of
  those two as unimplemented still holds.

## Verification

- `npm run types:check` — pass.
- `npm run lint:check` — no errors in the touched file.
- `npm run build` — pass.
