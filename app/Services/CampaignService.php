<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\BrandProfile;
use App\Models\Campaign;
use App\Models\EscrowTransaction;
use App\Models\PlatformSetting;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Stripe\Exception\ApiErrorException;
use Stripe\StripeClient;

final readonly class CampaignService
{
    private StripeClient $stripe;

    public function __construct()
    {
        $this->stripe = new StripeClient(config('cashier.secret'));
    }

    /**
     * Create a new campaign in draft status.
     *
     * @param  array<string, mixed>  $data
     */
    public function createDraft(BrandProfile $brand, array $data): Campaign
    {
        return DB::transaction(function () use ($brand, $data) {
            $settings = PlatformSetting::current();

            $campaign = $brand->campaigns()->create([
                'type' => $data['type'],
                'title' => $data['title'],
                'brief' => $data['brief'] ?? '',
                'requirements' => $data['requirements'] ?? [],
                'required_hashtags' => $data['required_hashtags'] ?? [],
                'target_regions' => $data['target_regions'] ?? null,
                'inspiration_links' => $data['inspiration_links'] ?? [],
                'platform_fee_pct' => $settings->platform_fee_pct ?? 15.00,
                'status' => 'draft',
                'deadline' => $data['deadline'] ?? null,
                'max_creators' => $data['max_creators'] ?? null,
                'ai_brief_used' => $data['ai_brief_used'] ?? false,
            ]);

            if (! empty($data['platform_ids'])) {
                $campaign->platforms()->sync($data['platform_ids']);
            }

            if (! empty($data['content_type_ids'])) {
                $campaign->contentTypes()->sync($data['content_type_ids']);
            }

            $this->syncTypeDetails($campaign, $data);

            return $campaign;
        });
    }

    /**
     * Update a draft campaign.
     *
     * @param  array<string, mixed>  $data
     */
    public function updateDraft(Campaign $campaign, array $data): Campaign
    {
        abort_unless($campaign->status === 'draft', 403, 'Only draft campaigns can be edited.');

        return DB::transaction(function () use ($campaign, $data) {
            $campaign->update([
                'title' => $data['title'] ?? $campaign->title,
                'brief' => $data['brief'] ?? $campaign->brief,
                'requirements' => $data['requirements'] ?? $campaign->requirements,
                'required_hashtags' => $data['required_hashtags'] ?? $campaign->required_hashtags,
                'target_regions' => $data['target_regions'] ?? $campaign->target_regions,
                'inspiration_links' => $data['inspiration_links'] ?? $campaign->inspiration_links,
                'deadline' => $data['deadline'] ?? $campaign->deadline,
                'max_creators' => $data['max_creators'] ?? $campaign->max_creators,
                'ai_brief_used' => $data['ai_brief_used'] ?? $campaign->ai_brief_used,
            ]);

            if (isset($data['platform_ids'])) {
                $campaign->platforms()->sync($data['platform_ids']);
            }

            if (isset($data['content_type_ids'])) {
                $campaign->contentTypes()->sync($data['content_type_ids']);
            }

            $this->syncTypeDetails($campaign, $data);

            return $campaign->fresh();
        });
    }

    /**
     * Publish a draft campaign — moves it to pending_escrow status.
     * For now (pre-Stripe escrow), we move directly to active.
     */
    public function publish(Campaign $campaign): Campaign
    {
        abort_unless($campaign->status === 'draft', 403, 'Only draft campaigns can be published.');

        $this->validateReadyToPublish($campaign);

        return DB::transaction(function () use ($campaign) {
            $escrowAmount = $this->calculateEscrowAmount($campaign);

            // Create escrow record — will be linked to Stripe PaymentIntent in Phase 6
            EscrowTransaction::create([
                'campaign_id' => $campaign->id,
                'brand_profile_id' => $campaign->brand_profile_id,
                'total_held' => $escrowAmount,
                'total_released' => 0,
                'total_refunded' => 0,
                'stripe_payment_intent_id' => 'pending_'.$campaign->id,
                'status' => 'held',
                'held_at' => now(),
            ]);

            $campaign->update([
                'status' => 'active',
                'published_at' => now(),
            ]);

            return $campaign->fresh();
        });
    }

    /**
     * Close a campaign — stops accepting new entries.
     */
    public function close(Campaign $campaign): Campaign
    {
        abort_unless($campaign->status === 'active', 403, 'Only active campaigns can be closed.');

        $campaign->update(['status' => 'closed']);

        return $campaign->fresh();
    }

    /**
     * Cancel a campaign — refunds unspent escrow budget to the brand.
     */
    public function cancel(Campaign $campaign): Campaign
    {
        abort_unless(
            in_array($campaign->status, ['draft', 'active', 'pending_escrow']),
            403,
            'This campaign cannot be cancelled.'
        );

        return DB::transaction(function () use ($campaign) {
            $escrow = $campaign->escrowTransaction;

            if ($escrow && $escrow->status !== 'refunded') {
                $refundable = (float) $escrow->total_held - (float) $escrow->total_released;

                $stripeRefundId = null;

                if ($refundable > 0) {
                    $stripeRefundId = $this->issueStripeRefund($escrow, $refundable);
                }

                $escrow->update([
                    'total_refunded' => $refundable,
                    'stripe_refund_id' => $stripeRefundId,
                    'status' => 'refunded',
                    'refunded_at' => now(),
                ]);
            }

            $campaign->update(['status' => 'cancelled']);

            return $campaign->fresh();
        });
    }

    /**
     * Issue a Stripe refund for unspent escrow. Returns the Stripe refund ID on success.
     * Skips silently for placeholder PaymentIntent IDs (pre-Stripe-integration campaigns).
     */
    private function issueStripeRefund(EscrowTransaction $escrow, float $refundable): ?string
    {
        // Placeholder IDs are set during publish() until real Stripe escrow is wired up.
        if (str_starts_with($escrow->stripe_payment_intent_id, 'pending_')) {
            return null;
        }

        try {
            $refund = $this->stripe->refunds->create([
                'payment_intent' => $escrow->stripe_payment_intent_id,
                'amount' => (int) round($refundable * 100),
                'metadata' => [
                    'campaign_id' => $escrow->campaign_id,
                    'escrow_id' => $escrow->id,
                ],
            ]);

            return $refund->id;
        } catch (ApiErrorException $e) {
            Log::error('Stripe escrow refund failed', [
                'escrow_id' => $escrow->id,
                'campaign_id' => $escrow->campaign_id,
                'refundable' => $refundable,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /**
     * Paginated list of campaigns for a brand.
     */
    public function brandCampaigns(BrandProfile $brand, ?string $status = null, int $perPage = 12): LengthAwarePaginator
    {
        $query = $brand->campaigns()
            ->with(['platforms', 'contentTypes'])
            ->withCount('entries')
            ->latest();

        if ($status && $status !== 'all') {
            $query->where('status', $status);
        }

        return $query->paginate($perPage);
    }

    /**
     * Paginated list of active campaigns for creator discovery.
     *
     * @param  array<string, mixed>  $filters
     */
    public function discoveryCampaigns(array $filters = [], int $perPage = 12): LengthAwarePaginator
    {
        $query = Campaign::query()
            ->where('status', 'active')
            ->with(['brand', 'platforms', 'contentTypes'])
            ->withCount('entries');

        if (! empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        if (! empty($filters['platform_id'])) {
            $query->whereHas('platforms', fn ($q) => $q->where('platforms.id', $filters['platform_id']));
        }

        if (! empty($filters['content_type_id'])) {
            $query->whereHas('contentTypes', fn ($q) => $q->where('content_types.id', $filters['content_type_id']));
        }

        if (! empty($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('title', 'ilike', '%'.$filters['search'].'%')
                    ->orWhere('brief', 'ilike', '%'.$filters['search'].'%');
            });
        }

        $sortBy = $filters['sort'] ?? 'latest';
        match ($sortBy) {
            'deadline' => $query->orderBy('deadline', 'asc'),
            'popular' => $query->orderBy('entries_count', 'desc'),
            default => $query->latest(),
        };

        return $query->paginate($perPage);
    }

    /**
     * Load a campaign with all details for display.
     */
    public function loadFullCampaign(Campaign $campaign): Campaign
    {
        return $campaign->load([
            'brand',
            'platforms',
            'contentTypes',
            'contestDetails',
            'rippleDetails',
            'pitchDetails',
            'escrowTransaction',
        ])->loadCount('entries');
    }

    /**
     * Calculate the escrow amount based on campaign type.
     */
    public function calculateEscrowAmount(Campaign $campaign): float
    {
        return match ($campaign->type) {
            'contest' => (float) ($campaign->contestDetails?->prize_amount ?? 0)
                       + (float) ($campaign->contestDetails?->runner_up_prize ?? 0),
            'ripple' => (float) ($campaign->rippleDetails?->total_budget ?? 0),
            'pitch' => (float) ($campaign->pitchDetails?->budget_cap ?? 0),
            default => 0,
        };
    }

    /**
     * Validate a campaign is ready to publish.
     */
    private function validateReadyToPublish(Campaign $campaign): void
    {
        $errors = [];

        if (empty($campaign->title)) {
            $errors[] = 'Campaign title is required.';
        }

        if (empty($campaign->brief)) {
            $errors[] = 'Campaign brief is required.';
        }

        if ($campaign->platforms()->count() === 0) {
            $errors[] = 'At least one platform must be selected.';
        }

        $escrowAmount = $this->calculateEscrowAmount($campaign);
        if ($escrowAmount <= 0) {
            $errors[] = 'Campaign budget must be greater than zero.';
        }

        if (! empty($errors)) {
            abort(422, implode(' ', $errors));
        }
    }

    /**
     * Create or update type-specific detail tables.
     *
     * @param  array<string, mixed>  $data
     */
    private function syncTypeDetails(Campaign $campaign, array $data): void
    {
        match ($campaign->type) {
            'contest' => $campaign->contestDetails()->updateOrCreate(
                ['campaign_id' => $campaign->id],
                [
                    'prize_amount' => $data['prize_amount'] ?? 0,
                    'runner_up_prize' => $data['runner_up_prize'] ?? null,
                ]
            ),
            'ripple' => $campaign->rippleDetails()->updateOrCreate(
                ['campaign_id' => $campaign->id],
                [
                    'initial_fee' => $data['initial_fee'] ?? 0,
                    'rpm_rate' => $data['rpm_rate'] ?? 0,
                    'milestone_interval' => $data['milestone_interval'] ?? 100000,
                    'max_payout_per_creator' => $data['max_payout_per_creator'] ?? null,
                    'total_budget' => $data['total_budget'] ?? 0,
                    'budget_spent' => 0,
                ]
            ),
            'pitch' => $campaign->pitchDetails()->updateOrCreate(
                ['campaign_id' => $campaign->id],
                [
                    'product_name' => $data['product_name'] ?? '',
                    'product_description' => $data['product_description'] ?? null,
                    'product_url' => $data['product_url'] ?? null,
                    'product_images' => $data['product_images'] ?? null,
                    'budget_cap' => $data['budget_cap'] ?? null,
                    'min_bid' => $data['min_bid'] ?? null,
                    'max_bid' => $data['max_bid'] ?? null,
                ]
            ),
            default => null,
        };
    }
}
