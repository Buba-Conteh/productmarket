<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\CreatorProfile;
use Stripe\StripeClient;

final readonly class StripeConnectService
{
    private StripeClient $stripe;

    public function __construct()
    {
        $this->stripe = new StripeClient(config('cashier.secret'));
    }

    /**
     * Create a Stripe Express account for a creator and store the ID.
     * Returns the account ID.
     */
    public function createExpressAccount(CreatorProfile $profile): string
    {
        $user = $profile->user;

        $account = $this->stripe->accounts->create([
            'type' => 'express',
            'email' => $user->email,
            'capabilities' => [
                'transfers' => ['requested' => true],
            ],
            'metadata' => [
                'creator_profile_id' => $profile->id,
                'user_id' => $user->id,
            ],
        ]);

        $profile->update([
            'stripe_connect_id' => $account->id,
            'stripe_connect_status' => 'pending',
        ]);

        return $account->id;
    }

    /**
     * Generate a Stripe Connect onboarding link for an existing Express account.
     */
    public function createOnboardingLink(
        CreatorProfile $profile,
        string $returnUrl,
        string $refreshUrl,
    ): string {
        $link = $this->stripe->accountLinks->create([
            'account' => $profile->stripe_connect_id,
            'refresh_url' => $refreshUrl,
            'return_url' => $returnUrl,
            'type' => 'account_onboarding',
        ]);

        return $link->url;
    }

    /**
     * Fetch the latest account status from Stripe and sync it to the profile.
     * Returns the resolved status string.
     */
    public function syncAccountStatus(CreatorProfile $profile): string
    {
        $account = $this->stripe->accounts->retrieve($profile->stripe_connect_id);

        $status = match (true) {
            $account->details_submitted && $account->charges_enabled => 'active',
            $account->details_submitted => 'restricted',
            default => 'pending',
        };

        $profile->update(['stripe_connect_status' => $status]);

        return $status;
    }
}
