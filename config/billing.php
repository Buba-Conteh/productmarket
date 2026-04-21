<?php

declare(strict_types=1);

return [

    /*
    |--------------------------------------------------------------------------
    | Brand Plans
    |--------------------------------------------------------------------------
    |
    | Stripe Price IDs are read from environment variables so they can differ
    | between test and production environments.  Campaign limits and feature
    | flags are enforced in application logic (BillingService / middleware).
    |
    */

    'brand_plans' => [
        'starter' => [
            'name' => 'Starter',
            'monthly_price' => 4900,    // cents
            'annual_price' => 47040,   // cents  ($49 * 12 * 0.80)
            'stripe_monthly' => env('STRIPE_BRAND_STARTER_MONTHLY'),
            'stripe_annual' => env('STRIPE_BRAND_STARTER_ANNUAL'),
            'campaign_limit' => 3,
            'features' => [
                'All campaign types',
                'Basic analytics',
                'Standard support',
            ],
        ],
        'growth' => [
            'name' => 'Growth',
            'monthly_price' => 14900,
            'annual_price' => 142800,
            'stripe_monthly' => env('STRIPE_BRAND_GROWTH_MONTHLY'),
            'stripe_annual' => env('STRIPE_BRAND_GROWTH_ANNUAL'),
            'campaign_limit' => 10,
            'features' => [
                'All campaign types',
                'Advanced analytics',
                'Priority support',
                'Agency invite (up to 3 members)',
            ],
        ],
        'scale' => [
            'name' => 'Scale',
            'monthly_price' => 39900,
            'annual_price' => 383040,
            'stripe_monthly' => env('STRIPE_BRAND_SCALE_MONTHLY'),
            'stripe_annual' => env('STRIPE_BRAND_SCALE_ANNUAL'),
            'campaign_limit' => null, // unlimited
            'features' => [
                'Unlimited campaigns',
                'White-label mode',
                'Co-brand campaigns',
                'Dedicated account manager',
                'Full team access',
            ],
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Creator Plans
    |--------------------------------------------------------------------------
    */

    'creator_plans' => [
        'free' => [
            'name' => 'Free',
            'monthly_price' => 0,
            'annual_price' => 0,
            'stripe_monthly' => null,
            'stripe_annual' => null,
            'entry_limit' => 2, // per month
            'features' => [
                'Browse campaigns',
                'Up to 2 entries per month',
                'Basic profile',
            ],
        ],
        'pro' => [
            'name' => 'Creator Pro',
            'monthly_price' => 900,
            'annual_price' => 8640,
            'stripe_monthly' => env('STRIPE_CREATOR_PRO_MONTHLY'),
            'stripe_annual' => env('STRIPE_CREATOR_PRO_ANNUAL'),
            'entry_limit' => null, // unlimited
            'features' => [
                'Unlimited entries',
                'Media kit',
                'Priority discovery in search',
                'Verified badge',
                'Advanced earnings dashboard',
            ],
        ],
    ],

];
