<?php

declare(strict_types=1);

namespace App\Services\Social\Providers;

use App\Models\SocialAccount;
use App\Services\Social\DataObjects\ConnectedAccount;
use App\Services\Social\DataObjects\TokenSet;
use App\Services\Social\Exceptions\PlatformConnectionException;
use Illuminate\Support\Facades\Http;

final class YouTubeProvider extends AbstractOAuthProvider
{
    private const CHANNELS_URL = 'https://www.googleapis.com/youtube/v3/channels';

    private const VIDEOS_URL = 'https://www.googleapis.com/youtube/v3/videos';

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
                engagementRate: 2.9,
                verified: true,
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
            engagementRate: 0.0,
            verified: true,
        );
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
