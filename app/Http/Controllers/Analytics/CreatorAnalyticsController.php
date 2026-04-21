<?php

declare(strict_types=1);

namespace App\Http\Controllers\Analytics;

use App\Http\Controllers\Controller;
use App\Models\CreatorAnalytic;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

final class CreatorAnalyticsController extends Controller
{
    public function index(Request $request): Response
    {
        $creator = $request->user()->creatorProfile;
        abort_unless($creator, 403);

        // Weekly snapshots — last 12 weeks
        $weeklySnapshots = CreatorAnalytic::where('creator_profile_id', $creator->id)
            ->where('week_start', '>=', now()->subWeeks(12)->startOfWeek()->toDateString())
            ->orderBy('week_start')
            ->get(['week_start', 'total_views', 'total_earned', 'entries_count', 'avg_engagement_rate'])
            ->map(fn ($r) => [
                'week' => $r->week_start->toDateString(),
                'views' => $r->total_views,
                'earned' => (float) $r->total_earned,
                'entries' => $r->entries_count,
                'engagement' => (float) $r->avg_engagement_rate,
            ]);

        // Per-entry views breakdown
        $entryViews = DB::table('entry_platforms')
            ->join('entries', 'entries.id', '=', 'entry_platforms.entry_id')
            ->join('campaigns', 'campaigns.id', '=', 'entries.campaign_id')
            ->where('entries.creator_profile_id', $creator->id)
            ->whereIn('entries.status', ['live', 'won'])
            ->groupBy('entries.id', 'campaigns.title')
            ->select(
                'entries.id',
                'campaigns.title as campaign_title',
                DB::raw('SUM(entry_platforms.verified_view_count) as total_views'),
            )
            ->orderByDesc('total_views')
            ->limit(10)
            ->get();

        // Earnings per campaign
        $earningsPerCampaign = DB::table('payouts')
            ->join('campaigns', 'campaigns.id', '=', 'payouts.campaign_id')
            ->where('payouts.creator_profile_id', $creator->id)
            ->where('payouts.status', 'paid')
            ->groupBy('campaigns.id', 'campaigns.title')
            ->select('campaigns.title', DB::raw('SUM(payouts.net_amount) as total_earned'))
            ->orderByDesc('total_earned')
            ->limit(8)
            ->get();

        return Inertia::render('analytics/creator', [
            'weekly_snapshots' => $weeklySnapshots,
            'entry_views' => $entryViews,
            'earnings_per_campaign' => $earningsPerCampaign,
            'summary' => [
                'total_views' => (int) DB::table('entry_platforms')
                    ->join('entries', 'entries.id', '=', 'entry_platforms.entry_id')
                    ->where('entries.creator_profile_id', $creator->id)
                    ->sum('entry_platforms.verified_view_count'),
                'total_earned' => (float) $creator->total_earned,
                'pending_earnings' => (float) $creator->pending_earnings,
                'total_entries' => $creator->entries()->whereNotIn('status', ['draft'])->count(),
            ],
        ]);
    }
}
