<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\CampaignApplication;
use App\Notifications\Concerns\RespectsNotificationPreferences;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

final class ApplicationSubmitted extends Notification implements ShouldQueue
{
    use Queueable, RespectsNotificationPreferences;

    public function __construct(
        public readonly CampaignApplication $application,
    ) {}

    /** @return string[] */
    public function via(object $notifiable): array
    {
        return $this->channels($notifiable, 'application_submitted');
    }

    public function toMail(object $notifiable): MailMessage
    {
        $creatorName = $this->application->creator->display_name;
        $campaignTitle = $this->application->campaign->title;

        return (new MailMessage)
            ->subject("New application — {$campaignTitle}")
            ->greeting("Hi {$notifiable->name},")
            ->line("{$creatorName} applied to your Pitch campaign **{$campaignTitle}**.")
            ->action('Review Applications', url($this->url()))
            ->line('Approve the application to let the creator submit an entry.');
    }

    /** @return array<string, mixed> */
    public function toArray(object $notifiable): array
    {
        $creatorName = $this->application->creator->display_name;
        $campaignTitle = $this->application->campaign->title;

        return [
            'type' => 'application_submitted',
            'application_id' => $this->application->id,
            'campaign_id' => $this->application->campaign_id,
            'campaign_title' => $campaignTitle,
            'creator_name' => $creatorName,
            'message' => "{$creatorName} applied to {$campaignTitle}",
            'url' => $this->url(),
        ];
    }

    private function url(): string
    {
        return "/campaigns/{$this->application->campaign_id}/applications";
    }
}
