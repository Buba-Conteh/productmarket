<?php

declare(strict_types=1);

namespace App\Http\Controllers\Campaign;

use App\Http\Controllers\Controller;
use App\Models\Campaign;
use App\Models\CampaignApplication;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class CampaignApplicationController extends Controller
{
    /**
     * Creator submits a Pitch application.
     */
    public function store(Request $request, Campaign $campaign): RedirectResponse
    {
        abort_unless($campaign->type === 'pitch', 403, 'Applications are only for Pitch campaigns.');
        abort_unless($campaign->status === 'active', 403, 'This campaign is not accepting applications.');

        $creatorProfile = $request->user()->creatorProfile;
        abort_unless($creatorProfile !== null, 403);

        $existing = $campaign->applications()
            ->where('creator_profile_id', $creatorProfile->id)
            ->exists();
        abort_if($existing, 409, 'You have already applied to this campaign.');

        $validated = $request->validate([
            'pitch' => ['nullable', 'string', 'max:2000'],
        ]);

        $campaign->applications()->create([
            'creator_profile_id' => $creatorProfile->id,
            'pitch' => $validated['pitch'] ?? null,
            'status' => 'pending',
        ]);

        return back()->with('success', 'Application submitted! The brand will review it shortly.');
    }

    /**
     * Brand views applications for a campaign.
     */
    public function index(Request $request, Campaign $campaign): Response
    {
        abort_unless($campaign->type === 'pitch', 403);
        abort_unless(
            $request->user()->brandProfile?->id === $campaign->brand_profile_id,
            403,
            'You do not own this campaign.'
        );

        $applications = $campaign->applications()
            ->with(['creator.user', 'creator.niches'])
            ->latest()
            ->paginate(20);

        return Inertia::render('campaigns/brand/applications', [
            'campaign' => $campaign,
            'applications' => $applications,
        ]);
    }

    /**
     * Brand approves an application.
     */
    public function approve(Request $request, Campaign $campaign, CampaignApplication $application): RedirectResponse
    {
        $this->authorizeBrandAction($request, $campaign, $application);

        $application->update(['status' => 'approved']);

        return back()->with('success', 'Application approved. The creator can now submit an entry.');
    }

    /**
     * Brand rejects an application.
     */
    public function reject(Request $request, Campaign $campaign, CampaignApplication $application): RedirectResponse
    {
        $this->authorizeBrandAction($request, $campaign, $application);

        $application->update(['status' => 'rejected']);

        return back()->with('success', 'Application rejected.');
    }

    /**
     * Verify the brand owns this campaign and the application belongs to it.
     */
    private function authorizeBrandAction(Request $request, Campaign $campaign, CampaignApplication $application): void
    {
        abort_unless(
            $request->user()->brandProfile?->id === $campaign->brand_profile_id,
            403,
            'You do not own this campaign.'
        );
        abort_unless(
            $application->campaign_id === $campaign->id,
            404,
            'Application not found for this campaign.'
        );
    }
}
