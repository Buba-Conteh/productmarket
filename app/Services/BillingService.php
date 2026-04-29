<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\SubscriptionStatus;
use App\Models\User;
use Laravel\Cashier\Cashier;
use Laravel\Cashier\Subscription;

final readonly class BillingService
{
    /**
     * Resolve the key (slug) of the brand's active subscription plan.
     * Returns null when no active subscription exists.
     */
    public function brandPlanKey(User $user): ?string
    {
        $subscription = $user->subscription('brand');

        if (! $subscription || ! $subscription->active()) {
            return null;
        }

        $priceId = $subscription->stripe_price;

        foreach (config('billing.brand_plans') as $key => $plan) {
            if (in_array($priceId, [$plan['stripe_monthly'], $plan['stripe_annual']], true)) {
                return $key;
            }
        }

        return null;
    }

    /**
     * Resolve the key (slug) of the creator's active subscription plan.
     * Returns 'free' when no paid subscription exists.
     */
    public function creatorPlanKey(User $user): string
    {
        $subscription = $user->subscription('creator');

        if (! $subscription || ! $subscription->active()) {
            return 'free';
        }

        $priceId = $subscription->stripe_price;

        foreach (config('billing.creator_plans') as $key => $plan) {
            if ($plan['stripe_monthly'] && in_array($priceId, [$plan['stripe_monthly'], $plan['stripe_annual']], true)) {
                return $key;
            }
        }

        return 'free';
    }

    /**
     * Upsert the subscription_statuses row for the given user + role.
     * Call this after any subscription change (webhook, checkout, cancel, resume).
     */
    public function syncStatus(User $user, string $role): SubscriptionStatus
    {
        $planKey = match ($role) {
            'brand' => $this->brandPlanKey($user),
            'creator' => $this->creatorPlanKey($user),
            default => null,
        };

        $subscription = $user->subscription($role);
        $stripeStatus = $subscription?->stripe_status;

        // For creators with no paid subscription the plan is 'free' but there
        // is no Stripe subscription row — treat stripe_status as 'active'.
        if ($role === 'creator' && $planKey === 'free') {
            $stripeStatus = 'active';
        }

        return SubscriptionStatus::updateOrCreate(
            ['user_id' => $user->id, 'role' => $role],
            [
                'plan_key' => $planKey,
                'stripe_status' => $stripeStatus,
                'synced_at' => now(),
            ]
        );
    }

    /**
     * Return the maximum number of active campaigns a brand may have.
     * Null means unlimited.
     */
    public function brandCampaignLimit(User $user): ?int
    {
        $planKey = $this->brandPlanKey($user);

        if ($planKey === null) {
            return 0; // no subscription → no campaigns
        }

        return config("billing.brand_plans.{$planKey}.campaign_limit");
    }

    /**
     * Return the maximum entries per month for a creator.
     * Null means unlimited.
     */
    public function creatorMonthlyEntryLimit(User $user): ?int
    {
        $planKey = $this->creatorPlanKey($user);

        return config("billing.creator_plans.{$planKey}.entry_limit");
    }

    /**
     * Check whether the brand can create another campaign.
     */
    public function brandCanCreateCampaign(User $user): bool
    {
        $limit = $this->brandCampaignLimit($user);

        if ($limit === null) {
            return true;
        }

        if ($limit === 0) {
            return false;
        }

        $activeCampaigns = $user->brandProfile?->campaigns()
            ->whereIn('status', ['active', 'pending_escrow'])
            ->count() ?? 0;

        return $activeCampaigns < $limit;
    }

    /**
     * Check whether the creator can submit a new entry this month.
     */
    public function creatorCanSubmitEntry(User $user): bool
    {
        $limit = $this->creatorMonthlyEntryLimit($user);

        if ($limit === null) {
            return true;
        }

        $entriesThisMonth = $user->creatorProfile?->entries()
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->whereNotIn('status', ['draft'])
            ->count() ?? 0;

        return $entriesThisMonth < $limit;
    }

    /**
     * Return full plan detail array for the user's active brand plan.
     */
    public function brandPlanDetails(User $user): array
    {
        $key = $this->brandPlanKey($user);

        if ($key === null) {
            return [];
        }

        return config("billing.brand_plans.{$key}", []);
    }

    /**
     * Return full plan detail array for the user's active creator plan.
     */
    public function creatorPlanDetails(User $user): array
    {
        $key = $this->creatorPlanKey($user);

        return config("billing.creator_plans.{$key}", []);
    }

    /**
     * Retrieve Stripe invoices formatted for the frontend.
     *
     * @return array<int, array<string, mixed>>
     */
    public function invoices(User $user): array
    {
        try {
            return $user->invoices()->map(fn ($invoice) => [
                'id' => $invoice->id,
                'date' => $invoice->date()->toFormattedDateString(),
                'total' => $invoice->total(),
                'status' => $invoice->status,
                'pdf' => $invoice->invoicePdf(),
                'description' => $invoice->lines->data[0]->description ?? '',
            ])->toArray();
        } catch (\Throwable) {
            return [];
        }
    }

    /**
     * Sync a Cashier subscription from a Stripe Checkout session ID.
     * Webhooks can't reach localhost, so success handlers call this directly.
     */
    public function syncFromCheckoutSession(User $user, string $sessionId, string $role): void
    {
        if (! $user->stripe_id || ! $sessionId) {
            return;
        }

        try {
            $session = Cashier::stripe()->checkout->sessions->retrieve($sessionId);
            $stripeSubId = $session->subscription;

            if (! $stripeSubId) {
                return;
            }

            $stripeSub = Cashier::stripe()->subscriptions->retrieve($stripeSubId, ['expand' => ['items']]);
            $item = $stripeSub->items->data[0] ?? null;
            $priceId = $item?->price->id;

            $localSub = $user->subscriptions()->updateOrCreate(
                ['stripe_id' => $stripeSubId],
                [
                    'type' => $role,
                    'stripe_status' => $stripeSub->status,
                    'stripe_price' => $priceId,
                    'quantity' => $item?->quantity ?? 1,
                    'trial_ends_at' => $stripeSub->trial_end ? now()->setTimestamp($stripeSub->trial_end) : null,
                    'ends_at' => $stripeSub->cancel_at ? now()->setTimestamp($stripeSub->cancel_at) : null,
                ]
            );

            foreach ($stripeSub->items->data as $lineItem) {
                $localSub->items()->updateOrCreate(
                    ['stripe_id' => $lineItem->id],
                    [
                        'stripe_product' => $lineItem->price->product,
                        'stripe_price' => $lineItem->price->id,
                        'quantity' => $lineItem->quantity ?? 1,
                    ]
                );
            }
        } catch (\Throwable) {
            // Falls back to webhook sync in production
        }
    }

    /**
     * Fetch live unit_amount values from Stripe for each plan's price IDs.
     * Falls back to config values when Stripe is unreachable or price IDs are missing.
     *
     * @param  array<string, mixed>  $plans
     * @return array<string, mixed>
     */
    public function plansWithLivePrices(array $plans): array
    {
        $priceIds = [];

        foreach ($plans as $plan) {
            if (! empty($plan['stripe_monthly'])) {
                $priceIds[] = $plan['stripe_monthly'];
            }
            if (! empty($plan['stripe_annual'])) {
                $priceIds[] = $plan['stripe_annual'];
            }
        }

        if (empty($priceIds)) {
            return $plans;
        }

        try {
            $stripePrices = [];

            foreach ($priceIds as $id) {
                $price = Cashier::stripe()->prices->retrieve($id);
                $stripePrices[$id] = $price->unit_amount;
            }

            foreach ($plans as &$plan) {
                if (! empty($plan['stripe_monthly']) && isset($stripePrices[$plan['stripe_monthly']])) {
                    $plan['monthly_price'] = $stripePrices[$plan['stripe_monthly']];
                }
                if (! empty($plan['stripe_annual']) && isset($stripePrices[$plan['stripe_annual']])) {
                    $plan['annual_price'] = $stripePrices[$plan['stripe_annual']];
                }
            }
        } catch (\Throwable) {
            // Keep config prices as fallback
        }

        return $plans;
    }

    /**
     * Determine whether a subscription is on a billing interval.
     */
    public function isAnnual(Subscription $subscription): bool
    {
        $priceId = $subscription->stripe_price;

        foreach ([...config('billing.brand_plans'), ...config('billing.creator_plans')] as $plan) {
            if ($plan['stripe_annual'] && $plan['stripe_annual'] === $priceId) {
                return true;
            }
        }

        return false;
    }
}
