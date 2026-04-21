# Phase 8 — Messaging & Notifications

**Status:** Complete  
**Branch:** feature/phase-8-messaging-notifications  
**Completed:** 2026-04-21

---

## Features Shipped

| # | Feature | Status |
|---|---|---|
| 8.1 | Message threads per entry | ✅ Complete |
| 8.2 | Real-time messaging via Reverb | ✅ Complete |
| 8.3 | In-app notifications via Reverb | ✅ Complete |
| 8.4 | Email notifications via Resend | ✅ Complete |
| 8.5 | Notification preferences | ✅ Complete |
| 4.12 | Entry status notifications (deferred) | ✅ Complete |

---

## Overview

Full messaging and real-time notification system built on Laravel Reverb (WebSockets) + Laravel's database notification channel + Resend for email.

---

## Implementation

### Backend

**Migrations**
- `notifications` — Laravel default DB notifications table
- `user_notification_preferences` — per-user, per-type in-app/email toggles

**Models**
- `UserNotificationPreference` — stores user_id, type, in_app_enabled, email_enabled
- `User` — added `notificationPreferences()` HasMany relationship

**Events (Reverb Broadcasting)**
- `MessageSent` — broadcasts on `private thread.{threadId}` when a message is sent
- `NotificationCreated` — broadcasts on `private notifications.{userId}` when a DB notification is created

**Channels (`routes/channels.php`)**
- `thread.{threadId}` — authorized if user is the brand or creator of the thread's entry
- `notifications.{userId}` — authorized if user's ID matches

**Observer**
- `DatabaseNotificationObserver` — fires `NotificationCreated` event on every new database notification, providing automatic Reverb broadcast for all notification types

**Notification Classes** (all implement `ShouldQueue` + `RespectsNotificationPreferences` trait)
- `EntrySubmitted` — sent to brand when creator submits
- `EntryApproved` — sent to creator when entry approved
- `EntryRejected` — sent to creator when entry rejected
- `EntryEditRequested` — sent to creator when brand requests edit
- `EntryWon` — sent to creator when they win a contest
- `PayoutProcessed` — sent to creator when payout successfully transferred
- `NewMessage` — in-app only, sent to the other thread party on new message

**Notification Preference Trait** (`RespectsNotificationPreferences`)
- Each notification checks user's stored preferences for that type before deciding which channels (database / mail) to use
- Falls back to both channels if no preference record exists

**Services Updated**
- `EntryService` — fires EntrySubmitted, EntryApproved, EntryRejected, EntryEditRequested, EntryWon notifications at each state transition
- `PayoutService` — fires PayoutProcessed notification after successful Stripe transfer

**Controllers** (all in `App\Http\Controllers\Messaging\`)
- `MessageThreadController::index` — lists threads scoped to current user (brand sees their campaign threads, creator sees their entry threads)
- `MessageThreadController::show` — shows thread for an entry, creates thread if first visit, marks unread as read
- `MessageController::store` — posts new message, broadcasts via Reverb, notifies other party
- `NotificationController::index` — JSON endpoint returning recent 20 notifications + unread count
- `NotificationController::markRead` / `markAllRead` — mark read endpoints
- `NotificationPreferenceController::index` / `update` — settings page for per-type opt-outs

**Routes** (`routes/messaging.php`)
- `GET /messages` — thread list
- `GET /messages/entry/{entry}` — thread view
- `POST /messages/{thread}` — send message
- `GET /notifications` — JSON notifications list (used by bell dropdown)
- `POST /notifications/{id}/read` — mark single read
- `POST /notifications/read-all` — mark all read
- `GET /settings/notifications` — preferences page
- `PUT /settings/notifications` — update preferences

**Inertia Shared Props**
- `unreadNotifications` count added to every page via `HandleInertiaRequests`

### Frontend

**Echo Setup**
- `resources/js/echo.ts` — initializes Laravel Echo with Reverb broadcaster
- Exposed as `window.Echo` in `app.tsx`
- Dependencies: `laravel-echo`, `pusher-js`, `date-fns`

**Hook**
- `useNotifications` — fetches notifications via JSON API, listens on `notifications.{userId}` Reverb channel for real-time updates, provides `markAllRead`

**Pages**
- `pages/messages/index.tsx` — thread list with unread badge counts, other party name, last message preview
- `pages/messages/show.tsx` — real-time chat view: optimistic messages, Enter-to-send, listens on `thread.{threadId}` Reverb channel
- `pages/settings/notification-preferences.tsx` — per-type in-app/email checkboxes

**Components**
- `NotificationBell` — header bell with unread count badge, dropdown of recent notifications, mark-all-read, real-time Reverb updates

**Layout Updates**
- `AppHeader` — NotificationBell added to right nav
- `SettingsLayout` — "Notifications" link added to settings sidebar
- Messaging links were already in `AppSidebar` for both brand and creator roles
