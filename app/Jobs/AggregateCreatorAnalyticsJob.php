<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\CreatorAnalytic;
use App\Models\CreatorProfile;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;

final class AggregateCreatorAnalyticsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(): void
    {
        $weekStart = now()->startOfWeek()->toDateString();

        CreatorProfile::chunk(50, function ($creators) use ($weekStart): void {
            foreach ($creators as $creator) {
                $this->snapshotCreator($creator, $weekStart);
            }
        });
    }

    private function snapshotCreator(CreatorProfile $creator, string $weekStart): void
    {
        $entriesCount = $creator->entries()
            ->whereNotIn('status', ['draft'])
            ->count();

        $totalViews = DB::table('entry_platforms')
            ->join('entries', 'entries.id', '=', 'entry_platforms.entry_id')
            ->where('entries.creator_profile_id', $creator->id)
            ->sum('entry_platforms.verified_view_count');

        $totalEarned = $creator->total_earned;

        $avgEngagement = DB::table('social_accounts')
            ->where('user_id', $creator->user_id)
            ->whereNotNull('engagement_rate')
            ->avg('engagement_rate');

        CreatorAnalytic::updateOrCreate(
            ['creator_profile_id' => $creator->id, 'week_start' => $weekStart],
            [
                'total_views' => (int) $totalViews,
                'total_earned' => (string) $totalEarned,
                'entries_count' => $entriesCount,
                'avg_engagement_rate' => $avgEngagement ? number_format((float) $avgEngagement, 2) : '0.00',
            ],
        );
    }
}
