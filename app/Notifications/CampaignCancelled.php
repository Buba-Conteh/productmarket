<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\Campaign;
use App\Notifications\Concerns\RespectsNotificationPreferences;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

final class CampaignCancelled extends Notification implements ShouldQueue
{
    use Queueable, RespectsNotificationPreferences;

    public function __construct(
        public readonly Campaign $campaign,
    ) {}

    /** @return string[] */
    public function via(object $notifiable): array
    {
        return $this->channels($notifiable, 'campaign_cancelled');
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("Campaign cancelled — {$this->campaign->title}")
            ->greeting("Hi {$notifiable->name},")
            ->line("We're letting you know that the campaign **{$this->campaign->title}** has been cancelled by the brand.")
            ->action('Browse Campaigns', url('/creator/campaigns'))
            ->line('We hope to see you participate in other campaigns soon.');
    }

    /** @return array<string, mixed> */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'campaign_cancelled',
            'campaign_id' => $this->campaign->id,
            'campaign_title' => $this->campaign->title,
            'message' => "The campaign \"{$this->campaign->title}\" has been cancelled.",
            'url' => '/creator/campaigns',
        ];
    }
}
