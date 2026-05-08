<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\Entry;
use App\Notifications\Concerns\RespectsNotificationPreferences;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

final class EntryNotSelected extends Notification implements ShouldQueue
{
    use Queueable, RespectsNotificationPreferences;

    public function __construct(
        public readonly Entry $entry,
    ) {}

    /** @return string[] */
    public function via(object $notifiable): array
    {
        return $this->channels($notifiable, 'entry_not_selected');
    }

    public function toMail(object $notifiable): MailMessage
    {
        $campaignTitle = $this->entry->campaign->title;

        return (new MailMessage)
            ->subject("Contest results — {$campaignTitle}")
            ->greeting("Hi {$notifiable->name},")
            ->line("Thank you for entering the **{$campaignTitle}** contest.")
            ->line('A winner has been selected and your entry was not chosen this time.')
            ->action('View Entry', url("/creator/entries/{$this->entry->id}"))
            ->line('Keep creating — we hope to see you in future campaigns!');
    }

    /** @return array<string, mixed> */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'entry_not_selected',
            'entry_id' => $this->entry->id,
            'campaign_id' => $this->entry->campaign_id,
            'campaign_title' => $this->entry->campaign->title,
            'message' => "A winner was selected for \"{$this->entry->campaign->title}\" — your entry was not chosen this time.",
            'url' => "/creator/entries/{$this->entry->id}",
        ];
    }
}
