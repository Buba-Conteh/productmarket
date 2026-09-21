<?php

declare(strict_types=1);

namespace App\Observers;

use App\Events\NotificationCreated;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Throwable;

final class DatabaseNotificationObserver
{
    public function created(DatabaseNotification $notification): void
    {
        // The unread badge count is cached per user in HandleInertiaRequests;
        // drop it so the next page load reflects the new notification.
        Cache::forget("unread_notifications_{$notification->notifiable_id}");

        try {
            NotificationCreated::dispatch(
                $notification->notifiable_id,
                $notification,
            );
        } catch (Throwable $e) {
            // A broadcast failure (e.g. Reverb not running) must never break
            // the notification itself — the database row already exists and
            // will show up in the bell on the next fetch.
            Log::warning('Failed to broadcast notification', [
                'notification_id' => $notification->id,
                'user_id' => $notification->notifiable_id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
