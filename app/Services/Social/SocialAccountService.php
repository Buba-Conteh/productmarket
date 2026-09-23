<?php

declare(strict_types=1);

namespace App\Services\Social;

use App\Models\CreatorVideo;
use App\Models\Platform;
use App\Models\SocialAccount;
use App\Models\User;
use App\Services\Social\DataObjects\TokenSet;
use App\Services\Social\Exceptions\PlatformConnectionException;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Throwable;

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

        $grantedScopes = (array) config("social_oauth.{$platformSlug}.scopes", []);

        return DB::transaction(function () use ($user, $platform, $tokens, $profile, $grantedScopes) {
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
                    'total_likes' => $profile->totalLikes,
                    'post_count' => $profile->postCount,
                    'engagement_rate' => $profile->engagementRate,
                    'avatar_url' => $profile->avatarUrl,
                    'verified' => $profile->verified,
                    'scopes' => $grantedScopes,
                    'last_synced_at' => now(),
                ],
            );
        });
    }

    public function findForUser(User $user, string $platformSlug): ?SocialAccount
    {
        return SocialAccount::query()
            ->where('user_id', $user->id)
            ->whereHas('platform', fn ($query) => $query->where('slug', $platformSlug))
            ->first();
    }

    /**
     * Re-query the platform for an already-connected account and persist the
     * fresh metrics. Returns false when the platform could not be reached.
     */
    public function syncStats(SocialAccount $account): bool
    {
        $platform = $account->platform()->firstOrFail();
        $provider = $this->factory->make($platform->slug);

        $this->refreshIfNeeded($account);

        try {
            $profile = $provider->fetchAccountProfile(new TokenSet(
                accessToken: (string) $account->oauth_token,
                refreshToken: $account->oauth_refresh_token,
                expiresAt: $account->token_expires_at
                    ? CarbonImmutable::parse($account->token_expires_at)
                    : null,
            ));
        } catch (PlatformConnectionException|Throwable $e) {
            Log::warning('social_account_stats_sync_failed', [
                'social_account_id' => $account->id,
                'platform' => $platform->slug,
                'message' => $e->getMessage(),
            ]);

            return false;
        }

        $account->update([
            'handle' => $profile->handle !== '' ? $profile->handle : $account->handle,
            'follower_count' => $profile->followerCount,
            'avg_views' => $this->preferFresh($profile->avgViews, $account->avg_views),
            'total_likes' => $this->preferFresh($profile->totalLikes, $account->total_likes),
            'post_count' => $this->preferFresh($profile->postCount, $account->post_count),
            'engagement_rate' => $this->preferFresh(
                $profile->engagementRate,
                $account->engagement_rate !== null ? (float) $account->engagement_rate : null,
            ),
            'avatar_url' => $profile->avatarUrl ?? $account->avatar_url,
            'verified' => $profile->verified,
            'last_synced_at' => now(),
        ]);

        return true;
    }

    /**
     * Pull the account's recent videos into `creator_videos`.
     *
     * Existing rows are updated in place so a video keeps its id across syncs,
     * and videos the creator has since deleted on the platform are removed.
     * Returns the number of videos now stored, or null when the platform could
     * not be reached (the previous set is then left untouched).
     */
    public function syncVideos(SocialAccount $account, int $limit = 12): ?int
    {
        $platform = $account->platform()->firstOrFail();
        $provider = $this->factory->make($platform->slug);

        $this->refreshIfNeeded($account);

        try {
            $videos = $provider->fetchRecentVideos($account, $limit);
        } catch (PlatformConnectionException|Throwable $e) {
            Log::warning('social_account_video_sync_failed', [
                'social_account_id' => $account->id,
                'platform' => $platform->slug,
                'message' => $e->getMessage(),
            ]);

            return null;
        }

        return DB::transaction(function () use ($account, $platform, $videos): int {
            $seen = [];

            foreach ($videos as $video) {
                if ($video->platformVideoId === '') {
                    continue;
                }

                CreatorVideo::updateOrCreate(
                    [
                        'social_account_id' => $account->id,
                        'platform_video_id' => $video->platformVideoId,
                    ],
                    [
                        'platform_id' => $platform->id,
                        'title' => $video->title !== null ? Str::limit($video->title, 480) : null,
                        'thumbnail_url' => $video->thumbnailUrl,
                        'share_url' => $video->shareUrl,
                        'view_count' => $video->viewCount,
                        'like_count' => $video->likeCount,
                        'comment_count' => $video->commentCount,
                        'duration_sec' => $video->durationSec,
                        'posted_at' => $video->postedAt,
                        'synced_at' => now(),
                    ],
                );

                $seen[] = $video->platformVideoId;
            }

            CreatorVideo::where('social_account_id', $account->id)
                ->when($seen !== [], fn ($q) => $q->whereNotIn('platform_video_id', $seen))
                ->delete();

            return count($seen);
        });
    }

    /**
     * The live profile endpoints return 0 for metrics they do not expose
     * (avg views, engagement rate). Keep the last known value in that case
     * rather than blanking a number the creator already sees on their profile.
     */
    private function preferFresh(int|float|null $fresh, int|float|null $current): int|float|null
    {
        return ($fresh === null || (float) $fresh === 0.0) ? $current : $fresh;
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
