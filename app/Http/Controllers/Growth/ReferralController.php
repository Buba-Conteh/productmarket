<?php

declare(strict_types=1);

namespace App\Http\Controllers\Growth;

use App\Http\Controllers\Controller;
use App\Models\Referral;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class ReferralController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        $referrals = Referral::where('referrer_user_id', $user->id)
            ->with('referred:id,name,email,created_at')
            ->latest()
            ->get()
            ->map(fn ($r) => [
                'id' => $r->id,
                'referred_name' => $r->referred->name,
                'type' => $r->type,
                'status' => $r->status,
                'qualified_at' => $r->qualified_at,
                'rewarded_at' => $r->rewarded_at,
                'created_at' => $r->created_at,
            ]);

        return Inertia::render('growth/referrals', [
            'referral_code' => $user->referral_code,
            'referral_link' => url('/register?ref='.$user->referral_code),
            'referrals' => $referrals,
            'stats' => [
                'total' => $referrals->count(),
                'qualified' => $referrals->whereIn('status', ['qualified', 'rewarded'])->count(),
                'rewarded' => $referrals->where('status', 'rewarded')->count(),
            ],
        ]);
    }
}
