<?php

declare(strict_types=1);

namespace App\Http\Controllers\Growth;

use App\Http\Controllers\Controller;
use App\Models\BrandProfile;
use App\Models\Campaign;
use App\Models\CampaignCoBrand;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class CoBrandController extends Controller
{
    public function index(Request $request, Campaign $campaign): Response
    {
        $this->authorizeBrand($request, $campaign);

        $coBrands = $campaign->coBrands()->with('brand.user')->get()->map(fn ($cb) => [
            'id' => $cb->id,
            'brand_name' => $cb->brand->company_name,
            'contribution_amount' => $cb->contribution_amount,
            'contribution_pct' => $cb->contribution_pct,
            'status' => $cb->status,
        ]);

        return Inertia::render('growth/co-brands', [
            'campaign' => $campaign->only('id', 'title', 'type'),
            'co_brands' => $coBrands,
        ]);
    }

    public function invite(Request $request, Campaign $campaign): RedirectResponse
    {
        $this->authorizeBrand($request, $campaign);

        $validated = $request->validate([
            'brand_email' => ['required', 'email', 'exists:users,email'],
            'contribution_amount' => ['required', 'numeric', 'min:1'],
        ]);

        $invitedBrand = BrandProfile::whereHas('user', fn ($q) => $q->where('email', $validated['brand_email']))->first();
        abort_unless($invitedBrand, 404, 'Brand not found.');

        $totalEscrow = $campaign->escrowTransaction?->total_held ?? 0;
        $pct = $totalEscrow > 0
            ? round($validated['contribution_amount'] / $totalEscrow * 100, 2)
            : 0;

        CampaignCoBrand::updateOrCreate(
            ['campaign_id' => $campaign->id, 'brand_profile_id' => $invitedBrand->id],
            ['contribution_amount' => $validated['contribution_amount'], 'contribution_pct' => $pct, 'status' => 'invited'],
        );

        return back()->with('success', 'Co-brand invitation sent.');
    }

    public function accept(Request $request, Campaign $campaign): RedirectResponse
    {
        $brand = $request->user()->brandProfile;
        $coBrand = CampaignCoBrand::where('campaign_id', $campaign->id)
            ->where('brand_profile_id', $brand->id)
            ->where('status', 'invited')
            ->firstOrFail();

        $coBrand->update(['status' => 'accepted']);

        return back()->with('success', 'You have joined this campaign as a co-sponsor.');
    }

    public function decline(Request $request, Campaign $campaign): RedirectResponse
    {
        $brand = $request->user()->brandProfile;
        $coBrand = CampaignCoBrand::where('campaign_id', $campaign->id)
            ->where('brand_profile_id', $brand->id)
            ->where('status', 'invited')
            ->firstOrFail();

        $coBrand->update(['status' => 'declined']);

        return back()->with('success', 'Co-brand invitation declined.');
    }

    private function authorizeBrand(Request $request, Campaign $campaign): void
    {
        abort_unless(
            $request->user()->brandProfile?->id === $campaign->brand_profile_id,
            403,
        );
    }
}
