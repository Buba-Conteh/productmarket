<?php

declare(strict_types=1);

namespace App\Http\Controllers\Entry;

use App\Http\Controllers\Controller;
use App\Http\Requests\Entry\StoreEntryRequest;
use App\Models\Campaign;
use App\Models\ContentType;
use App\Models\Entry;
use App\Models\Platform;
use App\Services\EntryService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class CreatorEntryController extends Controller
{
    public function __construct(
        private readonly EntryService $entryService,
    ) {}

    /**
     * Creator's entries list (my entries).
     */
    public function index(Request $request): Response
    {
        $creator = $request->user()->creatorProfile;
        $status = $request->query('status', 'all');

        $entries = $this->entryService->creatorEntries($creator, $status);

        return Inertia::render('entries/creator/index', [
            'entries' => $entries,
            'filters' => ['status' => $status],
            'counts' => [
                'all' => $creator->entries()->count(),
                'draft' => $creator->entries()->where('status', 'draft')->count(),
                'pending_review' => $creator->entries()->where('status', 'pending_review')->count(),
                'approved' => $creator->entries()->where('status', 'approved')->count(),
                'live' => $creator->entries()->where('status', 'live')->count(),
                'rejected' => $creator->entries()->where('status', 'rejected')->count(),
            ],
        ]);
    }

    /**
     * Entry submission wizard — create form.
     */
    public function create(Request $request, Campaign $campaign): Response
    {
        $creator = $request->user()->creatorProfile;

        // Check for existing draft
        $existingEntry = Entry::where('campaign_id', $campaign->id)
            ->where('creator_profile_id', $creator->id)
            ->first();

        if ($existingEntry && $existingEntry->status !== 'draft') {
            return redirect()->route('entries.creator.show', $existingEntry)
                ->with('error', 'You already have an entry for this campaign.');
        }

        $campaign->load([
            'brand',
            'platforms',
            'contentTypes',
            'contestDetails',
            'rippleDetails',
            'pitchDetails',
        ]);

        return Inertia::render('entries/creator/submit', [
            'campaign' => $campaign,
            'entry' => $existingEntry,
            'platforms' => Platform::where('is_active', true)->orderBy('sort_order')->get(),
            'contentTypes' => ContentType::where('is_active', true)->orderBy('sort_order')->get(),
        ]);
    }

    /**
     * Store/submit an entry.
     */
    public function store(StoreEntryRequest $request, Campaign $campaign): RedirectResponse
    {
        $creator = $request->user()->creatorProfile;
        $data = $request->validated();

        if ($request->boolean('save_draft')) {
            $entry = $this->entryService->saveDraft($creator, $campaign, $data);

            return redirect()
                ->route('entries.creator.create', $campaign)
                ->with('success', 'Draft saved.');
        }

        $entry = $this->entryService->submit($creator, $campaign, $data);

        return redirect()
            ->route('entries.creator.show', $entry)
            ->with('success', 'Entry submitted for review!');
    }

    /**
     * Show an entry detail page for the creator.
     */
    public function show(Request $request, Entry $entry): Response
    {
        $this->authorizeCreator($request, $entry);

        $entry = $this->entryService->loadFullEntry($entry);

        return Inertia::render('entries/creator/show', [
            'entry' => $entry,
        ]);
    }

    /**
     * Mark an entry as live (creator posts the content).
     */
    public function markLive(Request $request, Entry $entry): RedirectResponse
    {
        $this->authorizeCreator($request, $entry);

        $validated = $request->validate([
            'platform_urls' => ['nullable', 'array'],
            'platform_urls.*' => ['nullable', 'url', 'max:2048'],
        ]);

        $this->entryService->markLive($entry, $validated['platform_urls'] ?? []);

        return redirect()
            ->route('entries.creator.show', $entry)
            ->with('success', 'Entry marked as live!');
    }

    /**
     * Address an edit request and resubmit.
     */
    public function resubmit(StoreEntryRequest $request, Campaign $campaign): RedirectResponse
    {
        $creator = $request->user()->creatorProfile;
        $data = $request->validated();

        $entry = Entry::where('campaign_id', $campaign->id)
            ->where('creator_profile_id', $creator->id)
            ->where('status', 'draft')
            ->firstOrFail();

        // Address any pending edit requests
        $pendingEdit = $entry->editRequests()->where('status', 'pending')->latest()->first();
        if ($pendingEdit) {
            $this->entryService->addressEditRequest($entry, $pendingEdit);
        }

        // Save updated entry data
        $entry = $this->entryService->saveDraft($creator, $campaign, $data);

        if (! $request->boolean('save_draft')) {
            $entry->update([
                'status' => 'pending_review',
                'submitted_at' => now(),
            ]);
        }

        return redirect()
            ->route('entries.creator.show', $entry)
            ->with('success', 'Entry resubmitted for review.');
    }

    private function authorizeCreator(Request $request, Entry $entry): void
    {
        abort_unless(
            $request->user()->creatorProfile?->id === $entry->creator_profile_id,
            403,
            'You do not own this entry.'
        );
    }
}
