<?php

declare(strict_types=1);

namespace App\Services\Social;

use App\Jobs\ProcessPayoutJob;
use App\Models\CampaignRippleDetail;
use App\Models\Entry;
use App\Models\EntryRippleEarning;
use App\Models\Platform;
use App\Models\SocialAccount;
use App\Models\ViewSyncLog;
use App\Services\PayoutService;
use App\Services\Social\Exceptions\PlatformConnectionException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

final class ViewSyncService
{
    public function __construct(
        private readonly PlatformProviderFactory $factory,
        private readonly SocialAccountService $accounts,
        private readonly PayoutService $payouts,
    ) {}

    /**
     * Sync all platforms attached to a single entry. Returns the total new views recorded.
     */
    public function syncEntry(Entry $entry): int
    {
        if (! in_array($entry->status, ['live', 'approved'], true)) {
            return 0;
        }

        $totalDelta = 0;

        foreach ($entry->platforms()->get() as $platform) {
            $totalDelta += $this->syncEntryPlatform($entry, $platform);
        }

        return $totalDelta;
    }

    /**
     * Sync a single (entry, platform) pair. Writes view_sync_logs row + updates pivot view count.
     * If the entry is a Ripple entry, detects milestone crossings and queues payouts.
     */
    public function syncEntryPlatform(Entry $entry, Platform $platform): int
    {
        $pivot = $entry->platforms()
            ->where('platforms.id', $platform->id)
            ->first()?->pivot;

        if (! $pivot || empty($pivot->posted_url)) {
            return 0;
        }

        $userId = $entry->creator?->user_id;
        $account = $userId
            ? SocialAccount::where('user_id', $userId)
                ->where('platform_id', $platform->id)
                ->first()
            : null;

        if (! $account) {
            $this->logSync($entry->id, $platform->id, 0, false, 'No connected social account for this platform.');

            return 0;
        }

        try {
            $this->accounts->refreshIfNeeded($account);

            $provider = $this->factory->make($platform->slug);
            $newCount = $provider->fetchViewCount($account, $pivot->posted_url);
        } catch (PlatformConnectionException|Throwable $e) {
            Log::warning('view_sync_failed', [
                'entry_id' => $entry->id,
                'platform_id' => $platform->id,
                'message' => $e->getMessage(),
            ]);

            $this->logSync($entry->id, $platform->id, 0, false, $e->getMessage());

            return 0;
        }

        $previousCount = (int) ($pivot->verified_view_count ?? 0);
        $delta = max(0, $newCount - $previousCount);

        $payoutIds = [];

        DB::transaction(function () use ($entry, $platform, $newCount, $previousCount, &$payoutIds): void {
            $entry->platforms()->updateExistingPivot($platform->id, [
                'verified_view_count' => $newCount,
                'last_synced_at' => now(),
            ]);

            $account = SocialAccount::where('user_id', $entry->creator?->user_id)
                ->where('platform_id', $platform->id)
                ->first();

            $account?->update(['last_synced_at' => now()]);

            $this->logSync($entry->id, $platform->id, $newCount, true, null);

            if ($entry->type === 'ripple') {
                $payoutIds = $this->detectAndQueueMilestones($entry, $previousCount, $newCount);
            }
        });

        foreach ($payoutIds as $payoutId) {
            ProcessPayoutJob::dispatch($payoutId);
        }

        return $delta;
    }

    /**
     * Detect milestone crossings on a Ripple entry, record earnings, and create payout records.
     * Returns the IDs of created payouts so the caller can dispatch jobs after the transaction.
     *
     * @return array<string>
     */
    public function detectAndQueueMilestones(Entry $entry, int $previousTotalViews, int $newTotalViews): array
    {
        $rippleDetails = $entry->campaign?->rippleDetails;

        if (! $rippleDetails instanceof CampaignRippleDetail) {
            return [];
        }

        $interval = (int) $rippleDetails->milestone_interval;

        if ($interval <= 0) {
            return [];
        }

        $previousMilestone = intdiv($previousTotalViews, $interval);
        $newMilestone = intdiv($newTotalViews, $interval);

        if ($newMilestone <= $previousMilestone) {
            return [];
        }

        $rpmRate = (float) $rippleDetails->rpm_rate;
        $payoutIds = [];

        for ($milestoneNumber = $previousMilestone + 1; $milestoneNumber <= $newMilestone; $milestoneNumber++) {
            if ($this->rippleBudgetExhausted($rippleDetails)) {
                break;
            }

            if ($this->creatorPayoutCapReached($entry, $rippleDetails)) {
                break;
            }

            $grossAmount = $this->cappedMilestoneAmount(
                round($interval / 1000 * $rpmRate, 2),
                $rippleDetails,
                $entry,
            );

            if ($grossAmount <= 0) {
                break;
            }

            $gross = number_format($grossAmount, 2, '.', '');
            $payout = $this->payouts->createPayout($entry, 'ripple_milestone', $gross);

            EntryRippleEarning::create([
                'entry_id' => $entry->id,
                'campaign_ripple_details_id' => $rippleDetails->id,
                'milestone_number' => $milestoneNumber,
                'views_at_milestone' => $milestoneNumber * $interval,
                'amount' => $gross,
                'type' => 'milestone',
                'triggered_at' => now(),
                'payout_id' => $payout->id,
            ]);

            $rippleDetails->increment('budget_spent', $grossAmount);
            $rippleDetails->refresh();

            $payoutIds[] = $payout->id;
        }

        return $payoutIds;
    }

    private function cappedMilestoneAmount(float $rawAmount, CampaignRippleDetail $details, Entry $entry): float
    {
        $remainingBudget = (float) $details->total_budget - (float) $details->budget_spent;

        $amount = min($rawAmount, $remainingBudget);

        if ($details->max_payout_per_creator !== null) {
            $creatorPaid = (float) EntryRippleEarning::query()
                ->where('campaign_ripple_details_id', $details->id)
                ->whereHas('entry', fn ($q) => $q->where('creator_profile_id', $entry->creator_profile_id))
                ->sum('amount');

            $creatorRemaining = (float) $details->max_payout_per_creator - $creatorPaid;
            $amount = min($amount, max(0, $creatorRemaining));
        }

        return max(0, round($amount, 2));
    }

    private function rippleBudgetExhausted(CampaignRippleDetail $details): bool
    {
        return (float) $details->budget_spent >= (float) $details->total_budget;
    }

    private function creatorPayoutCapReached(Entry $entry, CampaignRippleDetail $details): bool
    {
        if ($details->max_payout_per_creator === null) {
            return false;
        }

        $paid = (float) EntryRippleEarning::query()
            ->where('campaign_ripple_details_id', $details->id)
            ->whereHas('entry', fn ($q) => $q->where('creator_profile_id', $entry->creator_profile_id))
            ->sum('amount');

        return $paid >= (float) $details->max_payout_per_creator;
    }

    private function logSync(
        string $entryId,
        string $platformId,
        int $viewCount,
        bool $success,
        ?string $errorMessage,
    ): void {
        ViewSyncLog::create([
            'entry_id' => $entryId,
            'platform_id' => $platformId,
            'view_count' => $viewCount,
            'synced_at' => now(),
            'success' => $success,
            'error_message' => $errorMessage,
        ]);
    }
}
