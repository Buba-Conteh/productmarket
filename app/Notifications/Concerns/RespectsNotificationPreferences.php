<?php

declare(strict_types=1);

namespace App\Notifications\Concerns;

trait RespectsNotificationPreferences
{
    /** @return string[] */
    protected function channels(object $notifiable, string $type): array
    {
        if (! method_exists($notifiable, 'notificationPreferences')) {
            return ['database', 'mail'];
        }

        $prefs = $notifiable->notificationPreferences()
            ->where('type', $type)
            ->first();

        $channels = [];

        if (! $prefs || $prefs->in_app_enabled) {
            $channels[] = 'database';
        }

        if (! $prefs || $prefs->email_enabled) {
            $channels[] = 'mail';
        }

        return $channels ?: ['database'];
    }
}
