<?php

declare(strict_types=1);

return [

    /*
    |--------------------------------------------------------------------------
    | SMS stub mode
    |--------------------------------------------------------------------------
    |
    | When enabled, SMS messages (including phone signup OTP codes) are NOT sent
    | to a real provider — they are written to the application log instead. This
    | keeps local development, tests and staging working without a paid SMS
    | account or real phone numbers.
    |
    | Set SMS_STUB_MODE=false on production (with Vonage credentials configured)
    | to deliver real text messages.
    |
    */

    'stub_mode' => env('SMS_STUB_MODE', true),

    /*
    |--------------------------------------------------------------------------
    | Sender ID
    |--------------------------------------------------------------------------
    |
    | The "from" value shown to recipients. May be an alphanumeric sender ID or
    | a purchased Vonage number, depending on destination-country rules.
    |
    */

    'from' => env('SMS_FROM', 'ProductMarket'),

    /*
    |--------------------------------------------------------------------------
    | One-time password (OTP)
    |--------------------------------------------------------------------------
    |
    | length     — number of digits in the code.
    | ttl        — seconds a code stays valid after it is issued.
    | cooldown   — seconds a phone must wait between code requests.
    | max_attempts — verification attempts allowed per code before it is burned.
    |
    */

    'otp' => [
        'length' => (int) env('SMS_OTP_LENGTH', 6),
        'ttl' => (int) env('SMS_OTP_TTL', 300),
        'cooldown' => (int) env('SMS_OTP_COOLDOWN', 60),
        'max_attempts' => (int) env('SMS_OTP_MAX_ATTEMPTS', 5),
    ],

    /*
    |--------------------------------------------------------------------------
    | Vonage
    |--------------------------------------------------------------------------
    |
    | Credentials for the Vonage (nexmo) SMS API, used when stub_mode is false.
    |
    */

    'vonage' => [
        'key' => env('VONAGE_KEY'),
        'secret' => env('VONAGE_SECRET'),
    ],

];
