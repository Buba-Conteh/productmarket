<?php

declare(strict_types=1);

namespace App\Observers;

use App\Events\NotificationCreated;
use Illuminate\Notifications\DatabaseNotification;

final class DatabaseNotificationObserver
{
    public function created(DatabaseNotification $notification): void
    {
        NotificationCreated::dispatch(
            $notification->notifiable_id,
            $notification,
        );
    }
}
