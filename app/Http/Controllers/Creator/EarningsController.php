<?php

declare(strict_types=1);

namespace App\Http\Controllers\Creator;

use App\Services\CreatorWalletService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class EarningsController
{
    public function index(Request $request, CreatorWalletService $wallet): Response
    {
        $profile = $request->user()->creatorProfile;

        $payouts = $profile->payouts()
            ->with(['campaign:id,title,type'])
            ->orderByDesc('created_at')
            ->paginate(20);

        // Same rule as the wallet summary: pending money is "awaiting account"
        // whenever the creator cannot receive transfers yet.
        $awaitingAccount = ! $profile->canReceivePayouts();

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
            'awaiting_account' => $awaitingAccount && in_array($payout->status, ['pending', 'processing'], true),
            'paid_at' => $payout->paid_at?->toDateString(),
            'created_at' => $payout->created_at->toDateString(),
        ]);

        return Inertia::render('creator/earnings', [
            ...$wallet->summary($profile)->toArray(),
            'stripe_connect_status' => $profile->stripe_connect_id ? $profile->stripe_connect_status : null,
            'payouts' => $payouts,
        ]);
    }
}
