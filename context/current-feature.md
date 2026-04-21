# Phase 8 — Messaging & Notifications

**Status:** In Progress  
**Branch:** feature/phase-8-messaging-notifications  
**Started:** 2026-04-21

---

## Features

| # | Feature | Status |
|---|---|---|
| 8.1 | Message threads per entry | 🟡 In Progress |
| 8.2 | Real-time messaging via Reverb | 🟡 In Progress |
| 8.3 | In-app notifications via Reverb | 🟡 In Progress |
| 8.4 | Email notifications via Resend | 🟡 In Progress |
| 8.5 | Notification preferences | 🟡 In Progress |
| 4.12 | Entry status notifications (deferred) | 🟡 In Progress |

---

## Overview

Full messaging and notification system. Threads are scoped one-per-entry between brand and creator. Messages deliver in real-time via Laravel Reverb (WebSockets). In-app notification bell shows unread events broadcast over a private Reverb channel. Email fallbacks via Resend. User-level opt-out preferences stored per notification type.

---

## Implementation Plan

### Backend

1. **Migrations**
   - `notifications` table (Laravel default)
   - `user_notification_preferences` table — per-user toggles for each event type (in-app + email)

2. **Models**
   - `UserNotificationPreference` — stores user_id, type, in_app_enabled, email_enabled

3. **Events & Broadcasting**
   - `MessageSent` — broadcast on private `thread.{threadId}` channel
   - `NotificationCreated` — broadcast on private `notifications.{userId}` channel

4. **Notification Classes**
   - EntrySubmitted, EntryApproved, EntryRejected, EntryEditRequested, EntryWon, PayoutProcessed, NewMessage

5. **Controllers**
   - MessageThreadController, MessageController, NotificationPreferenceController, NotificationController

### Frontend

1. `/messages` — thread list; `/messages/{thread}` — thread view with real-time updates
2. Notification bell in AppHeader with unread count + dropdown
3. Notification Preferences settings page
4. Echo wired to Reverb private channels

---

## Notification Event Types

| Event | Who Receives | Channels |
|---|---|---|
| entry_submitted | Brand | In-app + Email |
| entry_approved | Creator | In-app + Email |
| entry_rejected | Creator | In-app + Email |
| entry_edit_requested | Creator | In-app + Email |
| entry_won | Creator | In-app + Email |
| payout_processed | Creator | In-app + Email |
| new_message | Both | In-app only |

---

## History

- 2026-04-21: Phase 8 documented, implementation started
