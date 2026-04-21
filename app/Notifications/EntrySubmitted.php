<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\Entry;
use App\Notifications\Concerns\RespectsNotificationPreferences;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

final class EntrySubmitted extends Notification implements ShouldQueue
{
    use Queueable, RespectsNotificationPreferences;

    public function __construct(
        public readonly Entry $entry,
    ) {}

    /** @return string[] */
    public function via(object $notifiable): array
    {
        return $this->channels($notifiable, 'entry_submitted');
    }

    public function toMail(object $notifiable): MailMessage
    {
        $creatorName = $this->entry->creator->display_name;
        $campaignTitle = $this->entry->campaign->title;

        return (new MailMessage)
            ->subject("New entry submitted — {$campaignTitle}")
            ->greeting("Hi {$notifiable->name},")
            ->line("{$creatorName} submitted an entry for **{$campaignTitle}**.")
            ->action('Review Entry', url("/brand/entries/{$this->entry->id}"))
            ->line('Log in to review and approve or request edits.');
    }

    /** @return array<string, mixed> */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'entry_submitted',
            'entry_id' => $this->entry->id,
            'campaign_id' => $this->entry->campaign_id,
            'campaign_title' => $this->entry->campaign->title,
            'creator_name' => $this->entry->creator->display_name,
            'message' => "{$this->entry->creator->display_name} submitted an entry for {$this->entry->campaign->title}",
            'url' => "/brand/entries/{$this->entry->id}",
        ];
    }
}
