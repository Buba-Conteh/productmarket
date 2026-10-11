<?php

declare(strict_types=1);

namespace App\Services\Creators;

use App\Models\CreatorProfile;
use App\Models\CreatorVideo;
use App\Models\Entry;
use Illuminate\Support\Collection;

/**
 * Builds the "featured creative" reel shown on directory cards and in the
 * quick-view / video browser popups. ProductMarket entry videos lead (they play
 * inline from our bucket), followed by the creator's best-performing synced
 * platform videos, which play through the platform's official embed.
 */
final readonly class FeaturedVideoService
{
    public const PER_CREATOR = 10;

    private const ENTRY_STATUSES = ['live', 'won', 'approved'];

    /**
     * Featured videos for a page of creators, keyed by creator profile id.
     * Two batched queries regardless of page size.
     *
     * @param  iterable<CreatorProfile>  $creators  with `user.socialAccounts.platform` loaded
     * @return array<string, list<array<string, mixed>>>
     */
    public function forCreators(iterable $creators): array
    {
        $creators = collect($creators);

        if ($creators->isEmpty()) {
            return [];
        }

        $entryVideos = $this->entryVideos($creators->pluck('id')->all());
        $platformVideos = $this->platformVideos($creators);

        return $creators
            ->mapWithKeys(fn (CreatorProfile $creator) => [
                $creator->id => $entryVideos->get($creator->id, collect())
                    ->concat($platformVideos->get($creator->id, collect()))
                    ->take(self::PER_CREATOR)
                    ->values()
                    ->all(),
            ])
            ->all();
    }

    /**
     * @param  string[]  $creatorIds
     * @return Collection<string, Collection<int, array<string, mixed>>>
     */
    private function entryVideos(array $creatorIds): Collection
    {
        return Entry::query()
            ->whereIn('creator_profile_id', $creatorIds)
            ->whereIn('status', self::ENTRY_STATUSES)
            ->whereNotNull('video_url')
            ->with(['campaign:id,title', 'platforms:id'])
            ->latest('live_at')
            ->get()
            ->groupBy('creator_profile_id')
            ->map(fn (Collection $entries) => $entries
                ->take(self::PER_CREATOR)
                ->map(fn (Entry $entry) => [
                    'id' => 'entry_'.$entry->id,
                    'source' => 'entry',
                    'platform' => null,
                    'title' => $entry->campaign?->title ?? $entry->caption,
                    'thumbnail_url' => null,
                    'video_url' => $entry->video_full_url,
                    'embed_url' => null,
                    'share_url' => null,
                    'view_count' => (int) $entry->platforms->sum(fn ($p) => $p->pivot->verified_view_count),
                    'like_count' => 0,
                    'comment_count' => 0,
                    'duration_sec' => $entry->video_duration_sec,
                ])
                ->values());
    }

    /**
     * @param  Collection<int, CreatorProfile>  $creators
     * @return Collection<string, Collection<int, array<string, mixed>>>
     */
    private function platformVideos(Collection $creators): Collection
    {
        // social_account_id → creator_profile_id, so synced videos can be
        // grouped back onto the creator without another join.
        $accountOwners = $creators
            ->flatMap(fn (CreatorProfile $creator) => $creator->user->socialAccounts
                ->mapWithKeys(fn ($account) => [$account->id => $creator->id]))
            ->all();

        if ($accountOwners === []) {
            return collect();
        }

        return CreatorVideo::query()
            ->whereIn('social_account_id', array_keys($accountOwners))
            ->with('platform:id,slug')
            ->orderByDesc('view_count')
            ->get()
            ->groupBy(fn (CreatorVideo $video) => $accountOwners[$video->social_account_id])
            ->map(fn (Collection $videos) => $videos
                ->take(self::PER_CREATOR)
                ->map(fn (CreatorVideo $video) => [
                    'id' => $video->id,
                    'source' => 'platform',
                    'platform' => $video->platform?->slug,
                    'title' => $video->title,
                    'thumbnail_url' => $video->thumbnail_url,
                    'video_url' => null,
                    'embed_url' => $this->embedUrl($video),
                    'share_url' => $video->share_url,
                    'view_count' => $video->view_count,
                    'like_count' => $video->like_count,
                    'comment_count' => $video->comment_count,
                    'duration_sec' => $video->duration_sec,
                ])
                ->values());
    }

    /**
     * The platform's official embeddable player, or null when the video can't
     * be embedded (stub-mode data, or a missing permalink).
     */
    private function embedUrl(CreatorVideo $video): ?string
    {
        $id = $video->platform_video_id;

        if ($id === null || $id === '' || str_contains($id, '_stub_')) {
            return null;
        }

        return match ($video->platform?->slug) {
            'tiktok' => "https://www.tiktok.com/embed/v2/{$id}",
            'youtube' => "https://www.youtube.com/embed/{$id}",
            'instagram' => $video->share_url
                ? rtrim($video->share_url, '/').'/embed'
                : null,
            default => null,
        };
    }
}
