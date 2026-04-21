<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\User;
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
