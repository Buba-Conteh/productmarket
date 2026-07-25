<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\PhoneVerificationCode;
use App\Services\Sms\SmsService;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;

final class PhoneOtpService
{
    public function __construct(private readonly SmsService $sms) {}

    /**
     * Generate a fresh OTP for the phone, store it hashed, and text it out.
     *
     * Returns false if the phone is still within its cooldown window.
     */
    public function send(string $phone): bool
    {
        if ($this->onCooldown($phone)) {
            return false;
        }

        // Invalidate any outstanding codes for this phone.
        PhoneVerificationCode::query()
            ->where('phone', $phone)
            ->whereNull('consumed_at')
            ->update(['consumed_at' => now()]);

        $code = $this->generateCode();

        PhoneVerificationCode::create([
            'phone' => $phone,
            'code' => Hash::make($code),
            'expires_at' => now()->addSeconds($this->ttl()),
        ]);

        $this->sms->send($phone, "Your ProductMarket verification code is {$code}. It expires in ".(int) ($this->ttl() / 60).' minutes.');

        return true;
    }

    /**
     * Verify a submitted code for a phone. Consumes the code on success.
     */
    public function verify(string $phone, string $code): bool
    {
        $record = PhoneVerificationCode::query()
            ->where('phone', $phone)
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

        return true;
    }

    private function onCooldown(string $phone): bool
    {
        $latest = PhoneVerificationCode::query()
            ->where('phone', $phone)
            ->latest()
            ->first();

        if (! $latest) {
            return false;
        }

        return $latest->created_at->gt(Carbon::now()->subSeconds($this->cooldown()));
    }

    private function generateCode(): string
    {
        $length = $this->length();
        $max = (10 ** $length) - 1;

        return str_pad((string) random_int(0, $max), $length, '0', STR_PAD_LEFT);
    }

    private function length(): int
    {
        return (int) config('sms.otp.length', 6);
    }

    private function ttl(): int
    {
        return (int) config('sms.otp.ttl', 300);
    }

    private function cooldown(): int
    {
        return (int) config('sms.otp.cooldown', 60);
    }

    private function maxAttempts(): int
    {
        return (int) config('sms.otp.max_attempts', 5);
    }
}
