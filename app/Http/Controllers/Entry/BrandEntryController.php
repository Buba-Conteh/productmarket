<?php

declare(strict_types=1);

namespace App\Http\Controllers\Entry;

use App\Http\Controllers\Controller;
use App\Models\Campaign;
use App\Models\Entry;
use App\Services\EntryService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
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
        $search = $request->query('search');
        $sort = in_array($request->query('sort'), ['newest', 'oldest', 'views', 'bid'], true)
            ? $request->query('sort')
            : 'newest';

        $entries = $this->entryService->campaignEntries(
            $campaign,
            $status,
            search: is_string($search) ? $search : null,
            sort: $sort,
        );

        $campaign->load([
            'contestDetails',
            'rippleDetails',
            'pitchDetails',
        ]);

        $applications = $campaign->type === 'pitch'
            ? $campaign->applications()->with(['creator.user', 'creator.niches'])->latest()->get()
            : Collection::make([]);

        $statusCounts = $campaign->entries()
            ->selectRaw('status, count(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        $allCount = collect($statusCounts)
            ->except(['draft'])
            ->sum();

        return Inertia::render('entries/brand/index', [
            'campaign' => $campaign,
            'entries' => $entries,
            'filters' => [
                'status' => $status,
                'search' => is_string($search) ? $search : null,
                'sort' => $sort,
            ],
            'counts' => [
                'all' => $allCount,
                'pending_review' => $statusCounts['pending_review'] ?? 0,
                'approved' => $statusCounts['approved'] ?? 0,
                'live' => $statusCounts['live'] ?? 0,
                'rejected' => $statusCounts['rejected'] ?? 0,
            ],
            'applications' => $applications,
            'summary' => $this->summary($campaign, $allCount),
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

    /**
     * Headline numbers for the review dashboard.
     *
     * @return array<string, int|string>
     */
    private function summary(Campaign $campaign, int $totalEntries): array
    {
        $reach = DB::table('entry_platforms')
            ->join('entries', 'entries.id', '=', 'entry_platforms.entry_id')
            ->where('entries.campaign_id', $campaign->id)
            ->selectRaw('coalesce(sum(entry_platforms.verified_view_count), 0) as views')
            ->selectRaw('coalesce(sum(entry_platforms.comment_count), 0) as comments')
            ->first();

        return [
            'total_entries' => $totalEntries,
            'total_views' => (int) ($reach->views ?? 0),
            'total_comments' => (int) ($reach->comments ?? 0),
            'paid_out' => (string) $campaign->payouts()
                ->where('status', 'paid')
                ->sum('gross_amount'),
        ];
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
