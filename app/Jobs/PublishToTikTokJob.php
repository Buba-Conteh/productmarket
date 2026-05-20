<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\Entry;
use App\Models\SocialAccount;
use App\Services\EntryService;
use App\Services\Social\TikTokPostingService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Throwable;

final class PublishToTikTokJob implements ShouldQueue
{
    use InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 1;

    public int $timeout = 300; // 5 minutes for large video uploads

    public function __construct(
        public readonly string $entryId,
        public readonly string $socialAccountId,
        public readonly string $publishId,
        public readonly string $uploadUrl,
        public readonly string $tiktokPlatformId,
    ) {}

    public function handle(TikTokPostingService $postingService, EntryService $entryService): void
    {
        $entry = Entry::find($this->entryId);
        $account = SocialAccount::find($this->socialAccountId);

        if (! $entry || ! $account) {
            return;
        }

        // Guard: only proceed if still pending (prevent duplicate runs)
        $pivot = $entry->platforms()
            ->where('platform_id', $this->tiktokPlatformId)
            ->first()
            ?->pivot;

        if (! $pivot || $pivot->publish_status !== 'pending') {
            return;
        }

        try {
            // Upload video chunks to TikTok
            $postingService->uploadChunks($this->uploadUrl, $entry->video_url);

            // Mark as processing while TikTok processes the video
            $entry->platforms()->updateExistingPivot($this->tiktokPlatformId, [
                'publish_status' => 'processing',
            ]);

            // Poll for publish completion (up to ~2 minutes)
            $videoId = $this->pollForCompletion($postingService, $account);

            if ($videoId === null) {
                $this->markFailed($entry, 'TikTok did not complete publishing within the timeout.');

                return;
            }

            $videoUrl = $postingService->buildVideoUrl($account->handle, $videoId);

            // Mark entry live — auto-transitions to 'live' and fires payout if pitch
            $entryService->markLive($entry->fresh(), [$this->tiktokPlatformId => $videoUrl]);

            // Update pivot with published status (markLive sets posted_url already)
            $entry->platforms()->updateExistingPivot($this->tiktokPlatformId, [
                'publish_status' => 'published',
            ]);
        } catch (Throwable $e) {
            Log::error('PublishToTikTokJob failed', [
                'entry_id' => $this->entryId,
                'error' => $e->getMessage(),
            ]);

            $this->markFailed($entry, $e->getMessage());
        }
    }

    /**
     * Poll TikTok's status endpoint until publishing is complete or we time out.
     * Returns the TikTok video ID on success, null on timeout/failure.
     */
    private function pollForCompletion(TikTokPostingService $postingService, SocialAccount $account): ?string
    {
        $maxAttempts = 24; // 24 × 5s = 2 minutes
        $delay = 5;

        for ($i = 0; $i < $maxAttempts; $i++) {
            $result = $postingService->fetchPublishStatus($account, $this->publishId);

            if ($result['status'] === 'PUBLISH_COMPLETE' && ! empty($result['video_id'])) {
                return (string) $result['video_id'];
            }

            if ($result['status'] === 'FAILED') {
                return null;
            }

            // PROCESSING_UPLOAD or PROCESSING_DOWNLOAD — keep waiting
            sleep($delay);
        }

        return null;
    }

    private function markFailed(Entry $entry, string $reason): void
    {
        $entry->platforms()->updateExistingPivot($this->tiktokPlatformId, [
            'publish_status' => 'failed',
        ]);

        Log::warning('TikTok post failed', [
            'entry_id' => $entry->id,
            'reason' => $reason,
        ]);
    }
}
