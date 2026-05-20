<?php

declare(strict_types=1);

namespace App\Http\Controllers\Entry;

use App\Http\Controllers\Controller;
use App\Jobs\PublishToTikTokJob;
use App\Models\Entry;
use App\Models\Platform;
use App\Services\Social\TikTokPostingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class TikTokPublishController extends Controller
{
    public function __construct(
        private readonly TikTokPostingService $postingService,
    ) {}

    /**
     * Initiate a TikTok direct post for an approved entry.
     */
    public function store(Request $request, Entry $entry): JsonResponse
    {
        $this->authorizeCreator($request, $entry);

        abort_unless(
            in_array($entry->status, ['approved', 'won']),
            403,
            'Only approved or winning entries can be posted.'
        );

        abort_unless(
            $entry->video_url !== null,
            422,
            'This entry has no video to post.'
        );

        $tiktokPlatform = Platform::where('slug', 'tiktok')->firstOrFail();

        // Entry must include TikTok as a selected platform
        $hasTiktok = $entry->platforms()->where('platforms.id', $tiktokPlatform->id)->exists();
        abort_unless($hasTiktok, 422, 'TikTok is not selected as a platform for this entry.');

        // Creator must have TikTok connected with video.publish scope
        $socialAccount = $request->user()
            ->socialAccounts()
            ->where('platform_id', $tiktokPlatform->id)
            ->first();

        abort_unless($socialAccount !== null, 422, 'No TikTok account connected.');
        abort_unless(
            in_array('video.publish', (array) ($socialAccount->scopes ?? [])),
            422,
            'Re-connect your TikTok account to enable direct posting.'
        );

        // Guard: don't re-queue if already in progress
        $pivot = $entry->platforms()
            ->where('platforms.id', $tiktokPlatform->id)
            ->first()
            ?->pivot;

        if ($pivot && in_array($pivot->publish_status, ['pending', 'processing', 'published'])) {
            return response()->json([
                'publish_status' => $pivot->publish_status,
                'posted_url' => $pivot->posted_url,
            ]);
        }

        $validated = $request->validate([
            'caption' => ['nullable', 'string', 'max:2200'],
            'privacy_level' => ['nullable', 'string', 'in:PUBLIC_TO_EVERYONE,MUTUAL_FOLLOW_FRIENDS,FOLLOWER_OF_CREATOR,SELF_ONLY'],
            'disable_comment' => ['nullable', 'boolean'],
            'disable_duet' => ['nullable', 'boolean'],
            'disable_stitch' => ['nullable', 'boolean'],
        ]);

        $postData = [
            'caption' => $validated['caption'] ?? $entry->caption ?? '',
            'privacy_level' => $validated['privacy_level'] ?? 'PUBLIC_TO_EVERYONE',
            'disable_comment' => $validated['disable_comment'] ?? false,
            'disable_duet' => $validated['disable_duet'] ?? false,
            'disable_stitch' => $validated['disable_stitch'] ?? false,
        ];

        $result = $this->postingService->initializeUpload($socialAccount, $entry, $postData);

        // Persist publish_id and mark as pending
        $entry->platforms()->updateExistingPivot($tiktokPlatform->id, [
            'tiktok_publish_id' => $result['publish_id'],
            'publish_status' => 'pending',
        ]);

        PublishToTikTokJob::dispatch(
            $entry->id,
            $socialAccount->id,
            $result['publish_id'],
            $result['upload_url'],
            $tiktokPlatform->id,
        );

        return response()->json([
            'publish_status' => 'pending',
            'posted_url' => null,
        ]);
    }

    /**
     * Return the current TikTok publish status for an entry (used by frontend polling).
     */
    public function status(Request $request, Entry $entry): JsonResponse
    {
        $this->authorizeCreator($request, $entry);

        $tiktokPlatform = Platform::where('slug', 'tiktok')->first();

        if (! $tiktokPlatform) {
            return response()->json(['publish_status' => null, 'posted_url' => null]);
        }

        $pivot = $entry->platforms()
            ->where('platforms.id', $tiktokPlatform->id)
            ->first()
            ?->pivot;

        return response()->json([
            'publish_status' => $pivot?->publish_status,
            'posted_url' => $pivot?->posted_url,
        ]);
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
