<?php

declare(strict_types=1);

namespace App\Http\Controllers\Analytics;

use App\Http\Controllers\Controller;
use App\Models\Campaign;
use App\Models\EscrowTransaction;
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

        // GMV + commission revenue by month — last 6 months
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

        // Commission broken down by campaign type
        $commissionByType = DB::table('payouts')
            ->join('entries', 'entries.id', '=', 'payouts.entry_id')
            ->join('campaigns', 'campaigns.id', '=', 'entries.campaign_id')
            ->where('payouts.status', 'paid')
            ->groupBy('campaigns.type')
            ->select('campaigns.type', DB::raw('SUM(payouts.platform_fee) as commission'), DB::raw('SUM(payouts.gross_amount) as gmv'))
            ->get()
            ->map(fn ($r) => [
                'type' => ucfirst($r->type),
                'commission' => round((float) $r->commission, 2),
                'gmv' => round((float) $r->gmv, 2),
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

        // User acquisition — new users per month (last 6 months)
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

        // Subscription plan breakdown (active subscribers per plan)
        $planPrices = [
            'starter' => 4900,
            'growth' => 14900,
            'scale' => 39900,
            'pro' => 900,
            'free' => 0,
        ];

        $subscriptionBreakdown = DB::table('subscription_statuses')
            ->whereIn('stripe_status', ['active', 'trialing'])
            ->groupBy('plan_key', 'role')
            ->select('plan_key', 'role', DB::raw('COUNT(*) as count'))
            ->orderBy('role')
            ->orderBy('plan_key')
            ->get()
            ->map(fn ($r) => [
                'plan' => $r->plan_key ?? 'free',
                'role' => $r->role,
                'count' => (int) $r->count,
                'mrr_cents' => (int) $r->count * ($planPrices[$r->plan_key] ?? 0),
            ]);

        // Estimated MRR from active subscriptions
        $estimatedMrr = $subscriptionBreakdown->sum('mrr_cents') / 100;

        // New subscriptions by month (last 6 months)
        $subscriptionGrowth = DB::table('subscription_statuses')
            ->where('created_at', '>=', now()->subMonths(6))
            ->selectRaw("DATE_TRUNC('month', created_at) as month, COUNT(*) as count")
            ->groupByRaw("DATE_TRUNC('month', created_at)")
            ->orderBy('month')
            ->get()
            ->map(fn ($r) => [
                'month' => date('M Y', strtotime($r->month)),
                'subscriptions' => (int) $r->count,
            ]);

        // Pending escrow (funds held, not yet released or refunded)
        $pendingEscrow = EscrowTransaction::whereIn('status', ['held', 'partially_released'])
            ->selectRaw('SUM(total_held - total_released - total_refunded) as pending')
            ->value('pending') ?? 0;

        // Totals
        $totalGmv = DB::table('payouts')->where('status', 'paid')->sum('gross_amount');
        $totalRevenue = DB::table('payouts')->where('status', 'paid')->sum('platform_fee');
        $takeRate = $totalGmv > 0 ? round($totalRevenue / $totalGmv * 100, 2) : 0;

        // Active subscriptions total
        $activeSubscriptions = DB::table('subscription_statuses')
            ->whereIn('stripe_status', ['active', 'trialing'])
            ->count();

        return Inertia::render('analytics/admin', [
            'gmv_by_month' => $gmvByMonth,
            'commission_by_type' => $commissionByType,
            'top_campaigns' => $topCampaigns,
            'user_growth' => $userGrowth,
            'subscription_breakdown' => $subscriptionBreakdown,
            'subscription_growth' => $subscriptionGrowth,
            'summary' => [
                'total_gmv' => round((float) $totalGmv, 2),
                'total_commission' => round((float) $totalRevenue, 2),
                'take_rate_pct' => $takeRate,
                'estimated_mrr' => round($estimatedMrr, 2),
                'active_subscriptions' => $activeSubscriptions,
                'pending_escrow' => round((float) $pendingEscrow, 2),
                'total_brands' => User::role('brand')->count(),
                'total_creators' => User::role('creator')->count(),
                'new_users_today' => User::whereDate('created_at', today())->count(),
                'new_users_this_week' => User::where('created_at', '>=', now()->startOfWeek())->count(),
                'new_users_this_month' => User::where('created_at', '>=', now()->startOfMonth())->count(),
                'active_campaigns' => Campaign::where('status', 'active')->count(),
                'total_entries' => DB::table('entries')->whereNotIn('status', ['draft'])->count(),
            ],
        ]);
    }
}
