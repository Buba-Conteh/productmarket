<?php

declare(strict_types=1);

namespace App\Http\Controllers\Analytics;

use App\Http\Controllers\Controller;
use App\Models\CampaignAnalytic;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

final class BrandAnalyticsController extends Controller
{
    public function index(Request $request): Response
    {
        $brand = $request->user()->brandProfile;
        abort_unless($brand, 403);

        $campaignIds = $brand->campaigns()->pluck('id');

        // Views over last 30 days per campaign
        $viewsOverTime = CampaignAnalytic::whereIn('campaign_id', $campaignIds)
            ->where('date', '>=', now()->subDays(30)->toDateString())
            ->orderBy('date')
            ->get(['date', 'campaign_id', 'total_views', 'total_paid_out'])
            ->groupBy(fn ($r) => $r->date->toDateString())
            ->map(fn ($rows) => [
                'date' => $rows->first()->date->toDateString(),
                'views' => $rows->sum('total_views'),
                'paid_out' => $rows->sum('total_paid_out'),
            ])
            ->values();

        // Per-campaign summary
        $campaigns = $brand->campaigns()
            ->withCount(['entries as live_count' => fn ($q) => $q->where('status', 'live')])
            ->withCount(['entries as total_entries' => fn ($q) => $q->whereNotIn('status', ['draft'])])
            ->with(['payouts' => fn ($q) => $q->where('status', 'paid')])
            ->orderByDesc('created_at')
            ->limit(10)
            ->get()
            ->map(fn ($c) => [
                'id' => $c->id,
                'title' => $c->title,
                'type' => $c->type,
                'status' => $c->status,
                'total_entries' => $c->total_entries,
                'live_count' => $c->live_count,
                'total_paid_out' => $c->payouts->sum('net_amount'),
            ]);

        // Platform breakdown — total views per platform across all campaigns
        $platformBreakdown = DB::table('entry_platforms')
            ->join('entries', 'entries.id', '=', 'entry_platforms.entry_id')
            ->join('platforms', 'platforms.id', '=', 'entry_platforms.platform_id')
            ->whereIn('entries.campaign_id', $campaignIds)
            ->groupBy('platforms.id', 'platforms.name')
            ->select('platforms.name', DB::raw('SUM(entry_platforms.verified_view_count) as total_views'))
            ->orderByDesc('total_views')
            ->get();

        // Top creators by views
        $topCreators = DB::table('entry_platforms')
            ->join('entries', 'entries.id', '=', 'entry_platforms.entry_id')
            ->join('creator_profiles', 'creator_profiles.id', '=', 'entries.creator_profile_id')
            ->whereIn('entries.campaign_id', $campaignIds)
            ->groupBy('creator_profiles.id', 'creator_profiles.display_name')
            ->select(
                'creator_profiles.id',
                'creator_profiles.display_name',
                DB::raw('SUM(entry_platforms.verified_view_count) as total_views'),
            )
            ->orderByDesc('total_views')
            ->limit(5)
            ->get();

        $totalViews = (int) $campaignIds->isNotEmpty()
            ? DB::table('entry_platforms')
                ->join('entries', 'entries.id', '=', 'entry_platforms.entry_id')
                ->whereIn('entries.campaign_id', $campaignIds)
                ->sum('entry_platforms.verified_view_count')
            : 0;

        $totalPaid = $brand->campaigns()
            ->join('payouts', 'payouts.campaign_id', '=', 'campaigns.id')
            ->where('payouts.status', 'paid')
            ->sum('payouts.net_amount');

        $costPerView = $totalViews > 0 ? round($totalPaid / $totalViews * 1000, 2) : 0;

        return Inertia::render('analytics/brand', [
            'views_over_time' => $viewsOverTime,
            'campaigns' => $campaigns,
            'platform_breakdown' => $platformBreakdown,
            'top_creators' => $topCreators,
            'summary' => [
                'total_views' => $totalViews,
                'total_paid_out' => round((float) $totalPaid, 2),
                'cost_per_thousand_views' => $costPerView,
                'active_campaigns' => $brand->campaigns()->where('status', 'active')->count(),
            ],
        ]);
    }
}
