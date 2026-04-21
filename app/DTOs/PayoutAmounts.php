<?php

declare(strict_types=1);

namespace App\DTOs;

/**
 * Immutable value object holding the three amounts for a single payout.
 * All values are stored as high-precision strings to avoid floating-point drift.
 */
final readonly class PayoutAmounts
{
    public function __construct(
        public string $gross,
        public string $fee,
        public string $net,
        public string $feePct,
    ) {}

    /**
     * Net amount in integer cents, suitable for Stripe API calls.
     */
    public function netInCents(): int
    {
        return (int) round((float) $this->net * 100);
    }

    /**
     * Gross amount in integer cents.
     */
    public function grossInCents(): int
    {
        return (int) round((float) $this->gross * 100);
    }
}
