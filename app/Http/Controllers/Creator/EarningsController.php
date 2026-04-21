<?php

declare(strict_types=1);

namespace App\Http\Controllers\Creator;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class EarningsController
{
    public function index(Request $request): Response
    {
        $profile = $request->user()->creatorProfile;

        $payouts = $profile->payouts()
            ->with(['campaign:id,title,type'])
            ->orderByDesc('created_at')
            ->paginate(20);

        $payouts->through(fn ($payout) => [
            'id' => $payout->id,
            'campaign_title' => $payout->campaign?->title ?? '—',
            'campaign_type' => $payout->campaign?->type,
            'payout_type' => $payout->payout_type,
            'gross_amount' => $payout->gross_amount,
            'platform_fee' => $payout->platform_fee,
            'net_amount' => $payout->net_amount,
            'status' => $payout->status,
            'failure_reason' => $payout->failure_reason,
            'paid_at' => $payout->paid_at?->toDateString(),
            'created_at' => $payout->created_at->toDateString(),
        ]);

        $paidCount = $profile->payouts()->where('status', 'paid')->count();

        return Inertia::render('creator/earnings', [
            'total_earned' => $profile->total_earned,
            'pending_earnings' => $profile->pending_earnings,
            'paid_count' => $paidCount,
            'stripe_connect_status' => $profile->stripe_connect_status,
            'payouts' => $payouts,
        ]);
    }
}
