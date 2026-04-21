<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\Entry;
use App\Notifications\Concerns\RespectsNotificationPreferences;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

final class EntryRejected extends Notification implements ShouldQueue
{
    use Queueable, RespectsNotificationPreferences;

    public function __construct(
        public readonly Entry $entry,
    ) {}

    /** @return string[] */
    public function via(object $notifiable): array
    {
        return $this->channels($notifiable, 'entry_rejected');
    }

    public function toMail(object $notifiable): MailMessage
    {
        $campaignTitle = $this->entry->campaign->title;
        $reason = $this->entry->rejection_reason ?? 'No reason provided.';

        return (new MailMessage)
            ->subject("Entry not accepted — {$campaignTitle}")
            ->greeting("Hi {$notifiable->name},")
            ->line("Your entry for **{$campaignTitle}** was not accepted.")
            ->line("Reason: {$reason}")
            ->action('View Entry', url("/creator/entries/{$this->entry->id}"));
    }

    /** @return array<string, mixed> */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'entry_rejected',
            'entry_id' => $this->entry->id,
            'campaign_id' => $this->entry->campaign_id,
            'campaign_title' => $this->entry->campaign->title,
            'reason' => $this->entry->rejection_reason,
            'message' => "Your entry for {$this->entry->campaign->title} was not accepted",
            'url' => "/creator/entries/{$this->entry->id}",
        ];
    }
}
