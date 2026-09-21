# Notification Bell — Working In-App Notifications

**Status:** Complete
**Branch:** fix/notification-bell
**Date:** 2026-09-21

---

## Problem

Notifications were "never seen working". Three independent causes:

1. **Decorative bell.** `AppLayout` renders `app-sidebar-layout`, whose header
   (`app-sidebar-header.tsx`) had a static `<Bell>` button with a hard-coded
   dot — no dropdown, no data, no Echo listener. The functional
   `NotificationBell` component only lived in `app-header.tsx`, which no
   layout uses.
2. **Queue never ran.** Every notification implements `ShouldQueue` and the
   local queue is `database`. 15 notification jobs from May testing were
   sitting unprocessed in `jobs`, with zero rows in `notifications`.
3. **Broken links.** Every notification pointed at routes that do not exist
   (`/brand/entries/{id}`, `/creator/entries/{id}`, `/creator/earnings`,
   `/messages/{thread}`, `/admin/payouts`).

## Changes

### Frontend
- `components/app-sidebar-header.tsx` — replaced the decorative bell with
  `<NotificationBell />` (also covers the admin layout, which shares this
  header).
- `hooks/use-notifications.ts` — added `markRead(id)`, re-syncs the badge
  from the shared `unreadNotifications` prop on each Inertia visit, dedupes
  real-time events, shows a Sonner toast when a notification arrives over
  Reverb, sends JSON/XHR headers, tolerates network failures.
- `components/notification-bell.tsx` — marks a notification read on click,
  numeric badge with `9+` overflow, accessible label.
- `pages/settings/notification-preferences.tsx` — labels for the 3 new types.

### Backend
- `NotificationController` — `markRead`/`markAllRead` now return JSON (they
  returned redirects to a fetch caller) and bust the per-user cached unread
  count; `markAllRead` is a single UPDATE.
- `DatabaseNotificationObserver` — busts the cached unread count on create;
  wraps the Reverb broadcast in try/catch so a stopped Reverb server can never
  fail the queued notification job (the DB row already exists).
- URLs corrected in all 10 existing notifications:
  - brand entry → `/campaigns/{campaign}/entries/{entry}`
  - creator entry → `/entries/{entry}`, list → `/entries`
  - discovery → `/discover`, earnings → `/wallet`
  - messages → `/messages/entry/{entry}`, admin → `/admin`
- New notifications for key events that had none:
  - `ApplicationSubmitted` → brand, when a creator applies to a Pitch campaign
  - `ApplicationReviewed` → creator, when the brand approves/rejects
  - `EntryLive` → brand, when the creator marks their content live
  - `PayoutFailureAlert` → now also `database` so admins see it in the bell
- `NotificationPreferenceController::TYPES` — added `application_submitted`,
  `application_reviewed`, `entry_live`.
- `composer dev` — now also starts `php artisan reverb:start`.

### Tests
`tests/Feature/Messaging/NotificationTest.php` — 8 tests covering: DB row +
correct route on entry submit, bell JSON endpoint, cached badge refresh,
mark one / mark all read, cross-user authorization, pitch application
round-trip, entry-live notification.

## Running locally

Notifications are queued. For them to appear you must run a worker, and for
real-time delivery Reverb must be running:

```bash
composer dev            # serve + queue:listen + vite + reverb:start
# or individually
php artisan queue:work
php artisan reverb:start
```

Without Reverb the bell still works — new notifications show on the next
dropdown open or page load, just without the live toast.

## Not done
- The 15 stale jobs from May are still in the `jobs` table. One is a
  `ProcessPayoutJob` that would hit the real Stripe client, so they were not
  drained automatically. Run `php artisan queue:work --stop-when-empty` to
  process them, or `php artisan queue:clear` to discard them.
