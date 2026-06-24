<?php

declare(strict_types=1);

return [

    /*
    |--------------------------------------------------------------------------
    | Escrow stub mode
    |--------------------------------------------------------------------------
    |
    | When enabled, publishing a campaign records the escrow transaction with a
    | placeholder PaymentIntent ID and does NOT charge the brand. This keeps
    | local development, tests and seeders working without a real card on file.
    |
    | Set ESCROW_STUB_MODE=false on staging/production to collect real escrow
    | deposits via Stripe when a campaign is published.
    |
    */

    'stub_mode' => env('ESCROW_STUB_MODE', true),

    /*
    |--------------------------------------------------------------------------
    | Escrow currency
    |--------------------------------------------------------------------------
    |
    | Currency used for the escrow deposit charge. Should match the platform's
    | Stripe account currency so funds are transferable to creators.
    |
    */

    'currency' => env('ESCROW_CURRENCY', 'usd'),

];
