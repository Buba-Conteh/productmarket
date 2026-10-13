<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\EmailVerificationCode;
use App\Models\User;
use App\Notifications\VerifyEmailCode;
use Illuminate\Auth\Events\Verified;
use Illuminate\Support\Facades\Hash;

final class EmailVerificationCodeService
{
    /**
     * Generate a fresh code for the user, store it hashed, and email it.
     *
     * Any outstanding codes are invalidated so only the latest one works.
     */
    public function send(User $user): void
    {
        EmailVerificationCode::query()
            ->where('user_id', $user->id)
            ->whereNull('consumed_at')
            ->update(['consumed_at' => now()]);

        $code = $this->generateCode();
        $ttl = $this->ttl();

        EmailVerificationCode::create([
            'user_id' => $user->id,
            'code' => Hash::make($code),
            'expires_at' => now()->addSeconds($ttl),
        ]);

        $user->notify(new VerifyEmailCode($code, (int) ($ttl / 60)));
    }

    /**
     * Check a submitted code and mark the user's email verified on success.
     */
    public function verify(User $user, string $code): bool
    {
        $record = EmailVerificationCode::query()
            ->where('user_id', $user->id)
            ->whereNull('consumed_at')
            ->where('expires_at', '>', now())
            ->latest()
            ->first();

        if (! $record) {
            return false;
        }

        if ($record->attempts >= $this->maxAttempts()) {
            $record->update(['consumed_at' => now()]);

            return false;
        }

        $record->increment('attempts');

        if (! Hash::check($code, $record->code)) {
            return false;
        }

        $record->update(['consumed_at' => now()]);

        if ($user->markEmailAsVerified()) {
            event(new Verified($user));
        }

        return true;
    }

    private function generateCode(): string
    {
        $length = $this->length();
        $max = (10 ** $length) - 1;

        return str_pad((string) random_int(0, $max), $length, '0', STR_PAD_LEFT);
    }

    private function length(): int
    {
        return (int) config('auth.email_verification_code.length', 6);
    }

    private function ttl(): int
    {
        return (int) config('auth.email_verification_code.ttl', 600);
    }

    private function maxAttempts(): int
    {
        return (int) config('auth.email_verification_code.max_attempts', 5);
    }
}
