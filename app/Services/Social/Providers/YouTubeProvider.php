<?php

declare(strict_types=1);

namespace App\Services\Social\Providers;

use App\Models\SocialAccount;
use App\Services\Social\DataObjects\ConnectedAccount;
use App\Services\Social\DataObjects\PlatformVideo;
use App\Services\Social\DataObjects\TokenSet;
use App\Services\Social\Exceptions\PlatformConnectionException;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Http;

final class YouTubeProvider extends AbstractOAuthProvider
{
    private const CHANNELS_URL = 'https://www.googleapis.com/youtube/v3/channels';

    private const VIDEOS_URL = 'https://www.googleapis.com/youtube/v3/videos';

    private const PLAYLIST_ITEMS_URL = 'https://www.googleapis.com/youtube/v3/playlistItems';

    public function platformSlug(): string
    {
        return 'youtube';
    }

    protected function clientIdKey(): string
    {
        return 'client_id';
    }

    protected function clientSecretKey(): string
    {
        return 'client_secret';
    }

    /**
     * YouTube requires access_type=offline to receive a refresh token.
     * prompt=consent forces the consent screen every time, ensuring a refresh token is issued.
     *
     * @return array<string, string>
     */
    protected function extraAuthParams(): array
    {
        return [
            'access_type' => 'offline',
            'prompt' => 'consent',
        ];
    }

    public function fetchAccountProfile(TokenSet $tokens): ConnectedAccount
    {
        if ($this->stubMode()) {
            return new ConnectedAccount(
                platformUserId: 'yt_stub_'.substr(md5($tokens->accessToken), 0, 12),
                handle: 'youtube_creator_stub',
                followerCount: 47000,
                avgViews: 15600,
                totalLikes: null,
                postCount: 215,
                engagementRate: 2.9,
                verified: true,
                avatarUrl: 'https://placehold.co/200x200/FF0000/FFFFFF/png?text=YT',
            );
        }

        $response = Http::withToken($tokens->accessToken)
            ->get(self::CHANNELS_URL, [
                'part' => 'snippet,statistics',
                'mine' => 'true',
            ]);

        if ($response->failed()) {
            throw PlatformConnectionException::tokenExchangeFailed('youtube', $response->body());
        }

        $channel = $response->json('items.0') ?? [];
        $snippet = $channel['snippet'] ?? [];
        $stats = $channel['statistics'] ?? [];

        $handle = (string) ($snippet['customUrl'] ?? $channel['id'] ?? '');
        $subscribers = (int) ($stats['subscriberCount'] ?? 0);
        $viewCount = (int) ($stats['viewCount'] ?? 0);
        $videoCount = max(1, (int) ($stats['videoCount'] ?? 1));
        $avgViews = (int) round($viewCount / $videoCount);

        return new ConnectedAccount(
            platformUserId: (string) ($channel['id'] ?? ''),
            handle: ltrim($handle, '@'),
            followerCount: $subscribers,
            avgViews: $avgViews,
            totalLikes: null,
            postCount: (int) ($stats['videoCount'] ?? 0),
            engagementRate: 0.0,
            verified: true,
            avatarUrl: $snippet['thumbnails']['high']['url']
                ?? $snippet['thumbnails']['default']['url']
                ?? null,
        );
    }

    /**
     * Two hops: the channel's uploads playlist for the newest video ids, then a
     * single batched videos call for their stats and durations.
     *
     * @return PlatformVideo[]
     */
    public function fetchRecentVideos(SocialAccount $account, int $limit = 12): array
    {
        if ($this->stubMode()) {
            return $this->stubVideos($limit, 'youtube');
        }

        $channel = Http::withToken($account->oauth_token)
            ->get(self::CHANNELS_URL, ['part' => 'contentDetails', 'mine' => 'true']);

        if ($channel->failed()) {
            return [];
        }

        $uploadsPlaylist = $channel->json('items.0.contentDetails.relatedPlaylists.uploads');

        if (! is_string($uploadsPlaylist) || $uploadsPlaylist === '') {
            return [];
        }

        $playlist = Http::withToken($account->oauth_token)
            ->get(self::PLAYLIST_ITEMS_URL, [
                'part' => 'contentDetails',
                'playlistId' => $uploadsPlaylist,
                'maxResults' => min($limit, 50),
            ]);

        if ($playlist->failed()) {
            return [];
        }

        $videoIds = array_values(array_filter(array_map(
            fn (array $item) => $item['contentDetails']['videoId'] ?? null,
            $playlist->json('items', []),
        )));

        if ($videoIds === []) {
            return [];
        }

        $videos = Http::withToken($account->oauth_token)
            ->get(self::VIDEOS_URL, [
                'part' => 'snippet,statistics,contentDetails',
                'id' => implode(',', $videoIds),
            ]);

        if ($videos->failed()) {
            return [];
        }

        return array_map(function (array $v): PlatformVideo {
            $snippet = $v['snippet'] ?? [];
            $stats = $v['statistics'] ?? [];

            return new PlatformVideo(
                platformVideoId: (string) ($v['id'] ?? ''),
                title: $snippet['title'] ?? null,
                thumbnailUrl: $snippet['thumbnails']['high']['url']
                    ?? $snippet['thumbnails']['default']['url']
                    ?? null,
                shareUrl: isset($v['id']) ? 'https://www.youtube.com/watch?v='.$v['id'] : null,
                viewCount: (int) ($stats['viewCount'] ?? 0),
                likeCount: (int) ($stats['likeCount'] ?? 0),
                commentCount: (int) ($stats['commentCount'] ?? 0),
                durationSec: $this->parseIsoDuration($v['contentDetails']['duration'] ?? null),
                postedAt: isset($snippet['publishedAt'])
                    ? CarbonImmutable::parse($snippet['publishedAt'])
                    : null,
            );
        }, $videos->json('items', []));
    }

    /**
     * YouTube reports duration as an ISO-8601 period (e.g. PT1M35S).
     */
    private function parseIsoDuration(?string $duration): ?int
    {
        if ($duration === null || ! preg_match('/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/', $duration, $m)) {
            return null;
        }

        return ((int) ($m[1] ?? 0)) * 3600 + ((int) ($m[2] ?? 0)) * 60 + ((int) ($m[3] ?? 0));
    }

    public function fetchViewCount(SocialAccount $account, string $postedUrl): int
    {
        if ($this->stubMode()) {
            return random_int(2000, 500000);
        }

        $videoId = $this->extractVideoId($postedUrl);

        if ($videoId === null) {
            return 0;
        }

        $response = Http::withToken($account->oauth_token)
            ->get(self::VIDEOS_URL, [
                'part' => 'statistics',
                'id' => $videoId,
            ]);

        if ($response->failed()) {
            return 0;
        }

        return (int) ($response->json('items.0.statistics.viewCount') ?? 0);
    }

    public function fetchFollowerCount(SocialAccount $account): int
    {
        if ($this->stubMode()) {
            return $account->follower_count + random_int(0, 500);
        }

        $response = Http::withToken($account->oauth_token)
            ->get(self::CHANNELS_URL, [
                'part' => 'statistics',
                'mine' => 'true',
            ]);

        if ($response->failed()) {
            return $account->follower_count;
        }

        return (int) ($response->json('items.0.statistics.subscriberCount') ?? $account->follower_count);
    }

    private function extractVideoId(string $url): ?string
    {
        // https://www.youtube.com/watch?v=VIDEO_ID
        if (preg_match('#[?&]v=([A-Za-z0-9_-]{11})#', $url, $m)) {
            return $m[1];
        }

        // https://youtu.be/VIDEO_ID
        if (preg_match('#youtu\.be/([A-Za-z0-9_-]{11})#', $url, $m)) {
            return $m[1];
        }

        // https://www.youtube.com/shorts/VIDEO_ID
        if (preg_match('#/shorts/([A-Za-z0-9_-]{11})#', $url, $m)) {
            return $m[1];
        }

        return null;
    }
}
