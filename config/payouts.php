<?php

declare(strict_types=1);

return [

    /*
    |--------------------------------------------------------------------------
    | Platform Stripe account country
    |--------------------------------------------------------------------------
    |
    | Country the ProductMarket Stripe (platform) account is registered in.
    | Creators in this country get a standard Express account; creators in
    | any other country get a payouts-only account under Stripe's "recipient"
    | service agreement (cross-border payouts). Stripe itself decides which
    | creator countries are supported and rejects the rest at account creation.
    |
    */

    'platform_country' => env('STRIPE_PLATFORM_COUNTRY', 'US'),

];
