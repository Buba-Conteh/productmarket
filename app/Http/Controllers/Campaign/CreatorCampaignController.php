<?php

declare(strict_types=1);

namespace App\Http\Controllers\Campaign;

use App\Http\Controllers\Controller;
use App\Models\Campaign;
use App\Models\ContentType;
use App\Models\Platform;
use App\Services\CampaignService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class CreatorCampaignController extends Controller
{
    public function __construct(
        private readonly CampaignService $campaignService,
    ) {}

    /**
     * Campaign discovery feed for creators.
     */
    public function index(Request $request): Response
    {
        $filters = $request->only(['type', 'platform_id', 'content_type_id', 'search', 'sort']);

        $campaigns = $this->campaignService->discoveryCampaigns($filters);

        return Inertia::render('campaigns/creator/index', [
            'campaigns' => $campaigns,
            'filters' => $filters,
            'platforms' => Platform::where('is_active', true)->orderBy('sort_order')->get(),
            'contentTypes' => ContentType::where('is_active', true)->orderBy('sort_order')->get(),
        ]);
    }

    /**
     * Campaign detail page for a creator.
     */
    public function show(Request $request, Campaign $campaign): Response
    {
        abort_unless($campaign->status === 'active', 404);

        $campaign = $this->campaignService->loadFullCampaign($campaign);

        $creatorProfile = $request->user()->creatorProfile;
        $hasApplied = false;
        $hasEntry = false;
        $applicationStatus = null;

        if ($creatorProfile) {
            $application = $campaign->applications()
                ->where('creator_profile_id', $creatorProfile->id)
                ->first();
            $hasApplied = $application !== null;
            $applicationStatus = $application?->status;

            $hasEntry = $campaign->entries()
                ->where('creator_profile_id', $creatorProfile->id)
                ->exists();
        }

        return Inertia::render('campaigns/creator/show', [
            'campaign' => $campaign,
            'hasApplied' => $hasApplied,
            'applicationStatus' => $applicationStatus,
            'hasEntry' => $hasEntry,
        ]);
    }
}
