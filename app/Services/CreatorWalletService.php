<?php

declare(strict_types=1);

namespace App\Services;

use App\DTOs\WalletSummary;
use App\Models\CreatorProfile;

/**
 * Builds a creator's wallet figures straight from the payouts table so the
 * stat cards always add up to the payout history the creator sees.
 */
final readonly class CreatorWalletService
{
    public function summary(CreatorProfile $creator): WalletSummary
    {
        $totals = $creator->payouts()
            ->selectRaw('status, COUNT(*) as payout_count, COALESCE(SUM(net_amount), 0) as net_total')
            ->groupBy('status')
            ->get()
            ->keyBy('status');

        $sum = fn (string ...$statuses): float => array_sum(array_map(
            fn (string $status): float => (float) ($totals->get($status)?->net_total ?? 0),
            $statuses,
        ));

        // In-flight transfers have not landed yet, so they still count as pending.
        $pending = $sum('pending', 'processing');

        return new WalletSummary(
            totalEarned: $this->format($sum('paid')),
            pending: $this->format($pending),
            awaitingAccount: $this->format($creator->canReceivePayouts() ? 0.0 : $pending),
            failed: $this->format($sum('failed')),
            paidCount: (int) ($totals->get('paid')?->payout_count ?? 0),
            pendingCount: (int) ($totals->get('pending')?->payout_count ?? 0)
                + (int) ($totals->get('processing')?->payout_count ?? 0),
        );
    }

    private function format(float $amount): string
    {
        return number_format($amount, 2, '.', '');
    }
}
