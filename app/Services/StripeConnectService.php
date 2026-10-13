<?php

declare(strict_types=1);

namespace App\Services;

use App\Exceptions\UnsupportedPayoutCountryException;
use App\Models\CreatorProfile;
use Illuminate\Support\Facades\Log;
use Stripe\Account;
use Stripe\Exception\InvalidRequestException;
use Stripe\StripeClient;

final readonly class StripeConnectService
{
    private StripeClient $stripe;

    public function __construct()
    {
        $secret = config('cashier.secret');

        if (! $secret) {
            Log::error('Stripe secret key is not configured. Check STRIPE_SECRET environment variable.');
            throw new \RuntimeException('Stripe secret key is not configured.');
        }

        if (! str_starts_with($secret, 'sk_')) {
            Log::error('Invalid Stripe secret key format. Expected to start with "sk_". Check STRIPE_SECRET environment variable.');
            throw new \RuntimeException('Invalid Stripe secret key format.');
        }

        $this->stripe = new StripeClient($secret);
    }

    /**
     * Make sure the creator has a payout account in their own country, ready
     * for onboarding. Creates one if missing, and replaces an unfinished
     * account that was created in the wrong country (accounts made before
     * country support all defaulted to the platform country). Active
     * accounts are never replaced. Returns the account ID.
     *
     * @throws UnsupportedPayoutCountryException
     */
    public function prepareAccount(CreatorProfile $profile): string
    {
        if (! $profile->stripe_connect_id) {
            return $this->createExpressAccount($profile);
        }

        if ($profile->canReceivePayouts()) {
            return $profile->stripe_connect_id;
        }

        $country = $this->creatorCountry($profile);
        $existing = $this->stripe->accounts->retrieve($profile->stripe_connect_id);

        if ($existing->country === $country) {
            return $existing->id;
        }

        Log::info('Replacing unfinished Connect account created in the wrong country', [
            'creator_profile_id' => $profile->id,
            'old_account' => $existing->id,
            'old_country' => $existing->country,
            'country' => $country,
        ]);

        return $this->createExpressAccount($profile);
    }

    /**
     * Create a Stripe Express account for a creator in their own country and
     * store the ID. Returns the account ID.
     *
     * @throws UnsupportedPayoutCountryException
     */
    public function createExpressAccount(CreatorProfile $profile): string
    {
        $country = $this->creatorCountry($profile);

        try {
            $account = $this->stripe->accounts->create($this->accountParams($profile, $country));
        } catch (InvalidRequestException $e) {
            // Stripe rejects countries it cannot pay out to.
            if ($e->getStripeParam() === 'country' || str_contains(strtolower($e->getMessage()), 'country')) {
                Log::warning('Stripe rejected Connect account country', [
                    'creator_profile_id' => $profile->id,
                    'country' => $country,
                    'error' => $e->getMessage(),
                ]);

                throw UnsupportedPayoutCountryException::forCountry($country);
            }

            throw $e;
        }

        $profile->update([
            'stripe_connect_id' => $account->id,
            'stripe_connect_status' => 'pending',
        ]);

        return $account->id;
    }

    /**
     * Creators only ever receive transfers, so that is the only capability
     * requested. Creators outside the platform's country get the "recipient"
     * service agreement, which Stripe requires for cross-border payouts.
     *
     * @return array<string, mixed>
     */
    public function accountParams(CreatorProfile $profile, string $country): array
    {
        $params = [
            'type' => 'express',
            'country' => $country,
            'email' => $profile->user->email,
            'capabilities' => [
                'transfers' => ['requested' => true],
            ],
            'metadata' => [
                'creator_profile_id' => $profile->id,
                'user_id' => $profile->user_id,
            ],
        ];

        if ($country !== strtoupper((string) config('payouts.platform_country'))) {
            $params['tos_acceptance'] = ['service_agreement' => 'recipient'];
        }

        return $params;
    }

    /**
     * @throws UnsupportedPayoutCountryException
     */
    private function creatorCountry(CreatorProfile $profile): string
    {
        $country = strtoupper(trim((string) $profile->user->country));

        if (strlen($country) !== 2) {
            throw UnsupportedPayoutCountryException::missing();
        }

        return $country;
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

        return $this->applyAccountStatus($profile, $account);
    }

    /**
     * Store the status derived from a Stripe Account (fetched or from an
     * account.updated webhook). While the account can receive transfers,
     * every payout held for the creator is released.
     */
    public function applyAccountStatus(CreatorProfile $profile, Account $account): string
    {
        $status = $this->resolveStatus($account);

        $profile->update(['stripe_connect_status' => $status]);

        if ($status === 'active') {
            // Idempotent: payouts are claimed atomically, so re-queuing is safe.
            $released = app(PayoutService::class)->releaseHeldPayouts($profile);

            if ($released > 0) {
                Log::info('Creator payout account active — held payouts released', [
                    'creator_profile_id' => $profile->id,
                    'released' => $released,
                ]);
            }
        }

        return $status;
    }

    /**
     * Single-use link to the creator's Stripe Express dashboard, where they
     * manage their bank account or debit card.
     */
    public function createDashboardLink(CreatorProfile $profile): string
    {
        return $this->stripe->accounts->createLoginLink($profile->stripe_connect_id)->url;
    }

    /**
     * Payouts are sent as transfers, so "active" means the transfers capability
     * is active — not card charges, which creators never take.
     */
    private function resolveStatus(Account $account): string
    {
        $transfers = $account->capabilities?->transfers ?? null;

        return match (true) {
            $account->details_submitted && $transfers === 'active' => 'active',
            (bool) $account->details_submitted => 'restricted',
            default => 'pending',
        };
    }
}
