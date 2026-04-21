<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\Message;
use App\Notifications\Concerns\RespectsNotificationPreferences;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

final class NewMessage extends Notification implements ShouldQueue
{
    use Queueable, RespectsNotificationPreferences;

    public function __construct(
        public readonly Message $message,
    ) {}

    /** @return string[] */
    public function via(object $notifiable): array
    {
        // New message notifications are in-app only (no email per message)
        $prefs = $notifiable->notificationPreferences()->where('type', 'new_message')->first();

        if ($prefs && ! $prefs->in_app_enabled) {
            return [];
        }

        return ['database'];
    }

    /** @return array<string, mixed> */
    public function toArray(object $notifiable): array
    {
        $senderName = $this->message->sender->name;
        $thread = $this->message->thread;

        return [
            'type' => 'new_message',
            'message_id' => $this->message->id,
            'thread_id' => $this->message->thread_id,
            'sender_name' => $senderName,
            'message' => "{$senderName} sent you a message",
            'url' => "/messages/{$thread->id}",
        ];
    }
}
