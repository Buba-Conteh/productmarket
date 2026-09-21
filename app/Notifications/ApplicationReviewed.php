<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\CampaignApplication;
use App\Notifications\Concerns\RespectsNotificationPreferences;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

final class ApplicationReviewed extends Notification implements ShouldQueue
{
    use Queueable, RespectsNotificationPreferences;

    public function __construct(
        public readonly CampaignApplication $application,
    ) {}

    /** @return string[] */
    public function via(object $notifiable): array
    {
        return $this->channels($notifiable, 'application_reviewed');
    }

    public function toMail(object $notifiable): MailMessage
    {
        $campaignTitle = $this->application->campaign->title;

        $mail = (new MailMessage)
            ->greeting("Hi {$notifiable->name},");

        if ($this->approved()) {
            return $mail
                ->subject("Application approved — {$campaignTitle}")
                ->line("Your application to **{$campaignTitle}** was approved.")
                ->action('Submit Your Entry', url($this->url()))
                ->line('You can now submit your pitch entry to the brand.');
        }

        return $mail
            ->subject("Application update — {$campaignTitle}")
            ->line("Your application to **{$campaignTitle}** was not accepted this time.")
            ->action('Browse Campaigns', url('/discover'))
            ->line('Keep an eye out — new campaigns are posted regularly.');
    }

    /** @return array<string, mixed> */
    public function toArray(object $notifiable): array
    {
        $campaignTitle = $this->application->campaign->title;

        return [
            'type' => 'application_reviewed',
            'application_id' => $this->application->id,
            'campaign_id' => $this->application->campaign_id,
            'campaign_title' => $campaignTitle,
            'status' => $this->application->status,
            'message' => $this->approved()
                ? "Your application to {$campaignTitle} was approved — you can now submit an entry"
                : "Your application to {$campaignTitle} was not accepted",
            'url' => $this->url(),
        ];
    }

    private function approved(): bool
    {
        return $this->application->status === 'approved';
    }

    private function url(): string
    {
        return $this->approved()
            ? "/discover/{$this->application->campaign_id}"
            : '/discover';
    }
}
