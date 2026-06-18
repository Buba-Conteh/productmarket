<?php

declare(strict_types=1);

namespace App\Services\Social;

use App\Models\Entry;
use App\Models\SocialAccount;
use App\Support\FileUploader;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

final readonly class TikTokPostingService
{
    private const PUBLISH_INIT_URL = 'https://open.tiktokapis.com/v2/post/publish/video/init/';

    private const PUBLISH_STATUS_URL = 'https://open.tiktokapis.com/v2/post/publish/status/fetch/';

    private const CHUNK_SIZE = 10 * 1024 * 1024; // 10 MB

    public function __construct(
        private readonly SocialAccountService $socialAccountService,
    ) {}

    /**
     * Initialize a Direct Post upload with TikTok.
     * Returns ['publish_id' => ..., 'upload_url' => ...].
     */
    public function initializeUpload(
        SocialAccount $account,
        Entry $entry,
        array $postData,
    ): array {
        if ($this->stubMode()) {
            return [
                'publish_id' => 'stub_publish_'.substr(md5($entry->id), 0, 16),
                'upload_url' => 'https://stub-upload.tiktok.local/upload',
            ];
        }

        $this->socialAccountService->refreshIfNeeded($account);

        $disk = Storage::disk(FileUploader::disk());

        if (! $disk->exists($entry->video_url)) {
            throw new RuntimeException('Video file not found: '.$entry->video_url);
        }

        $videoSize = $disk->size($entry->video_url);

        if ($videoSize === 0) {
            throw new RuntimeException('Video file is empty: '.$entry->video_url);
        }

        $chunkCount = (int) ceil($videoSize / self::CHUNK_SIZE);

        $response = Http::withToken($account->oauth_token)
            ->post(self::PUBLISH_INIT_URL, [
                'post_info' => [
                    'title' => mb_substr((string) $postData['caption'], 0, 2200),
                    'privacy_level' => $postData['privacy_level'] ?? 'PUBLIC_TO_EVERYONE',
                    'disable_duet' => (bool) ($postData['disable_duet'] ?? false),
                    'disable_comment' => (bool) ($postData['disable_comment'] ?? false),
                    'disable_stitch' => (bool) ($postData['disable_stitch'] ?? false),
                ],
                'source_info' => [
                    'source' => 'FILE_UPLOAD',
                    'video_size' => $videoSize,
                    'chunk_size' => min(self::CHUNK_SIZE, $videoSize),
                    'total_chunk_count' => $chunkCount,
                ],
            ]);

        if ($response->failed()) {
            throw new RuntimeException('TikTok publish init failed: '.$response->body());
        }

        $data = $response->json('data', []);

        return [
            'publish_id' => (string) ($data['publish_id'] ?? ''),
            'upload_url' => (string) ($data['upload_url'] ?? ''),
        ];
    }

    /**
     * Upload the video file to TikTok in chunks.
     */
    public function uploadChunks(string $uploadUrl, string $videoStoragePath): void
    {
        if ($this->stubMode()) {
            return;
        }

        [$fullPath, $isTemp] = $this->localCopy($videoStoragePath);
        $totalSize = filesize($fullPath);

        if ($totalSize === false || $totalSize === 0) {
            if ($isTemp) {
                @unlink($fullPath);
            }

            throw new RuntimeException('Video file not found: '.$videoStoragePath);
        }

        $handle = fopen($fullPath, 'rb');

        if ($handle === false) {
            if ($isTemp) {
                @unlink($fullPath);
            }

            throw new RuntimeException('Cannot open video file: '.$videoStoragePath);
        }

        try {
            $offset = 0;
            $chunkNumber = 0;

            while (! feof($handle)) {
                $chunk = fread($handle, self::CHUNK_SIZE);

                if ($chunk === false) {
                    break;
                }

                $chunkSize = strlen($chunk);
                $end = $offset + $chunkSize - 1;

                $response = Http::withHeaders([
                    'Content-Range' => "bytes {$offset}-{$end}/{$totalSize}",
                    'Content-Type' => 'video/mp4',
                    'Content-Length' => (string) $chunkSize,
                ])->withBody($chunk, 'video/mp4')
                    ->put($uploadUrl);

                if ($response->failed()) {
                    throw new RuntimeException(
                        "TikTok chunk upload failed (chunk #{$chunkNumber}): ".$response->body()
                    );
                }

                $offset += $chunkSize;
                $chunkNumber++;
            }
        } finally {
            fclose($handle);

            if ($isTemp) {
                @unlink($fullPath);
            }
        }
    }

    /**
     * Resolve a storage path to a readable local file path.
     *
     * Local disks expose a real filesystem path directly. Remote disks
     * (the attached bucket in production) are streamed to a temporary file
     * so the chunked upload can read raw bytes.
     *
     * @return array{0: string, 1: bool} the local path and whether it is temporary
     */
    private function localCopy(string $storagePath): array
    {
        $disk = Storage::disk(FileUploader::disk());

        try {
            $path = $disk->path($storagePath);

            if (is_file($path)) {
                return [$path, false];
            }
        } catch (\Throwable) {
            // Remote disk — fall through and download to a temp file.
        }

        if (! $disk->exists($storagePath)) {
            throw new RuntimeException('Video file not found: '.$storagePath);
        }

        $tmp = tempnam(sys_get_temp_dir(), 'tiktok_video_');

        if ($tmp === false) {
            throw new RuntimeException('Unable to allocate a temporary file for video upload.');
        }

        $source = $disk->readStream($storagePath);
        $destination = fopen($tmp, 'wb');

        if ($source === null || $destination === false) {
            @unlink($tmp);

            throw new RuntimeException('Unable to stream video file: '.$storagePath);
        }

        try {
            stream_copy_to_stream($source, $destination);
        } finally {
            fclose($source);
            fclose($destination);
        }

        return [$tmp, true];
    }

    /**
     * Poll TikTok for the publish status of a given publish_id.
     * Returns ['status' => ..., 'video_id' => ...].
     * Possible statuses: PROCESSING_UPLOAD, PROCESSING_DOWNLOAD, PUBLISH_COMPLETE, FAILED.
     */
    public function fetchPublishStatus(SocialAccount $account, string $publishId): array
    {
        if ($this->stubMode()) {
            return [
                'status' => 'PUBLISH_COMPLETE',
                'video_id' => 'stub_video_'.substr(md5($publishId), 0, 12),
            ];
        }

        $this->socialAccountService->refreshIfNeeded($account);

        $response = Http::withToken($account->oauth_token)
            ->post(self::PUBLISH_STATUS_URL, [
                'publish_id' => $publishId,
            ]);

        if ($response->failed()) {
            Log::warning('TikTok publish status check failed', [
                'publish_id' => $publishId,
                'response' => $response->body(),
            ]);

            return ['status' => 'FAILED', 'video_id' => null];
        }

        $data = $response->json('data', []);
        $videoIds = $data['publicaly_available_post_id'] ?? [];

        return [
            'status' => (string) ($data['status'] ?? 'FAILED'),
            'video_id' => ! empty($videoIds) ? (string) $videoIds[0] : null,
        ];
    }

    /**
     * Build the public TikTok video URL from a video_id and creator handle.
     */
    public function buildVideoUrl(string $handle, string $videoId): string
    {
        $cleanHandle = ltrim($handle, '@');

        return "https://www.tiktok.com/@{$cleanHandle}/video/{$videoId}";
    }

    private function stubMode(): bool
    {
        return (bool) config('social_oauth.tiktok.posting_stub_mode', true);
    }
}
