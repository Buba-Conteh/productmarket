<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\Campaign;
use App\Models\CampaignAnalytic;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;

final class AggregateCampaignAnalyticsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(): void
    {
        $today = now()->toDateString();

        Campaign::whereIn('status', ['active', 'closed', 'completed'])
            ->with(['entries.platforms', 'payouts'])
            ->chunk(50, function ($campaigns) use ($today): void {
                foreach ($campaigns as $campaign) {
                    $this->snapshotCampaign($campaign, $today);
                }
            });
    }

    private function snapshotCampaign(Campaign $campaign, string $date): void
    {
        $totalViews = DB::table('entry_platforms')
            ->join('entries', 'entries.id', '=', 'entry_platforms.entry_id')
            ->where('entries.campaign_id', $campaign->id)
            ->sum('entry_platforms.verified_view_count');

        $totalEntries = $campaign->entries()->whereNotIn('status', ['draft'])->count();
        $totalLive = $campaign->entries()->where('status', 'live')->count();
        $totalPaidOut = $campaign->payouts()->where('status', 'paid')->sum('net_amount');

        $topEntryId = DB::table('entry_platforms')
            ->join('entries', 'entries.id', '=', 'entry_platforms.entry_id')
            ->where('entries.campaign_id', $campaign->id)
            ->groupBy('entries.id')
            ->orderByRaw('SUM(entry_platforms.verified_view_count) DESC')
            ->value('entries.id');

        CampaignAnalytic::updateOrCreate(
            ['campaign_id' => $campaign->id, 'date' => $date],
            [
                'total_entries' => $totalEntries,
                'total_live' => $totalLive,
                'total_views' => (int) $totalViews,
                'total_paid_out' => (string) $totalPaidOut,
                'top_entry_id' => $topEntryId,
            ],
        );
    }
}
