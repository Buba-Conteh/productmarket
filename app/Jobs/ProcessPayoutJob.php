<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\Payout;
use App\Services\PayoutService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

final class ProcessPayoutJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * No automatic retries — retry logic is handled in Feature 6.7.
     * A failed payout is marked in the DB so admin can act on it.
     */
    public int $tries = 1;

    public function __construct(public readonly string $payoutId) {}

    public function handle(PayoutService $payoutService): void
    {
        $payout = Payout::find($this->payoutId);

        if (! $payout || $payout->status !== 'pending') {
            return;
        }

        $payoutService->executeTransfer($payout);
    }
}
