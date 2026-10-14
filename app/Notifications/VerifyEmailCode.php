<?php

declare(strict_types=1);

namespace App\Notifications;

use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Sent synchronously (not queued) so the code arrives while the user is
 * waiting on the verification screen, even without a queue worker.
 */
final class VerifyEmailCode extends Notification
{
    public function __construct(
        public readonly string $code,
        public readonly int $expiresInMinutes,
    ) {}

    /** @return string[] */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("{$this->code} is your ".config('app.name').' verification code')
            ->greeting("Hi {$notifiable->name},")
            ->line('Enter this code to verify your email address:')
            ->line("# {$this->code}")
            ->line("This code expires in {$this->expiresInMinutes} minutes.")
            ->line('If you did not create an account, no further action is required.');
    }
}
