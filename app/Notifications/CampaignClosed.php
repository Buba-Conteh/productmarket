<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\Campaign;
use App\Notifications\Concerns\RespectsNotificationPreferences;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

final class CampaignClosed extends Notification implements ShouldQueue
{
    use Queueable, RespectsNotificationPreferences;

    public function __construct(
        public readonly Campaign $campaign,
    ) {}

    /** @return string[] */
    public function via(object $notifiable): array
    {
        return $this->channels($notifiable, 'campaign_closed');
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("Campaign closed — {$this->campaign->title}")
            ->greeting("Hi {$notifiable->name},")
            ->line("The campaign **{$this->campaign->title}** has been closed and is no longer accepting new entries.")
            ->action('View Your Entry', url('/creator/entries'))
            ->line('Thank you for participating.');
    }

    /** @return array<string, mixed> */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'campaign_closed',
            'campaign_id' => $this->campaign->id,
            'campaign_title' => $this->campaign->title,
            'message' => "The campaign \"{$this->campaign->title}\" has been closed.",
            'url' => '/creator/entries',
        ];
    }
}
