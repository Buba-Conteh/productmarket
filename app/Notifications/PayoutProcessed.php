<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\Payout;
use App\Notifications\Concerns\RespectsNotificationPreferences;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

final class PayoutProcessed extends Notification implements ShouldQueue
{
    use Queueable, RespectsNotificationPreferences;

    public function __construct(
        public readonly Payout $payout,
    ) {}

    /** @return string[] */
    public function via(object $notifiable): array
    {
        return $this->channels($notifiable, 'payout_processed');
    }

    public function toMail(object $notifiable): MailMessage
    {
        $amount = number_format((float) $this->payout->net_amount, 2);
        $campaignTitle = $this->payout->campaign->title;

        return (new MailMessage)
            ->subject("Payout of \${$amount} processed")
            ->greeting("Hi {$notifiable->name},")
            ->line("A payout of **\${$amount}** for **{$campaignTitle}** has been sent to your account.")
            ->action('View Earnings', url('/creator/earnings'));
    }

    /** @return array<string, mixed> */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'payout_processed',
            'payout_id' => $this->payout->id,
            'campaign_id' => $this->payout->campaign_id,
            'campaign_title' => $this->payout->campaign->title,
            'net_amount' => $this->payout->net_amount,
            'message' => 'Payout of $'.number_format((float) $this->payout->net_amount, 2)." processed for {$this->payout->campaign->title}",
            'url' => '/creator/earnings',
        ];
    }
}
