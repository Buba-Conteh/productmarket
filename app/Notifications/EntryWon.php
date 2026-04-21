<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\Entry;
use App\Notifications\Concerns\RespectsNotificationPreferences;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

final class EntryWon extends Notification implements ShouldQueue
{
    use Queueable, RespectsNotificationPreferences;

    public function __construct(
        public readonly Entry $entry,
    ) {}

    /** @return string[] */
    public function via(object $notifiable): array
    {
        return $this->channels($notifiable, 'entry_won');
    }

    public function toMail(object $notifiable): MailMessage
    {
        $campaignTitle = $this->entry->campaign->title;
        $prize = $this->entry->campaign->contestDetail->prize_amount ?? 0;

        return (new MailMessage)
            ->subject("You won the contest — {$campaignTitle} 🎉")
            ->greeting("Congratulations {$notifiable->name}!")
            ->line("Your entry won the **{$campaignTitle}** contest.")
            ->line("Prize: \${$prize} will be transferred to your account.")
            ->action('View Entry', url("/creator/entries/{$this->entry->id}"));
    }

    /** @return array<string, mixed> */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'entry_won',
            'entry_id' => $this->entry->id,
            'campaign_id' => $this->entry->campaign_id,
            'campaign_title' => $this->entry->campaign->title,
            'message' => "You won the {$this->entry->campaign->title} contest! 🎉",
            'url' => "/creator/entries/{$this->entry->id}",
        ];
    }
}
