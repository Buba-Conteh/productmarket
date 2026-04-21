<?php

declare(strict_types=1);

namespace App\Services\Social;

use App\Models\Platform;
use App\Models\SocialAccount;
use App\Models\User;
use App\Services\Social\DataObjects\TokenSet;
use App\Services\Social\Exceptions\PlatformConnectionException;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

final class SocialAccountService
{
    public function __construct(
        private readonly PlatformProviderFactory $factory,
    ) {}

    public function buildAuthorizationUrl(string $platformSlug, string $state): string
    {
        return $this->factory->make($platformSlug)->getAuthorizationUrl($state);
    }

    public function connect(User $user, string $platformSlug, string $code): SocialAccount
    {
        $platform = Platform::where('slug', $platformSlug)->firstOrFail();
        $provider = $this->factory->make($platformSlug);

        $tokens = $provider->exchangeCodeForToken($code);
        $profile = $provider->fetchAccountProfile($tokens);

        return DB::transaction(function () use ($user, $platform, $tokens, $profile) {
            return SocialAccount::updateOrCreate(
                ['user_id' => $user->id, 'platform_id' => $platform->id],
                [
                    'handle' => $profile->handle,
                    'platform_user_id' => $profile->platformUserId,
                    'oauth_token' => $tokens->accessToken,
                    'oauth_refresh_token' => $tokens->refreshToken,
                    'token_expires_at' => $tokens->expiresAt,
                    'follower_count' => $profile->followerCount,
                    'avg_views' => $profile->avgViews,
                    'engagement_rate' => $profile->engagementRate,
                    'verified' => $profile->verified,
                    'last_synced_at' => now(),
                ],
            );
        });
    }

    public function disconnect(User $user, string $platformSlug): void
    {
        $platform = Platform::where('slug', $platformSlug)->firstOrFail();

        SocialAccount::where('user_id', $user->id)
            ->where('platform_id', $platform->id)
            ->delete();
    }

    /**
     * Refresh the access token for an account if it's expired or near expiry.
     * Returns true if a refresh was performed.
     */
    public function refreshIfNeeded(SocialAccount $account): bool
    {
        if (! $this->needsRefresh($account)) {
            return false;
        }

        $platform = $account->platform()->firstOrFail();
        $provider = $this->factory->make($platform->slug);

        try {
            $tokens = $provider->refreshAccessToken($account);
        } catch (PlatformConnectionException) {
            return false;
        }

        $this->applyTokens($account, $tokens);

        return true;
    }

    public function needsRefresh(SocialAccount $account): bool
    {
        if ($account->token_expires_at === null) {
            return false;
        }

        $bufferMinutes = (int) config('social_oauth.sync.token_refresh_buffer_minutes', 60);

        return CarbonImmutable::now()->addMinutes($bufferMinutes)->greaterThanOrEqualTo(
            CarbonImmutable::parse($account->token_expires_at),
        );
    }

    private function applyTokens(SocialAccount $account, TokenSet $tokens): void
    {
        $account->update([
            'oauth_token' => $tokens->accessToken,
            'oauth_refresh_token' => $tokens->refreshToken ?? $account->oauth_refresh_token,
            'token_expires_at' => $tokens->expiresAt,
        ]);
    }
}
