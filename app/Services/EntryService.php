<?php

declare(strict_types=1);

namespace App\Services;

use App\Jobs\ProcessPayoutJob;
use App\Models\Campaign;
use App\Models\CreatorProfile;
use App\Models\Entry;
use App\Models\EntryEditRequest;
use App\Models\EntryRippleEarning;
use App\Notifications\EntryApproved;
use App\Notifications\EntryEditRequested;
use App\Notifications\EntryRejected;
use App\Notifications\EntrySubmitted;
use App\Notifications\EntryWon;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

final readonly class EntryService
{
    public function __construct(private readonly PayoutService $payoutService) {}

    /**
     * Create or update a draft entry for a creator.
     *
     * @param  array<string, mixed>  $data
     */
    public function saveDraft(CreatorProfile $creator, Campaign $campaign, array $data): Entry
    {
        $this->validateCanSubmit($creator, $campaign);

        return DB::transaction(function () use ($creator, $campaign, $data) {
            $entry = Entry::updateOrCreate(
                [
                    'campaign_id' => $campaign->id,
                    'creator_profile_id' => $creator->id,
                ],
                [
                    'type' => $campaign->type,
                    'content_type_id' => $data['content_type_id'] ?? null,
                    'video_url' => $data['video_url'] ?? null,
                    'video_duration_sec' => $data['video_duration_sec'] ?? null,
                    'caption' => $data['caption'] ?? null,
                    'tags' => $data['tags'] ?? [],
                    'requirements_acknowledged' => $data['requirements_acknowledged'] ?? false,
                    'status' => 'draft',
                ]
            );

            if (! empty($data['platform_ids'])) {
                $entry->platforms()->sync($data['platform_ids']);
            }

            if ($campaign->type === 'pitch' && isset($data['proposed_bid'])) {
                $entry->pitchDetails()->updateOrCreate(
                    ['entry_id' => $entry->id],
                    [
                        'proposed_bid' => $data['proposed_bid'],
                        'pitch' => $data['pitch_text'] ?? null,
                    ]
                );
            }

            return $entry;
        });
    }

    /**
     * Submit a draft entry for review.
     *
     * @param  array<string, mixed>  $data
     */
    public function submit(CreatorProfile $creator, Campaign $campaign, array $data): Entry
    {
        return DB::transaction(function () use ($creator, $campaign, $data) {
            $entry = $this->saveDraft($creator, $campaign, $data);

            abort_unless(
                $entry->requirements_acknowledged,
                422,
                'You must acknowledge all requirements before submitting.'
            );

            $entry->update([
                'status' => 'pending_review',
                'submitted_at' => now(),
            ]);

            $entry = $entry->fresh();

            // Notify the brand
            $brandUser = $campaign->brandProfile->user ?? null;
            if ($brandUser) {
                $brandUser->notify(new EntrySubmitted($entry));
            }

            return $entry;
        });
    }

    /**
     * Approve a Ripple entry — triggers initial fee payout, marks as approved.
     */
    public function approveRipple(Entry $entry): Entry
    {
        abort_unless($entry->type === 'ripple', 403, 'This entry is not a Ripple entry.');
        abort_unless($entry->status === 'pending_review', 403, 'Only pending entries can be approved.');

        $payout = null;

        $entry = DB::transaction(function () use ($entry, &$payout) {
            $entry->update([
                'status' => 'approved',
                'approved_at' => now(),
            ]);

            $campaign = $entry->campaign;
            $rippleDetails = $campaign->rippleDetails;

            if ($rippleDetails) {
                $gross = (string) $rippleDetails->initial_fee;

                $payout = $this->payoutService->createPayout($entry, 'ripple_initial_fee', $gross);

                EntryRippleEarning::create([
                    'entry_id' => $entry->id,
                    'campaign_ripple_details_id' => $rippleDetails->id,
                    'milestone_number' => 0,
                    'views_at_milestone' => 0,
                    'amount' => $gross,
                    'type' => 'initial_fee',
                    'triggered_at' => now(),
                    'payout_id' => $payout->id,
                ]);

                $rippleDetails->increment('budget_spent', (float) $gross);
            }

            return $entry->fresh();
        });

        if ($payout) {
            ProcessPayoutJob::dispatch($payout->id);
        }

        // Notify creator
        $creatorUser = $entry->creator->user ?? null;
        if ($creatorUser) {
            $creatorUser->notify(new EntryApproved($entry));
        }

        return $entry;
    }

    /**
     * Approve a Pitch entry — accept the bid, lock escrow.
     */
    public function approvePitch(Entry $entry, ?float $acceptedBid = null): Entry
    {
        abort_unless($entry->type === 'pitch', 403, 'This entry is not a Pitch entry.');
        abort_unless($entry->status === 'pending_review', 403, 'Only pending entries can be approved.');

        $entry = DB::transaction(function () use ($entry, $acceptedBid) {
            $pitchDetails = $entry->pitchDetails;
            $bid = $acceptedBid ?? (float) ($pitchDetails?->proposed_bid ?? 0);

            if ($pitchDetails) {
                $pitchDetails->update([
                    'accepted_bid' => $bid,
                    'bid_accepted_at' => now(),
                ]);
            }

            $entry->update([
                'status' => 'approved',
                'approved_at' => now(),
            ]);

            return $entry->fresh();
        });

        // Notify creator
        $creatorUser = $entry->creator->user ?? null;
        if ($creatorUser) {
            $creatorUser->notify(new EntryApproved($entry));
        }

        return $entry;
    }

    /**
     * Confirm a Pitch entry is live — triggers payout.
     */
    public function confirmPitchLive(Entry $entry): Entry
    {
        abort_unless($entry->type === 'pitch', 403);
        abort_unless($entry->status === 'live', 403, 'Entry must be live before confirming.');

        $payout = null;

        $entry = DB::transaction(function () use ($entry, &$payout) {
            $pitchDetails = $entry->pitchDetails;
            $gross = number_format((float) ($pitchDetails?->accepted_bid ?? 0), 2, '.', '');

            $payout = $this->payoutService->createPayout($entry, 'pitch_payment', $gross);

            return $entry->fresh();
        });

        if ($payout) {
            ProcessPayoutJob::dispatch($payout->id);
        }

        return $entry;
    }

    /**
     * Mark an entry as live (creator has posted publicly).
     */
    public function markLive(Entry $entry, array $platformUrls = []): Entry
    {
        abort_unless(
            in_array($entry->status, ['approved', 'won']),
            403,
            'Only approved or winning entries can go live.'
        );

        return DB::transaction(function () use ($entry, $platformUrls) {
            $entry->update([
                'status' => 'live',
                'live_at' => now(),
            ]);

            foreach ($platformUrls as $platformId => $url) {
                $entry->platforms()->updateExistingPivot($platformId, [
                    'posted_url' => $url,
                ]);
            }

            return $entry->fresh();
        });
    }

    /**
     * Select a winner for a Contest campaign.
     */
    public function selectContestWinner(Campaign $campaign, Entry $entry): Entry
    {
        abort_unless($campaign->type === 'contest', 403, 'Only contest campaigns have winners.');
        abort_unless(
            in_array($campaign->status, ['active', 'closed']),
            403,
            'Campaign must be active or closed to select a winner.'
        );
        abort_unless(
            $entry->campaign_id === $campaign->id,
            404,
            'Entry does not belong to this campaign.'
        );
        abort_unless(
            $entry->status === 'pending_review',
            403,
            'Only pending entries can be selected as winners.'
        );

        $payouts = DB::transaction(function () use ($campaign, $entry): array {
            $entry->update(['status' => 'won']);

            $contestDetails = $campaign->contestDetails;
            if ($contestDetails) {
                $contestDetails->update([
                    'winner_entry_id' => $entry->id,
                    'winner_selected_at' => now(),
                ]);
            }

            $campaign->entries()
                ->where('id', '!=', $entry->id)
                ->where('status', 'pending_review')
                ->update(['status' => 'not_selected']);

            $gross = number_format((float) ($contestDetails?->prize_amount ?? 0), 2, '.', '');
            $collected = [$this->payoutService->createPayout($entry, 'contest_prize', $gross)];

            if ($contestDetails && (float) ($contestDetails->runner_up_prize ?? 0) > 0) {
                $runnerUp = $campaign->entries()
                    ->where('id', '!=', $entry->id)
                    ->where('status', 'not_selected')
                    ->first();

                if ($runnerUp) {
                    $ruGross = number_format((float) $contestDetails->runner_up_prize, 2, '.', '');
                    $collected[] = $this->payoutService->createPayout($runnerUp, 'contest_runner_up', $ruGross);
                }
            }

            $campaign->update(['status' => 'completed']);

            return $collected;
        });

        foreach ($payouts as $payout) {
            ProcessPayoutJob::dispatch($payout->id);
        }

        $fresh = $entry->fresh();

        // Notify contest winner
        $creatorUser = $fresh->creator->user ?? null;
        if ($creatorUser) {
            $creatorUser->notify(new EntryWon($fresh));
        }

        return $fresh;
    }

    /**
     * Reject an entry with a reason.
     */
    public function reject(Entry $entry, string $reason): Entry
    {
        abort_unless(
            $entry->status === 'pending_review',
            403,
            'Only pending entries can be rejected.'
        );

        $entry->update([
            'status' => 'rejected',
            'rejection_reason' => $reason,
        ]);

        $entry = $entry->fresh();

        // Notify creator
        $creatorUser = $entry->creator->user ?? null;
        if ($creatorUser) {
            $creatorUser->notify(new EntryRejected($entry));
        }

        return $entry;
    }

    /**
     * Create an edit request on an entry.
     */
    public function requestEdit(Entry $entry, int|string $requestedByUserId, string $notes): EntryEditRequest
    {
        abort_unless(
            $entry->status === 'pending_review',
            403,
            'Edit requests can only be made on pending entries.'
        );

        $editRequest = $entry->editRequests()->create([
            'requested_by_user_id' => $requestedByUserId,
            'notes' => $notes,
            'status' => 'pending',
        ]);

        $entry->update(['status' => 'draft']);

        // Notify creator
        $creatorUser = $entry->creator->user ?? null;
        if ($creatorUser) {
            $creatorUser->notify(new EntryEditRequested($editRequest->load('entry.campaign')));
        }

        return $editRequest;
    }

    /**
     * Mark an edit request as addressed and resubmit.
     */
    public function addressEditRequest(Entry $entry, EntryEditRequest $editRequest): Entry
    {
        $editRequest->update([
            'status' => 'addressed',
            'addressed_at' => now(),
        ]);

        $entry->update([
            'status' => 'pending_review',
            'submitted_at' => now(),
        ]);

        return $entry->fresh();
    }

    /**
     * Get entries for a campaign (brand review dashboard).
     */
    public function campaignEntries(Campaign $campaign, ?string $status = null, int $perPage = 15): LengthAwarePaginator
    {
        $query = $campaign->entries()
            ->with([
                'creator.user',
                'creator.niches',
                'contentType',
                'platforms',
                'pitchDetails',
                'editRequests' => fn ($q) => $q->latest(),
            ])
            ->latest('submitted_at');

        if ($status && $status !== 'all') {
            $query->where('status', $status);
        }

        return $query->paginate($perPage);
    }

    /**
     * Get entries for a creator (my entries).
     */
    public function creatorEntries(CreatorProfile $creator, ?string $status = null, int $perPage = 12): LengthAwarePaginator
    {
        $query = $creator->entries()
            ->with(['campaign.brand', 'contentType', 'platforms', 'pitchDetails'])
            ->latest();

        if ($status && $status !== 'all') {
            $query->where('status', $status);
        }

        return $query->paginate($perPage);
    }

    /**
     * Load an entry with all relationships for display.
     */
    public function loadFullEntry(Entry $entry): Entry
    {
        return $entry->load([
            'campaign.brand',
            'campaign.platforms',
            'campaign.contentTypes',
            'campaign.contestDetails',
            'campaign.rippleDetails',
            'campaign.pitchDetails',
            'creator.user',
            'creator.niches',
            'contentType',
            'platforms',
            'pitchDetails',
            'rippleEarnings',
            'editRequests.requestedBy',
            'payouts',
        ]);
    }

    /**
     * Validate that a creator can submit to a campaign.
     */
    private function validateCanSubmit(CreatorProfile $creator, Campaign $campaign): void
    {
        abort_unless(
            in_array($campaign->status, ['active', 'closed']),
            403,
            'This campaign is not accepting entries.'
        );

        if ($campaign->status === 'closed') {
            // Allow saving drafts of existing entries but not new submissions
            $hasExisting = Entry::where('campaign_id', $campaign->id)
                ->where('creator_profile_id', $creator->id)
                ->exists();
            abort_unless($hasExisting, 403, 'This campaign is closed and not accepting new entries.');
        }

        // For Pitch campaigns, check that the creator has an approved application
        if ($campaign->type === 'pitch') {
            $hasApproved = $campaign->applications()
                ->where('creator_profile_id', $creator->id)
                ->where('status', 'approved')
                ->exists();
            abort_unless($hasApproved, 403, 'You need an approved application before submitting to this Pitch campaign.');
        }

        // Check max creators limit
        if ($campaign->max_creators !== null) {
            $approvedCount = $campaign->entries()
                ->whereNotIn('status', ['draft', 'rejected', 'not_selected', 'disqualified'])
                ->where('creator_profile_id', '!=', $creator->id)
                ->count();

            $hasExisting = $campaign->entries()
                ->where('creator_profile_id', $creator->id)
                ->exists();

            if (! $hasExisting && $approvedCount >= $campaign->max_creators) {
                abort(403, 'This campaign has reached its maximum number of creators.');
            }
        }
    }
}
