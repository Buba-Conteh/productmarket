<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\EntryEditRequest;
use App\Notifications\Concerns\RespectsNotificationPreferences;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

final class EntryEditRequested extends Notification implements ShouldQueue
{
    use Queueable, RespectsNotificationPreferences;

    public function __construct(
        public readonly EntryEditRequest $editRequest,
    ) {}

    /** @return string[] */
    public function via(object $notifiable): array
    {
        return $this->channels($notifiable, 'entry_edit_requested');
    }

    public function toMail(object $notifiable): MailMessage
    {
        $campaignTitle = $this->editRequest->entry->campaign->title;

        return (new MailMessage)
            ->subject("Edit requested on your entry — {$campaignTitle}")
            ->greeting("Hi {$notifiable->name},")
            ->line("The brand has requested changes to your entry for **{$campaignTitle}**.")
            ->line("Notes: {$this->editRequest->notes}")
            ->action('View Entry', url("/creator/entries/{$this->editRequest->entry_id}"));
    }

    /** @return array<string, mixed> */
    public function toArray(object $notifiable): array
    {
        $campaignTitle = $this->editRequest->entry->campaign->title;

        return [
            'type' => 'entry_edit_requested',
            'entry_id' => $this->editRequest->entry_id,
            'edit_request_id' => $this->editRequest->id,
            'campaign_title' => $campaignTitle,
            'notes' => $this->editRequest->notes,
            'message' => "Edit requested on your entry for {$campaignTitle}",
            'url' => "/creator/entries/{$this->editRequest->entry_id}",
        ];
    }
}
