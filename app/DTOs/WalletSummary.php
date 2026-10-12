<?php

declare(strict_types=1);

namespace App\DTOs;

/**
 * Immutable snapshot of a creator's wallet, derived from their payout rows.
 * Amounts are net (after platform fee) and formatted as 2-decimal strings.
 */
final readonly class WalletSummary
{
    public function __construct(
        public string $totalEarned,
        public string $pending,
        public string $awaitingAccount,
        public string $failed,
        public int $paidCount,
        public int $pendingCount,
    ) {}

    /**
     * @return array<string, string|int>
     */
    public function toArray(): array
    {
        return [
            'total_earned' => $this->totalEarned,
            'pending_earnings' => $this->pending,
            'awaiting_account' => $this->awaitingAccount,
            'failed_amount' => $this->failed,
            'paid_count' => $this->paidCount,
            'pending_count' => $this->pendingCount,
        ];
    }
}
