<?php

declare(strict_types=1);

namespace App\Services;

use App\DTOs\PayoutAmounts;
use App\Jobs\ProcessPayoutJob;
use App\Models\Entry;
use App\Models\Payout;
use App\Models\User;
use App\Notifications\PayoutFailureAlert;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Stripe\Exception\ApiErrorException;
use Stripe\StripeClient;

final readonly class PayoutService
{
    private StripeClient $stripe;

    public function __construct()
    {
        $this->stripe = new StripeClient(config('cashier.secret'));
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

        if (! $creator->stripe_connect_id || $creator->stripe_connect_status !== 'active') {
            $this->markFailed($payout, 'Creator Stripe Connect account is not active.');

            return;
        }

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

            DB::transaction(function () use ($payout, $transfer, $creator): void {
                $payout->update([
                    'status' => 'paid',
                    'stripe_transfer_id' => $transfer->id,
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
        } catch (ApiErrorException $e) {
            Log::error('Stripe transfer failed', [
                'payout_id' => $payout->id,
                'error' => $e->getMessage(),
            ]);

            $this->markFailed($payout, $e->getMessage());
        }
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
