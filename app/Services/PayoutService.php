<?php

declare(strict_types=1);

namespace App\Services;

use App\DTOs\PayoutAmounts;
use App\Jobs\ProcessPayoutJob;
use App\Models\CreatorProfile;
use App\Models\Entry;
use App\Models\Payout;
use App\Models\PlatformSetting;
use App\Models\User;
use App\Notifications\PayoutFailureAlert;
use App\Notifications\PayoutProcessed;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Stripe\Exception\ApiErrorException;
use Stripe\StripeClient;

final readonly class PayoutService
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
     * Calculate gross → fee → net amounts using a given fee percentage.
     * Uses string arithmetic via bcmath to avoid floating-point drift.
     */
    public function calculateAmounts(string $gross, string $feePct): PayoutAmounts
    {
        $fee = bcdiv(bcmul($gross, $feePct, 6), '100', 6);
        $net = bcsub($gross, $fee, 6);

        return new PayoutAmounts(
            gross: number_format((float) $gross, 2, '.', ''),
            fee: number_format((float) $fee, 2, '.', ''),
            net: number_format((float) $net, 2, '.', ''),
            feePct: $feePct,
        );
    }

    /**
     * Create a Payout record for an entry using the campaign's snapshotted fee rate.
     * Sets status to "pending" and increments the creator's pending_earnings.
     *
     * @param  string  $payoutType  One of the payout_type enum values
     */
    public function createPayout(Entry $entry, string $payoutType, string $gross): Payout
    {
        $campaign = $entry->campaign;
        $amounts = $this->calculateAmounts($gross, (string) $campaign->platform_fee_pct);

        return DB::transaction(function () use ($entry, $campaign, $amounts, $payoutType): Payout {
            $payout = Payout::create([
                'entry_id' => $entry->id,
                'creator_profile_id' => $entry->creator_profile_id,
                'campaign_id' => $campaign->id,
                'gross_amount' => $amounts->gross,
                'platform_fee' => $amounts->fee,
                'net_amount' => $amounts->net,
                'payout_type' => $payoutType,
                'status' => 'pending',
                'retry_count' => 0,
            ]);

            // Track the pending amount on the creator's profile for dashboard reads.
            $entry->creator()->increment('pending_earnings', (float) $amounts->net);

            return $payout;
        });
    }

    /**
     * Execute a Stripe Connect transfer for a pending payout.
     *
     * On success: marks payout as paid, moves amount from pending_earnings → total_earned
     * on the creator profile, and increments total_released on the escrow transaction.
     *
     * On failure: marks payout as failed and records the reason. Does not throw —
     * callers should check payout->status after calling this method.
     */
    public function executeTransfer(Payout $payout): void
    {
        $creator = $payout->creator;

        if (! $creator->canReceivePayouts()) {
            // No payout account yet — hold the payout (it stays pending and in the
            // creator's balance). It is released when the account becomes active.
            if ($payout->failure_reason !== Payout::AWAITING_ACCOUNT_REASON) {
                $payout->update(['failure_reason' => Payout::AWAITING_ACCOUNT_REASON]);
            }

            return;
        }

        $minPayout = (float) (PlatformSetting::current()->min_creator_payout ?? 0);

        if ($minPayout > 0 && (float) $creator->pending_earnings < $minPayout) {
            // Balance below minimum — hold payout until threshold is reached.
            return;
        }

        // Claim the payout atomically so two queued jobs can never transfer it twice.
        $claimed = Payout::whereKey($payout->id)
            ->where('status', 'pending')
            ->update(['status' => 'processing']);

        if ($claimed === 0) {
            return;
        }

        $payout->status = 'processing';
        $payout->syncOriginalAttribute('status');

        try {
            $transfer = $this->stripe->transfers->create([
                'amount' => $this->toStripeAmounts($payout->net_amount),
                'currency' => 'usd',
                'destination' => $creator->stripe_connect_id,
                'transfer_group' => $payout->campaign_id,
                'metadata' => [
                    'payout_id' => $payout->id,
                    'entry_id' => $payout->entry_id,
                    'payout_type' => $payout->payout_type,
                ],
            ]);
        } catch (ApiErrorException $e) {
            Log::error('Stripe transfer failed', [
                'payout_id' => $payout->id,
                'error' => $e->getMessage(),
            ]);

            $this->markFailed($payout, $e->getMessage());

            return;
        }

        DB::transaction(function () use ($payout, $transfer, $creator): void {
            $payout->update([
                'status' => 'paid',
                'stripe_transfer_id' => $transfer->id,
                'failure_reason' => null,
                'paid_at' => now(),
            ]);

            // Move net amount from pending → earned on the creator profile.
            $net = (float) $payout->net_amount;
            $creator->decrement('pending_earnings', $net);
            $creator->increment('total_earned', $net);

            // Track how much escrow has been released for this campaign.
            $payout->campaign->escrowTransaction?->increment(
                'total_released',
                (float) $payout->gross_amount,
            );
        });

        // Notify creator of successful payout
        $creatorUser = $creator->user ?? null;
        if ($creatorUser) {
            $creatorUser->notify(new PayoutProcessed($payout->fresh()));
        }
    }

    /**
     * Release every payout held for a creator once their payout account is active.
     *
     * Payouts failed by the old flow purely because the account was missing are
     * restored to pending first (and their amount put back into pending_earnings),
     * then every pending payout is queued for transfer.
     */
    public function releaseHeldPayouts(CreatorProfile $creator): int
    {
        if (! $creator->canReceivePayouts()) {
            return 0;
        }

        $creator->payouts()
            ->where('status', 'failed')
            ->where('failure_reason', Payout::LEGACY_INACTIVE_ACCOUNT_REASON)
            ->get()
            ->each(fn (Payout $payout) => $this->restoreToPending($payout));

        $pendingIds = $creator->payouts()->where('status', 'pending')->pluck('id');

        foreach ($pendingIds as $payoutId) {
            ProcessPayoutJob::dispatch($payoutId);
        }

        return $pendingIds->count();
    }

    /**
     * Admin-triggered retry of a failed payout: restore it to pending and queue it.
     */
    public function retry(Payout $payout): void
    {
        if ($payout->status !== 'failed') {
            return;
        }

        $this->restoreToPending($payout);

        ProcessPayoutJob::dispatch($payout->id);
    }

    /**
     * Move a failed payout back to pending, re-adding its net amount to the
     * creator's pending balance (markFailed removed it).
     */
    private function restoreToPending(Payout $payout): void
    {
        DB::transaction(function () use ($payout): void {
            $restored = Payout::whereKey($payout->id)
                ->where('status', 'failed')
                ->update([
                    'status' => 'pending',
                    'retry_count' => 0,
                    'failure_reason' => $payout->creator->canReceivePayouts()
                        ? null
                        : Payout::AWAITING_ACCOUNT_REASON,
                ]);

            if ($restored === 1) {
                $payout->creator()->increment('pending_earnings', (float) $payout->net_amount);
            }
        });

        $payout->refresh();
    }

    /**
     * Convert a decimal amount string to Stripe's integer cents format.
     */
    private function toStripeAmounts(string $amount): int
    {
        return (int) round((float) $amount * 100);
    }

    private function markFailed(Payout $payout, string $reason): void
    {
        $newRetryCount = $payout->retry_count + 1;

        if ($newRetryCount < 2) {
            // First failure — keep pending and schedule a retry in 30 minutes.
            $payout->update([
                'status' => 'pending',
                'failure_reason' => $reason,
                'retry_count' => $newRetryCount,
            ]);

            ProcessPayoutJob::dispatch($payout->id)->delay(now()->addMinutes(30));

            return;
        }

        // Second failure — mark definitively failed and alert admins.
        $payout->update([
            'status' => 'failed',
            'failure_reason' => $reason,
            'retry_count' => $newRetryCount,
        ]);

        $payout->creator->decrement('pending_earnings', (float) $payout->net_amount);

        Log::error('Payout failed after max retries — admin alerted', [
            'payout_id' => $payout->id,
            'retry_count' => $newRetryCount,
            'reason' => $reason,
        ]);

        User::role('admin')->each(
            fn (User $admin) => $admin->notify(new PayoutFailureAlert($payout)),
        );
    }
}
