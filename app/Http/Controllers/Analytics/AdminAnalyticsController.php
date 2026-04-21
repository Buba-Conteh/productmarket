<?php

declare(strict_types=1);

namespace App\Http\Controllers\Analytics;

use App\Http\Controllers\Controller;
use App\Models\Campaign;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

final class AdminAnalyticsController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()->hasRole('admin'), 403);

        // GMV by month — last 6 months
        $gmvByMonth = DB::table('payouts')
            ->where('status', 'paid')
            ->where('paid_at', '>=', now()->subMonths(6))
            ->selectRaw("DATE_TRUNC('month', paid_at) as month, SUM(gross_amount) as gmv, SUM(platform_fee) as revenue")
            ->groupByRaw("DATE_TRUNC('month', paid_at)")
            ->orderBy('month')
            ->get()
            ->map(fn ($r) => [
                'month' => date('M Y', strtotime($r->month)),
                'gmv' => round((float) $r->gmv, 2),
                'revenue' => round((float) $r->revenue, 2),
            ]);

        // Top campaigns by views
        $topCampaigns = DB::table('entry_platforms')
            ->join('entries', 'entries.id', '=', 'entry_platforms.entry_id')
            ->join('campaigns', 'campaigns.id', '=', 'entries.campaign_id')
            ->groupBy('campaigns.id', 'campaigns.title', 'campaigns.type')
            ->select(
                'campaigns.id',
                'campaigns.title',
                'campaigns.type',
                DB::raw('SUM(entry_platforms.verified_view_count) as total_views'),
            )
            ->orderByDesc('total_views')
            ->limit(10)
            ->get();

        // User acquisition — new users per month
        $userGrowth = DB::table('users')
            ->where('created_at', '>=', now()->subMonths(6))
            ->selectRaw("DATE_TRUNC('month', created_at) as month, COUNT(*) as count")
            ->groupByRaw("DATE_TRUNC('month', created_at)")
            ->orderBy('month')
            ->get()
            ->map(fn ($r) => [
                'month' => date('M Y', strtotime($r->month)),
                'users' => (int) $r->count,
            ]);

        $totalGmv = DB::table('payouts')->where('status', 'paid')->sum('gross_amount');
        $totalRevenue = DB::table('payouts')->where('status', 'paid')->sum('platform_fee');
        $takeRate = $totalGmv > 0 ? round($totalRevenue / $totalGmv * 100, 2) : 0;

        return Inertia::render('analytics/admin', [
            'gmv_by_month' => $gmvByMonth,
            'top_campaigns' => $topCampaigns,
            'user_growth' => $userGrowth,
            'summary' => [
                'total_gmv' => round((float) $totalGmv, 2),
                'total_revenue' => round((float) $totalRevenue, 2),
                'take_rate_pct' => $takeRate,
                'total_brands' => User::role('brand')->count(),
                'total_creators' => User::role('creator')->count(),
                'active_campaigns' => Campaign::where('status', 'active')->count(),
            ],
        ]);
    }
}
