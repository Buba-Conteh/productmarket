<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\CampaignInvitation;
use App\Notifications\Concerns\RespectsNotificationPreferences;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Tells a creator a brand has invited them to enter a specific campaign.
 */
final class CampaignInvitationSent extends Notification implements ShouldQueue
{
    use Queueable, RespectsNotificationPreferences;

    public function __construct(
        public readonly CampaignInvitation $invitation,
    ) {}

    /** @return string[] */
    public function via(object $notifiable): array
    {
        return $this->channels($notifiable, 'campaign_invitation');
    }

    public function toMail(object $notifiable): MailMessage
    {
        $campaign = $this->invitation->campaign;
        $brand = $campaign->brand?->company_name ?? 'A brand';

        $mail = (new MailMessage)
            ->subject("{$brand} invited you to {$campaign->title}")
            ->greeting("Hi {$notifiable->name},")
            ->line("**{$brand}** would like you to create content for **{$campaign->title}**.");

        if ($this->invitation->message) {
            $mail->line('They added a note:')
                ->line("_{$this->invitation->message}_");
        }

        return $mail
            ->action('View Invitation', url($this->url()))
            ->line('You can accept and submit an entry, or decline if it is not a fit.');
    }

    /** @return array<string, mixed> */
    public function toArray(object $notifiable): array
    {
        $campaign = $this->invitation->campaign;
        $brand = $campaign->brand?->company_name ?? 'A brand';

        return [
            'type' => 'campaign_invitation',
            'invitation_id' => $this->invitation->id,
            'campaign_id' => $campaign->id,
            'campaign_title' => $campaign->title,
            'message' => "{$brand} invited you to enter {$campaign->title}",
            'url' => $this->url(),
        ];
    }

    private function url(): string
    {
        return "/discover/{$this->invitation->campaign_id}";
    }
}
