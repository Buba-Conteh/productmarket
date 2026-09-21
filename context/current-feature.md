# Current Feature — Notification Bell Fix

**Status:** 🟢 Complete (awaiting commit)
**Branch:** fix/notification-bell
**Started:** 2026-09-21

## Goal

Make the top-nav notification bell actually work so brands and creators get
updates when key events happen (entry submitted / approved / rejected / live,
pitch applications, contest results, payouts, messages).

## Root causes found

1. The sidebar layout header rendered a decorative bell, not the
   `NotificationBell` component.
2. No queue worker had ever run locally — 15 notification jobs stuck in
   `jobs`, 0 rows in `notifications`.
3. Every notification linked to a non-existent route.

## Summary of changes

See `context/features/notification-bell-fix.md` for the full write-up.

## Verification

- `./vendor/bin/pint` — pass
- `npm run types:check`, ESLint on changed files, `npm run build` — pass
- `./vendor/bin/pest tests/Feature/Messaging/NotificationTest.php` — 8 passed
