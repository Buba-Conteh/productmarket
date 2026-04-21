<?php

declare(strict_types=1);

namespace App\Http\Controllers\Entry;

use App\Http\Controllers\Controller;
use App\Models\Campaign;
use App\Models\Entry;
use App\Services\EntryService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class BrandEntryController extends Controller
{
    public function __construct(
        private readonly EntryService $entryService,
    ) {}

    /**
     * Entry review dashboard for a campaign.
     */
    public function index(Request $request, Campaign $campaign): Response
    {
        $this->authorizeBrand($request, $campaign);

        $status = $request->query('status', 'all');

        $entries = $this->entryService->campaignEntries($campaign, $status);

        $campaign->load([
            'contestDetails',
            'rippleDetails',
            'pitchDetails',
        ]);

        return Inertia::render('entries/brand/index', [
            'campaign' => $campaign,
            'entries' => $entries,
            'filters' => ['status' => $status],
            'counts' => [
                'all' => $campaign->entries()->where('status', '!=', 'draft')->count(),
                'pending_review' => $campaign->entries()->where('status', 'pending_review')->count(),
                'approved' => $campaign->entries()->where('status', 'approved')->count(),
                'live' => $campaign->entries()->where('status', 'live')->count(),
                'rejected' => $campaign->entries()->where('status', 'rejected')->count(),
            ],
        ]);
    }

    /**
     * Show a single entry for the brand.
     */
    public function show(Request $request, Campaign $campaign, Entry $entry): Response
    {
        $this->authorizeBrand($request, $campaign);
        abort_unless($entry->campaign_id === $campaign->id, 404);

        $entry = $this->entryService->loadFullEntry($entry);

        return Inertia::render('entries/brand/show', [
            'campaign' => $campaign->load(['contestDetails', 'rippleDetails', 'pitchDetails']),
            'entry' => $entry,
        ]);
    }

    /**
     * Approve a Ripple entry.
     */
    public function approveRipple(Request $request, Campaign $campaign, Entry $entry): RedirectResponse
    {
        $this->authorizeBrand($request, $campaign);
        abort_unless($entry->campaign_id === $campaign->id, 404);

        $this->entryService->approveRipple($entry);

        return back()->with('success', 'Entry approved. Initial fee payout has been queued.');
    }

    /**
     * Approve a Pitch entry (accept bid).
     */
    public function approvePitch(Request $request, Campaign $campaign, Entry $entry): RedirectResponse
    {
        $this->authorizeBrand($request, $campaign);
        abort_unless($entry->campaign_id === $campaign->id, 404);

        $validated = $request->validate([
            'accepted_bid' => ['nullable', 'numeric', 'min:1'],
        ]);

        $this->entryService->approvePitch($entry, isset($validated['accepted_bid']) ? (float) $validated['accepted_bid'] : null);

        return back()->with('success', 'Bid accepted. The creator can now post their content.');
    }

    /**
     * Confirm a Pitch entry is live (trigger payout).
     */
    public function confirmPitchLive(Request $request, Campaign $campaign, Entry $entry): RedirectResponse
    {
        $this->authorizeBrand($request, $campaign);
        abort_unless($entry->campaign_id === $campaign->id, 404);

        $this->entryService->confirmPitchLive($entry);

        return back()->with('success', 'Post confirmed. Payout has been queued.');
    }

    /**
     * Select a contest winner.
     */
    public function selectWinner(Request $request, Campaign $campaign, Entry $entry): RedirectResponse
    {
        $this->authorizeBrand($request, $campaign);
        abort_unless($entry->campaign_id === $campaign->id, 404);

        $this->entryService->selectContestWinner($campaign, $entry);

        return back()->with('success', 'Winner selected! Prize payout has been queued.');
    }

    /**
     * Reject an entry.
     */
    public function reject(Request $request, Campaign $campaign, Entry $entry): RedirectResponse
    {
        $this->authorizeBrand($request, $campaign);
        abort_unless($entry->campaign_id === $campaign->id, 404);

        $validated = $request->validate([
            'rejection_reason' => ['required', 'string', 'max:1000'],
        ]);

        $this->entryService->reject($entry, $validated['rejection_reason']);

        return back()->with('success', 'Entry rejected.');
    }

    /**
     * Request edits on an entry.
     */
    public function requestEdit(Request $request, Campaign $campaign, Entry $entry): RedirectResponse
    {
        $this->authorizeBrand($request, $campaign);
        abort_unless($entry->campaign_id === $campaign->id, 404);

        $validated = $request->validate([
            'notes' => ['required', 'string', 'max:2000'],
        ]);

        $this->entryService->requestEdit($entry, $request->user()->id, $validated['notes']);

        return back()->with('success', 'Edit request sent to the creator.');
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
