<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\Campaign;
use App\Services\PayoutService;
use App\Services\Social\ViewSyncService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;

final class ResolveContestDeadlineJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public readonly string $campaignId) {}

    public function handle(ViewSyncService $sync, PayoutService $payouts): void
    {
        $campaign = Campaign::query()
            ->with(['contestDetails', 'entries.platforms', 'entries.creator'])
            ->find($this->campaignId);

        if (! $campaign || $campaign->type !== 'contest') {
            return;
        }

        if ($campaign->status === 'completed') {
            return;
        }

        foreach ($campaign->entries as $entry) {
            if ($entry->status === 'live') {
                $sync->syncEntry($entry);
            }
        }

        $ranked = $campaign->entries()
            ->where('status', 'live')
            ->with('platforms')
            ->get()
            ->sortByDesc(fn ($entry) => $entry->platforms->sum('pivot.verified_view_count'))
            ->values();

        if ($ranked->isEmpty()) {
            $campaign->update(['status' => 'closed']);

            return;
        }

        $createdPayouts = DB::transaction(function () use ($campaign, $ranked, $payouts): array {
            $winner = $ranked->first();
            $runnerUp = $ranked->get(1);
            $details = $campaign->contestDetails;
            $collected = [];

            if ($details && $details->winner_entry_id === null) {
                $details->update([
                    'winner_entry_id' => $winner->id,
                    'winner_selected_at' => now(),
                ]);
            }

            $winner->update(['status' => 'won']);

            $campaign->entries()
                ->where('id', '!=', $winner->id)
                ->where('status', 'live')
                ->update(['status' => 'not_selected']);

            $prizeGross = (float) ($details?->prize_amount ?? 0);
            if ($prizeGross > 0) {
                $collected[] = $payouts->createPayout(
                    $winner,
                    'contest_prize',
                    number_format($prizeGross, 2, '.', ''),
                );
            }

            if ($runnerUp && $details && (float) $details->runner_up_prize > 0) {
                $collected[] = $payouts->createPayout(
                    $runnerUp,
                    'contest_runner_up',
                    number_format((float) $details->runner_up_prize, 2, '.', ''),
                );
            }

            $campaign->update(['status' => 'completed']);

            return $collected;
        });

        foreach ($createdPayouts as $payout) {
            ProcessPayoutJob::dispatch($payout->id);
        }
    }
}
