<?php

declare(strict_types=1);

namespace App\Http\Controllers\Campaign;

use App\Http\Controllers\Controller;
use App\Http\Requests\Campaign\StoreCampaignRequest;
use App\Http\Requests\Campaign\UpdateCampaignRequest;
use App\Models\Campaign;
use App\Models\CampaignResource;
use App\Models\ContentType;
use App\Models\Platform;
use App\Services\CampaignService;
use App\Support\FileUploader;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Inertia\Inertia;
use Inertia\Response;

final class BrandCampaignController extends Controller
{
    public function __construct(
        private readonly CampaignService $campaignService,
    ) {}

    /**
     * Brand campaign dashboard — list all campaigns.
     */
    public function index(Request $request): Response
    {
        $brand = $request->user()->brandProfile;
        $status = $request->query('status', 'all');

        $campaigns = $this->campaignService->brandCampaigns($brand, $status);

        $statusCounts = $brand->campaigns()
            ->selectRaw('status, count(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        return Inertia::render('campaigns/brand/index', [
            'campaigns' => $campaigns,
            'filters' => ['status' => $status],
            'counts' => [
                'all' => array_sum($statusCounts),
                'draft' => $statusCounts['draft'] ?? 0,
                'active' => $statusCounts['active'] ?? 0,
                'closed' => $statusCounts['closed'] ?? 0,
                'completed' => $statusCounts['completed'] ?? 0,
                'cancelled' => $statusCounts['cancelled'] ?? 0,
            ],
        ]);
    }

    /**
     * Campaign creation form.
     */
    public function create(): Response
    {
        return Inertia::render('campaigns/brand/create', [
            'platforms' => Platform::where('is_active', true)->orderBy('sort_order')->get(),
            'contentTypes' => ContentType::where('is_active', true)->orderBy('sort_order')->get(),
        ]);
    }

    /**
     * Store a new draft campaign.
     */
    public function store(StoreCampaignRequest $request): RedirectResponse
    {
        $brand = $request->user()->brandProfile;
        $campaign = $this->campaignService->createDraft($brand, $request->validated());
        if ($request->hasFile('thumbnail')) {
            $path = FileUploader::store($request->file('thumbnail'), 'campaigns/thumbnails');
            $campaign->update(['thumbnail' => $path]);
        }

        if ($request->hasFile('resources')) {
            $this->storeResources($campaign, $request->file('resources'));
        }

        return redirect()
            ->route('campaigns.brand.edit', $campaign)
            ->with('success', 'Campaign draft created.');
    }

    /**
     * Show campaign detail page for the brand.
     */
    public function show(Request $request, Campaign $campaign): Response
    {
        $this->authorizeBrand($request, $campaign);
        $campaign = $this->campaignService->loadFullCampaign($campaign);

        return Inertia::render('campaigns/brand/show', [
            'campaign' => $campaign,
        ]);
    }

    /**
     * Edit a draft campaign.
     */
    public function edit(Request $request, Campaign $campaign): Response
    {
        $this->authorizeBrand($request, $campaign);
        abort_unless($campaign->status === 'draft', 403, 'Only draft campaigns can be edited.');

        $campaign = $this->campaignService->loadFullCampaign($campaign);

        return Inertia::render('campaigns/brand/edit', [
            'campaign' => $campaign,
            'platforms' => Platform::where('is_active', true)->orderBy('sort_order')->get(),
            'contentTypes' => ContentType::where('is_active', true)->orderBy('sort_order')->get(),
        ]);
    }

    /**
     * Update a draft campaign.
     */
    public function update(UpdateCampaignRequest $request, Campaign $campaign): RedirectResponse
    {
        $this->campaignService->updateDraft($campaign, $request->validated());

        if ($request->boolean('remove_thumbnail')) {
            FileUploader::delete($campaign->thumbnail);
            $campaign->update(['thumbnail' => null]);
        } elseif ($request->hasFile('thumbnail')) {
            $path = FileUploader::replace($campaign->thumbnail, $request->file('thumbnail'), 'campaigns/thumbnails');
            $campaign->update(['thumbnail' => $path]);
        }

        if ($request->has('remove_resource_ids')) {
            CampaignResource::whereIn('id', $request->input('remove_resource_ids', []))
                ->where('campaign_id', $campaign->id)
                ->get()
                ->each(function (CampaignResource $resource): void {
                    FileUploader::delete($resource->path);
                    $resource->delete();
                });
        }

        if ($request->hasFile('resources')) {
            $this->storeResources($campaign, $request->file('resources'));
        }

        return redirect()
            ->route('campaigns.brand.edit', $campaign)
            ->with('success', 'Campaign updated.');
    }

    /**
     * Publish a draft campaign (moves to active).
     */
    public function publish(Request $request, Campaign $campaign): RedirectResponse
    {
        $this->authorizeBrand($request, $campaign);
        $this->campaignService->publish($campaign);

        return redirect()
            ->route('campaigns.brand.show', $campaign)
            ->with('success', 'Campaign published! It is now live.');
    }

    /**
     * Close an active campaign.
     */
    public function close(Request $request, Campaign $campaign): RedirectResponse
    {
        $this->authorizeBrand($request, $campaign);
        $this->campaignService->close($campaign);

        return redirect()
            ->route('campaigns.brand.show', $campaign)
            ->with('success', 'Campaign closed. No new entries will be accepted.');
    }

    /**
     * Republish a closed or cancelled campaign.
     */
    public function republish(Request $request, Campaign $campaign): RedirectResponse
    {
        $this->authorizeBrand($request, $campaign);
        $this->campaignService->republish($campaign);

        return redirect()
            ->route('campaigns.brand.show', $campaign)
            ->with('success', 'Campaign is live again and accepting entries.');
    }

    /**
     * Cancel a campaign.
     */
    public function cancel(Request $request, Campaign $campaign): RedirectResponse
    {
        $this->authorizeBrand($request, $campaign);
        $this->campaignService->cancel($campaign);

        return redirect()
            ->route('campaigns.brand.index')
            ->with('success', 'Campaign cancelled.');
    }

    /**
     * @param  UploadedFile[]  $files
     */
    private function storeResources(Campaign $campaign, array $files): void
    {
        foreach ($files as $file) {
            $path = FileUploader::store($file, 'campaigns/resources');

            $campaign->resources()->create([
                'original_name' => basename($file->getClientOriginalName()),
                'file_name' => basename($path),
                'mime_type' => $file->getMimeType() ?? $file->getClientMimeType(),
                'size' => $file->getSize(),
                'path' => $path,
            ]);
        }
    }

    private function authorizeBrand(Request $request, Campaign $campaign): void
    {
        abort_unless(
            $request->user()->brandProfile?->id === $campaign->brand_profile_id,
            403,
            'You do not own this campaign.'
        );
    }
}
