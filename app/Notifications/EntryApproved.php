<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\Entry;
use App\Notifications\Concerns\RespectsNotificationPreferences;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

final class EntryApproved extends Notification implements ShouldQueue
{
    use Queueable, RespectsNotificationPreferences;

    public function __construct(
        public readonly Entry $entry,
    ) {}

    /** @return string[] */
    public function via(object $notifiable): array
    {
        return $this->channels($notifiable, 'entry_approved');
    }

    public function toMail(object $notifiable): MailMessage
    {
        $campaignTitle = $this->entry->campaign->title;

        return (new MailMessage)
            ->subject("Your entry was approved — {$campaignTitle}")
            ->greeting("Hi {$notifiable->name},")
            ->line("Great news! Your entry for **{$campaignTitle}** has been approved.")
            ->action('View Entry', url("/creator/entries/{$this->entry->id}"))
            ->line('Post your content and submit the live URL to start earning.');
    }

    /** @return array<string, mixed> */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'entry_approved',
            'entry_id' => $this->entry->id,
            'campaign_id' => $this->entry->campaign_id,
            'campaign_title' => $this->entry->campaign->title,
            'message' => "Your entry for {$this->entry->campaign->title} was approved",
            'url' => "/creator/entries/{$this->entry->id}",
        ];
    }
}
