<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\Payout;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

final class PayoutFailureAlert extends Notification
{
    use Queueable;

    public function __construct(private readonly Payout $payout) {}

    /** @return array<int, string> */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $payout = $this->payout;
        $creator = $payout->creator->user;

        return (new MailMessage)
            ->error()
            ->subject("Payout Failed After {$payout->retry_count} Attempts — Action Required")
            ->greeting('Payout Failure Alert')
            ->line("A payout has failed after {$payout->retry_count} attempts and requires manual review.")
            ->line("**Payout ID:** {$payout->id}")
            ->line("**Creator:** {$creator->name} ({$creator->email})")
            ->line("**Amount:** \${$payout->net_amount} (gross: \${$payout->gross_amount})")
            ->line("**Type:** {$payout->payout_type}")
            ->line("**Failure Reason:** {$payout->failure_reason}")
            ->action('Review in Admin Panel', url('/admin/payouts'))
            ->line('Please investigate and retry or contact the creator as needed.');
    }
}
