<?php

declare(strict_types=1);

namespace App\Services\Social\Providers;

use App\Models\SocialAccount;
use App\Services\Social\DataObjects\ConnectedAccount;
use App\Services\Social\DataObjects\TokenSet;
use App\Services\Social\Exceptions\PlatformConnectionException;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Http;

final class InstagramProvider extends AbstractOAuthProvider
{
    private const GRAPH_BASE = 'https://graph.instagram.com/v21.0';

    private const LONG_LIVED_TOKEN_URL = 'https://graph.instagram.com/access_token';

    private const OEMBED_URL = 'https://graph.facebook.com/v21.0/instagram_oembed';

    public function platformSlug(): string
    {
        return 'instagram';
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
     * Override token exchange to additionally swap the short-lived token for a long-lived one.
     */
    public function exchangeCodeForToken(string $code): TokenSet
    {
        if ($this->stubMode()) {
            return $this->stubTokenSet();
        }

        // Step 1: exchange code for short-lived token (form POST)
        $shortResponse = Http::asForm()->post($this->config['token_url'], [
            'client_id' => $this->config[$this->clientIdKey()],
            'client_secret' => $this->config[$this->clientSecretKey()],
            'grant_type' => 'authorization_code',
            'redirect_uri' => $this->redirectUri(),
            'code' => $code,
        ]);

        if ($shortResponse->failed()) {
            throw PlatformConnectionException::tokenExchangeFailed('instagram', $shortResponse->body());
        }

        $shortToken = (string) ($shortResponse->json('access_token') ?? '');

        if ($shortToken === '') {
            throw PlatformConnectionException::tokenExchangeFailed('instagram', 'Missing access_token in short-lived response.');
        }

        // Step 2: exchange short-lived token for long-lived token (60 days)
        $longResponse = Http::get(self::LONG_LIVED_TOKEN_URL, [
            'grant_type' => 'ig_exchange_token',
            'client_secret' => $this->config[$this->clientSecretKey()],
            'access_token' => $shortToken,
        ]);

        if ($longResponse->failed()) {
            // Fall back to short-lived token on failure
            return new TokenSet(
                accessToken: $shortToken,
                refreshToken: null,
                expiresAt: CarbonImmutable::now()->addHours(1),
            );
        }

        $longToken = (string) ($longResponse->json('access_token') ?? $shortToken);
        $expiresIn = (int) ($longResponse->json('expires_in') ?? 5184000);

        return new TokenSet(
            accessToken: $longToken,
            refreshToken: null,
            expiresAt: CarbonImmutable::now()->addSeconds($expiresIn),
        );
    }

    /**
     * Instagram long-lived tokens are refreshed via a GET, not a POST with refresh_token.
     */
    public function refreshAccessToken(SocialAccount $account): TokenSet
    {
        if ($this->stubMode()) {
            return $this->stubTokenSet();
        }

        $response = Http::get('https://graph.instagram.com/refresh_access_token', [
            'grant_type' => 'ig_refresh_token',
            'access_token' => $account->oauth_token,
        ]);

        if ($response->failed()) {
            throw PlatformConnectionException::refreshFailed('instagram', $response->body());
        }

        $token = (string) ($response->json('access_token') ?? '');
        $expiresIn = (int) ($response->json('expires_in') ?? 5184000);

        return new TokenSet(
            accessToken: $token !== '' ? $token : $account->oauth_token,
            refreshToken: null,
            expiresAt: CarbonImmutable::now()->addSeconds($expiresIn),
        );
    }

    public function fetchAccountProfile(TokenSet $tokens): ConnectedAccount
    {
        if ($this->stubMode()) {
            return new ConnectedAccount(
                platformUserId: 'ig_stub_'.substr(md5($tokens->accessToken), 0, 12),
                handle: 'instagram_creator_stub',
                followerCount: 18700,
                avgViews: 5200,
                engagementRate: 3.6,
                verified: false,
            );
        }

        $response = Http::get(self::GRAPH_BASE.'/me', [
            'fields' => 'id,username,followers_count,media_count',
            'access_token' => $tokens->accessToken,
        ]);

        if ($response->failed()) {
            throw PlatformConnectionException::tokenExchangeFailed('instagram', $response->body());
        }

        $data = $response->json() ?? [];

        return new ConnectedAccount(
            platformUserId: (string) ($data['id'] ?? ''),
            handle: (string) ($data['username'] ?? ''),
            followerCount: (int) ($data['followers_count'] ?? 0),
            avgViews: 0,
            engagementRate: 0.0,
            verified: false,
        );
    }

    public function fetchViewCount(SocialAccount $account, string $postedUrl): int
    {
        if ($this->stubMode()) {
            return random_int(500, 180000);
        }

        $mediaId = $this->resolveMediaId($postedUrl, $account->oauth_token);

        if ($mediaId === null) {
            return 0;
        }

        $response = Http::get(self::GRAPH_BASE.'/'.$mediaId.'/insights', [
            'metric' => 'plays,video_views',
            'access_token' => $account->oauth_token,
        ]);

        if ($response->failed()) {
            return 0;
        }

        $metrics = $response->json('data', []);
        $views = 0;

        foreach ($metrics as $metric) {
            if (in_array($metric['name'] ?? '', ['plays', 'video_views'], true)) {
                $views = max($views, (int) ($metric['values'][0]['value'] ?? 0));
            }
        }

        return $views;
    }

    public function fetchFollowerCount(SocialAccount $account): int
    {
        if ($this->stubMode()) {
            return $account->follower_count + random_int(0, 150);
        }

        $response = Http::get(self::GRAPH_BASE.'/me', [
            'fields' => 'followers_count',
            'access_token' => $account->oauth_token,
        ]);

        if ($response->failed()) {
            return $account->follower_count;
        }

        return (int) ($response->json('followers_count') ?? $account->follower_count);
    }

    private function resolveMediaId(string $url, string $accessToken): ?string
    {
        // Try to parse media ID from URL patterns like /p/{shortcode}/ or /reel/{shortcode}/
        if (preg_match('#instagram\.com/(?:p|reel|tv)/([A-Za-z0-9_-]+)#', $url, $m)) {
            $shortcode = $m[1];

            // Use oEmbed to get the media ID from the shortcode
            $response = Http::get(self::OEMBED_URL, [
                'url' => $url,
                'access_token' => $accessToken,
            ]);

            if ($response->ok()) {
                return (string) ($response->json('media_id') ?? '');
            }
        }

        return null;
    }
}
