<?php

declare(strict_types=1);

namespace App\Services\Sms;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

final class SmsService
{
    /**
     * Send an SMS message to the given E.164 phone number.
     *
     * In stub mode the message is written to the log instead of being sent to a
     * real provider, so local/staging environments work without paid SMS.
     */
    public function send(string $phone, string $message): void
    {
        if ($this->isStub()) {
            Log::info('[SMS stub] message not sent to a real provider.', [
                'to' => $phone,
                'message' => $message,
            ]);

            return;
        }

        $key = (string) config('sms.vonage.key');
        $secret = (string) config('sms.vonage.secret');

        if ($key === '' || $secret === '') {
            throw new RuntimeException('Vonage credentials are not configured. Set VONAGE_KEY and VONAGE_SECRET or enable SMS_STUB_MODE.');
        }

        $response = Http::asForm()->post('https://rest.nexmo.com/sms/json', [
            'api_key' => $key,
            'api_secret' => $secret,
            'from' => (string) config('sms.from'),
            'to' => ltrim($phone, '+'),
            'text' => $message,
        ]);

        $status = $response->json('messages.0.status');

        if ($response->failed() || $status !== '0') {
            $error = $response->json('messages.0.error-text', 'unknown error');

            Log::error('[SMS] Vonage send failed.', ['to' => $phone, 'status' => $status, 'error' => $error]);

            throw new RuntimeException("Failed to send SMS: {$error}");
        }
    }

    private function isStub(): bool
    {
        return (bool) config('sms.stub_mode', true);
    }
}
