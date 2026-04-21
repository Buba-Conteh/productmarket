<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\Payout;
use App\Models\PlatformSetting;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

final class ReleaseHeldPayoutsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 1;

    public function handle(): void
    {
        $min = (float) (PlatformSetting::current()->min_creator_payout ?? 0);

        if ($min <= 0) {
            return;
        }

        // Find all pending payouts where the creator has accumulated enough balance.
        Payout::query()
            ->where('status', 'pending')
            ->whereHas('creator', fn ($q) => $q->where('pending_earnings', '>=', $min))
            ->select('id')
            ->chunkById(100, function ($payouts): void {
                foreach ($payouts as $payout) {
                    ProcessPayoutJob::dispatch($payout->id);
                }
            });
    }
}
