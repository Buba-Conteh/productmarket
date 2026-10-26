<?php

declare(strict_types=1);

namespace App\Http\Controllers\Entry;

use App\Http\Controllers\Controller;
use App\Jobs\PublishToTikTokJob;
use App\Models\Entry;
use App\Models\Platform;
use App\Models\SocialAccount;
use App\Services\Social\TikTokPostingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use RuntimeException;

final class TikTokPublishController extends Controller
{
    public function __construct(
        private readonly TikTokPostingService $postingService,
    ) {}

    /**
     * Live posting settings for the creator's TikTok account (nickname,
     * allowed privacy levels, disabled interactions, max duration). TikTok
     * requires these to drive the post form rather than hardcoded options.
     */
    public function creatorInfo(Request $request, Entry $entry): JsonResponse
    {
        [, $socialAccount] = $this->resolvePostingContext($request, $entry);

        try {
            $info = $this->postingService->queryCreatorInfo($socialAccount);
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            ...$info,
            'video_duration_sec' => $entry->video_duration_sec,
        ]);
    }

    /**
     * Initiate a TikTok direct post for an approved entry.
     */
    public function store(Request $request, Entry $entry): JsonResponse
    {
        [$tiktokPlatform, $socialAccount] = $this->resolvePostingContext($request, $entry);

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

        try {
            $creatorInfo = $this->postingService->queryCreatorInfo($socialAccount);
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        $maxDuration = $creatorInfo['max_video_post_duration_sec'];

        abort_if(
            $maxDuration > 0
                && $entry->video_duration_sec !== null
                && $entry->video_duration_sec > $maxDuration,
            422,
            "This video is longer than the {$maxDuration}s your TikTok account allows."
        );

        // No default privacy level: the creator must choose one explicitly,
        // from the options TikTok reports for their account.
        $validated = $request->validate([
            'caption' => ['nullable', 'string', 'max:2200'],
            'privacy_level' => ['required', 'string', Rule::in($creatorInfo['privacy_level_options'])],
            'disable_comment' => ['nullable', 'boolean'],
            'disable_duet' => ['nullable', 'boolean'],
            'disable_stitch' => ['nullable', 'boolean'],
            'brand_content_toggle' => ['nullable', 'boolean'],
            'brand_organic_toggle' => ['nullable', 'boolean'],
            'music_consent' => ['accepted'],
        ]);

        $brandedContent = (bool) ($validated['brand_content_toggle'] ?? false);

        // TikTok does not allow paid-partnership content to be private.
        abort_if(
            $brandedContent && $validated['privacy_level'] === 'SELF_ONLY',
            422,
            'Branded content visibility cannot be set to private.'
        );

        // Interactions are opt-in, and anything the creator has disabled
        // account-wide on TikTok stays disabled.
        $postData = [
            'caption' => $validated['caption'] ?? $entry->caption ?? '',
            'privacy_level' => $validated['privacy_level'],
            'disable_comment' => $creatorInfo['comment_disabled'] || ($validated['disable_comment'] ?? true),
            'disable_duet' => $creatorInfo['duet_disabled'] || ($validated['disable_duet'] ?? true),
            'disable_stitch' => $creatorInfo['stitch_disabled'] || ($validated['disable_stitch'] ?? true),
            'brand_content_toggle' => $brandedContent,
            'brand_organic_toggle' => (bool) ($validated['brand_organic_toggle'] ?? false),
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

    /**
     * Shared preconditions for anything that talks to the creator's TikTok
     * account on behalf of an entry.
     *
     * @return array{0: Platform, 1: SocialAccount}
     */
    private function resolvePostingContext(Request $request, Entry $entry): array
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

        return [$tiktokPlatform, $socialAccount];
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
