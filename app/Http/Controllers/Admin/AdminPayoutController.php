<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Payout;
use App\Services\PayoutService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class AdminPayoutController extends Controller
{
    private const array FILTERS = ['attention', 'failed', 'awaiting_account', 'pending', 'paid', 'all'];

    public function index(Request $request): Response
    {
        $filter = in_array($request->query('filter'), self::FILTERS, true)
            ? $request->query('filter')
            : 'attention';

        $payouts = Payout::query()
            ->with(['campaign:id,title', 'creator:id,user_id,display_name,stripe_connect_id,stripe_connect_status', 'creator.user:id,email'])
            ->when($filter === 'attention', fn ($q) => $q->where(fn ($q) => $q
                ->where('status', 'failed')
                ->orWhere(fn ($q) => $q->where('status', 'pending')->where('failure_reason', Payout::AWAITING_ACCOUNT_REASON))))
            ->when($filter === 'failed', fn ($q) => $q->where('status', 'failed'))
            ->when($filter === 'awaiting_account', fn ($q) => $q
                ->where('status', 'pending')
                ->where('failure_reason', Payout::AWAITING_ACCOUNT_REASON))
            ->when($filter === 'pending', fn ($q) => $q->whereIn('status', ['pending', 'processing']))
            ->when($filter === 'paid', fn ($q) => $q->where('status', 'paid'))
            ->orderByDesc('created_at')
            ->paginate(25)
            ->withQueryString()
            ->through(fn (Payout $payout) => [
                'id' => $payout->id,
                'creator_name' => $payout->creator?->display_name ?? '—',
                'creator_email' => $payout->creator?->user?->email,
                'account_status' => $payout->creator?->stripe_connect_id
                    ? $payout->creator->stripe_connect_status
                    : 'not_connected',
                'campaign_title' => $payout->campaign?->title ?? '—',
                'payout_type' => $payout->payout_type,
                'gross_amount' => $payout->gross_amount,
                'net_amount' => $payout->net_amount,
                'status' => $payout->status,
                'failure_reason' => $payout->failure_reason,
                'retry_count' => $payout->retry_count,
                'created_at' => $payout->created_at->toISOString(),
                'can_retry' => $payout->status === 'failed',
            ]);

        return Inertia::render('admin/payouts/index', [
            'payouts' => $payouts,
            'filter' => $filter,
            'totals' => [
                'failed' => (string) Payout::where('status', 'failed')->sum('net_amount'),
                'awaiting_account' => (string) Payout::where('status', 'pending')
                    ->where('failure_reason', Payout::AWAITING_ACCOUNT_REASON)
                    ->sum('net_amount'),
                'pending' => (string) Payout::whereIn('status', ['pending', 'processing'])->sum('net_amount'),
                'paid' => (string) Payout::where('status', 'paid')->sum('net_amount'),
            ],
        ]);
    }

    public function retry(Payout $payout, PayoutService $payoutService): RedirectResponse
    {
        if ($payout->status !== 'failed') {
            return back()->with('error', 'Only failed payouts can be retried.');
        }

        $payoutService->retry($payout);

        $message = $payout->creator->canReceivePayouts()
            ? 'Payout queued for transfer.'
            : 'Payout restored. It will be sent once the creator connects a payout account.';

        return back()->with('success', $message);
    }
}
