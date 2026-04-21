<?php

declare(strict_types=1);

namespace App\Services\Social\Providers;

use App\Models\SocialAccount;
use App\Services\Social\DataObjects\ConnectedAccount;
use App\Services\Social\DataObjects\TokenSet;
use App\Services\Social\Exceptions\PlatformConnectionException;
use Illuminate\Support\Facades\Http;

final class TikTokProvider extends AbstractOAuthProvider
{
    private const USER_INFO_URL = 'https://open.tiktokapis.com/v2/user/info/';

    private const VIDEO_LIST_URL = 'https://open.tiktokapis.com/v2/video/list/';

    public function platformSlug(): string
    {
        return 'tiktok';
    }

    protected function clientIdKey(): string
    {
        return 'client_key';
    }

    protected function clientSecretKey(): string
    {
        return 'client_secret';
    }

    public function fetchAccountProfile(TokenSet $tokens): ConnectedAccount
    {
        if ($this->stubMode()) {
            return new ConnectedAccount(
                platformUserId: 'tt_stub_'.substr(md5($tokens->accessToken), 0, 12),
                handle: 'tiktok_creator_stub',
                followerCount: 12500,
                avgViews: 8400,
                engagementRate: 4.2,
                verified: true,
            );
        }

        $response = Http::withToken($tokens->accessToken)
            ->get(self::USER_INFO_URL, [
                'fields' => 'open_id,union_id,display_name,follower_count,likes_count,video_count',
            ]);

        if ($response->failed()) {
            throw PlatformConnectionException::tokenExchangeFailed('tiktok', $response->body());
        }

        $data = $response->json('data.user', []);

        return new ConnectedAccount(
            platformUserId: (string) ($data['open_id'] ?? ''),
            handle: (string) ($data['display_name'] ?? ''),
            followerCount: (int) ($data['follower_count'] ?? 0),
            avgViews: 0,
            engagementRate: 0.0,
            verified: true,
        );
    }

    public function fetchViewCount(SocialAccount $account, string $postedUrl): int
    {
        if ($this->stubMode()) {
            return random_int(1000, 250000);
        }

        $videoId = $this->extractVideoId($postedUrl);

        if ($videoId === null) {
            return 0;
        }

        $response = Http::withToken($account->oauth_token)
            ->post(self::VIDEO_LIST_URL.'?fields=id,view_count', [
                'filters' => ['video_ids' => [$videoId]],
                'max_count' => 1,
            ]);

        if ($response->failed()) {
            return 0;
        }

        $videos = $response->json('data.videos', []);

        return (int) ($videos[0]['view_count'] ?? 0);
    }

    public function fetchFollowerCount(SocialAccount $account): int
    {
        if ($this->stubMode()) {
            return $account->follower_count + random_int(0, 250);
        }

        $response = Http::withToken($account->oauth_token)
            ->get(self::USER_INFO_URL, ['fields' => 'follower_count']);

        if ($response->failed()) {
            return $account->follower_count;
        }

        return (int) ($response->json('data.user.follower_count') ?? $account->follower_count);
    }

    private function extractVideoId(string $url): ?string
    {
        // https://www.tiktok.com/@handle/video/1234567890
        if (preg_match('#/video/(\d+)#', $url, $m)) {
            return $m[1];
        }

        return null;
    }
}
