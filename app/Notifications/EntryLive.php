<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\Entry;
use App\Notifications\Concerns\RespectsNotificationPreferences;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

final class EntryLive extends Notification implements ShouldQueue
{
    use Queueable, RespectsNotificationPreferences;

    public function __construct(
        public readonly Entry $entry,
    ) {}

    /** @return string[] */
    public function via(object $notifiable): array
    {
        return $this->channels($notifiable, 'entry_live');
    }

    public function toMail(object $notifiable): MailMessage
    {
        $creatorName = $this->entry->creator->display_name;
        $campaignTitle = $this->entry->campaign->title;

        return (new MailMessage)
            ->subject("Content is live — {$campaignTitle}")
            ->greeting("Hi {$notifiable->name},")
            ->line("{$creatorName} has posted their content for **{$campaignTitle}**.")
            ->action('View Entry', url($this->url()))
            ->line('Verified view tracking starts now.');
    }

    /** @return array<string, mixed> */
    public function toArray(object $notifiable): array
    {
        $creatorName = $this->entry->creator->display_name;
        $campaignTitle = $this->entry->campaign->title;

        return [
            'type' => 'entry_live',
            'entry_id' => $this->entry->id,
            'campaign_id' => $this->entry->campaign_id,
            'campaign_title' => $campaignTitle,
            'creator_name' => $creatorName,
            'message' => "{$creatorName} posted their content for {$campaignTitle}",
            'url' => $this->url(),
        ];
    }

    private function url(): string
    {
        return "/campaigns/{$this->entry->campaign_id}/entries/{$this->entry->id}";
    }
}
