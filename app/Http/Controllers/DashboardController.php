<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

final class DashboardController
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();

        if ($user->hasRole('brand') && $user->brandProfile) {
            return $this->brandDashboard($user);
        }

        if ($user->hasRole('creator') && $user->creatorProfile) {
            return $this->creatorDashboard($user);
        }

        return Inertia::render('dashboard');
    }

    private function brandDashboard(User $user): Response
    {
        $brand = $user->brandProfile;

        $activeCampaigns = $brand->campaigns()->where('status', 'active')->count();

        $totalViews = (int) DB::table('entry_platforms')
            ->join('entries', 'entries.id', '=', 'entry_platforms.entry_id')
            ->join('campaigns', 'campaigns.id', '=', 'entries.campaign_id')
            ->where('campaigns.brand_profile_id', $brand->id)
            ->sum('entry_platforms.verified_view_count');

        $budgetSpent = (float) DB::table('payouts')
            ->join('campaigns', 'campaigns.id', '=', 'payouts.campaign_id')
            ->where('campaigns.brand_profile_id', $brand->id)
            ->where('payouts.status', 'paid')
            ->sum('payouts.gross_amount');

        $entriesThisWeek = (int) DB::table('entries')
            ->join('campaigns', 'campaigns.id', '=', 'entries.campaign_id')
            ->where('campaigns.brand_profile_id', $brand->id)
            ->where('entries.submitted_at', '>=', now()->subWeek()->toDateTimeString())
            ->whereNotNull('entries.submitted_at')
            ->count();

        [$chartData, $chartLabels] = $this->brandChartData($brand->id);

        $totalEntries = (int) DB::table('entries')
            ->join('campaigns', 'campaigns.id', '=', 'entries.campaign_id')
            ->where('campaigns.brand_profile_id', $brand->id)
            ->whereNotNull('entries.submitted_at')
            ->count();

        $recentActivity = DB::table('entries')
            ->join('campaigns', 'campaigns.id', '=', 'entries.campaign_id')
            ->join('creator_profiles', 'creator_profiles.id', '=', 'entries.creator_profile_id')
            ->join('users', 'users.id', '=', 'creator_profiles.user_id')
            ->where('campaigns.brand_profile_id', $brand->id)
            ->whereNotIn('entries.status', ['draft'])
            ->orderByDesc('entries.updated_at')
            ->limit(5)
            ->select([
                'entries.id',
                'entries.status',
                'entries.type',
                'entries.updated_at',
                'campaigns.title as campaign_title',
                'creator_profiles.display_name as creator_name',
            ])
            ->get()
            ->map(fn ($row) => [
                'id' => $row->id,
                'event_type' => $this->entryStatusToEvent($row->status),
                'title' => $this->brandActivityTitle($row->status, $row->type),
                'description' => "{$row->creator_name} · {$row->campaign_title}",
                'created_at' => $row->updated_at,
            ])
            ->values();

        $subscription = $user->subscription('brand');
        $subscriptionActive = $subscription && $subscription->active();

        return Inertia::render('dashboard', [
            'stats' => [
                'active_campaigns' => $activeCampaigns,
                'total_views' => $totalViews,
                'budget_spent' => number_format($budgetSpent, 2, '.', ''),
                'entries_this_week' => $entriesThisWeek,
                'total_entries' => $totalEntries,
                'subscription_active' => $subscriptionActive,
            ],
            'chart' => [
                'data' => $chartData,
                'labels' => $chartLabels,
            ],
            'recent_activity' => $recentActivity,
        ]);
    }

    private function creatorDashboard(User $user): Response
    {
        $creator = $user->creatorProfile;

        $activeEntries = $creator->entries()
            ->whereIn('status', ['pending_review', 'approved', 'live', 'won'])
            ->count();

        $totalViews = (int) DB::table('entry_platforms')
            ->join('entries', 'entries.id', '=', 'entry_platforms.entry_id')
            ->where('entries.creator_profile_id', $creator->id)
            ->sum('entry_platforms.verified_view_count');

        [$chartData, $chartLabels] = $this->creatorChartData($creator);

        $pendingPayoutsCount = $creator->payouts()->where('status', 'pending')->count();

        $recentPayouts = $creator->payouts()
            ->with('campaign:id,title')
            ->whereIn('status', ['paid', 'pending', 'processing'])
            ->orderByDesc('created_at')
            ->limit(3)
            ->get()
            ->map(fn ($p) => [
                'id' => 'payout_'.$p->id,
                'event_type' => $p->status === 'paid' ? 'payout_paid' : 'payout_pending',
                'title' => $p->status === 'paid' ? 'Payout received' : 'Payout processing',
                'description' => '$'.number_format((float) $p->net_amount, 2).' · '.($p->campaign?->title ?? 'Campaign'),
                'created_at' => $p->created_at->toISOString(),
            ]);

        $recentEntries = $creator->entries()
            ->with('campaign:id,title')
            ->whereNotIn('status', ['draft'])
            ->orderByDesc('updated_at')
            ->limit(3)
            ->get()
            ->map(fn ($e) => [
                'id' => 'entry_'.$e->id,
                'event_type' => $this->entryStatusToEvent($e->status),
                'title' => $this->creatorActivityTitle($e->status),
                'description' => $e->campaign?->title ?? 'Campaign',
                'created_at' => $e->updated_at->toISOString(),
            ]);

        $recentActivity = $recentPayouts->toBase()->merge($recentEntries->toBase())
            ->sortByDesc('created_at')
            ->take(5)
            ->values();

        return Inertia::render('dashboard', [
            'stats' => [
                'total_earned' => number_format((float) $creator->total_earned, 2, '.', ''),
                'pending_earnings' => number_format((float) $creator->pending_earnings, 2, '.', ''),
                'active_entries' => $activeEntries,
                'total_views' => $totalViews,
                'pending_payouts_count' => $pendingPayoutsCount,
                'stripe_connect_status' => $creator->stripe_connect_status ?? 'pending',
            ],
            'chart' => [
                'data' => $chartData,
                'labels' => $chartLabels,
            ],
            'recent_activity' => $recentActivity,
        ]);
    }

    /**
     * @return array{array<int, int>, array<int, string>}
     */
    private function brandChartData(string $brandProfileId): array
    {
        $since = now()->subMonths(11)->startOfMonth();

        $entries = DB::table('entries')
            ->join('campaigns', 'campaigns.id', '=', 'entries.campaign_id')
            ->where('campaigns.brand_profile_id', $brandProfileId)
            ->where('entries.submitted_at', '>=', $since->toDateTimeString())
            ->whereNotNull('entries.submitted_at')
            ->pluck('entries.submitted_at');

        $grouped = $entries->groupBy(fn ($ts) => Carbon::parse($ts)->format('Y-m'));

        $data = [];
        $labels = [];

        for ($i = 11; $i >= 0; $i--) {
            $month = now()->subMonths($i)->startOfMonth();
            $key = $month->format('Y-m');
            $labels[] = $month->format('M');
            $data[] = $grouped->get($key, collect())->count();
        }

        return [$data, $labels];
    }

    /**
     * @return array{array<int, float>, array<int, string>}
     */
    private function creatorChartData(mixed $creator): array
    {
        $since = now()->subMonths(11)->startOfMonth();

        $payouts = $creator->payouts()
            ->where('status', 'paid')
            ->where('paid_at', '>=', $since->toDateTimeString())
            ->get(['net_amount', 'paid_at']);

        $grouped = $payouts->groupBy(fn ($p) => Carbon::parse($p->paid_at)->format('Y-m'));

        $data = [];
        $labels = [];

        for ($i = 11; $i >= 0; $i--) {
            $month = now()->subMonths($i)->startOfMonth();
            $key = $month->format('Y-m');
            $labels[] = $month->format('M');
            $data[] = (float) $grouped->get($key, collect())->sum('net_amount');
        }

        return [$data, $labels];
    }

    private function entryStatusToEvent(string $status): string
    {
        return match ($status) {
            'pending_review' => 'entry_submitted',
            'approved' => 'entry_approved',
            'live' => 'entry_live',
            'won' => 'entry_won',
            'rejected' => 'entry_rejected',
            'not_selected' => 'entry_not_selected',
            default => 'entry_submitted',
        };
    }

    private function brandActivityTitle(string $status, string $type): string
    {
        return match ($status) {
            'pending_review' => ucfirst($type).' entry submitted',
            'approved' => 'Entry approved',
            'live' => 'Entry went live',
            'won' => 'Contest winner selected',
            'rejected' => 'Entry rejected',
            'not_selected' => 'Entry not selected',
            default => 'Entry updated',
        };
    }

    private function creatorActivityTitle(string $status): string
    {
        return match ($status) {
            'pending_review' => 'Entry under review',
            'approved' => 'Entry approved',
            'live' => 'Entry is live',
            'won' => 'You won the contest!',
            'rejected' => 'Entry not accepted',
            'not_selected' => 'Contest result announced',
            default => 'Entry updated',
        };
    }
}
