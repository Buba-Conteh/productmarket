<?php

declare(strict_types=1);

namespace App\Http\Controllers\Profiles;

use App\Models\CreatorProfile;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

final class CreatorProfileController
{
    public function show(CreatorProfile $creatorProfile): Response
    {
        $creatorProfile->load([
            'user:id,name,avatar,country',
            'niches:id,name,slug',
            'user.socialAccounts.platform:id,name,slug',
            'user.socialAccounts.videos' => fn ($q) => $q->orderByDesc('posted_at')->limit(12),
        ]);

        $liveEntries = $creatorProfile->entries()
            ->where('status', 'live')
            ->with([
                'campaign:id,title,type',
                'contentType:id,name',
                'platforms:id,name,slug',
            ])
            ->latest('live_at')
            ->get()
            ->map(fn ($entry) => [
                'id' => $entry->id,
                'campaign_title' => $entry->campaign?->title,
                'campaign_type' => $entry->campaign?->type,
                'content_type' => $entry->contentType?->name,
                'caption' => $entry->caption,
                'platforms' => $entry->platforms->map(fn ($p) => [
                    'id' => $p->id,
                    'name' => $p->name,
                    'slug' => $p->slug,
                    'posted_url' => $p->pivot->posted_url,
                    'verified_view_count' => $p->pivot->verified_view_count,
                ]),
                'live_at' => $entry->live_at?->toDateString(),
            ]);

        $totalViews = DB::table('entry_platforms')
            ->join('entries', 'entries.id', '=', 'entry_platforms.entry_id')
            ->where('entries.creator_profile_id', $creatorProfile->id)
            ->where('entries.status', 'live')
            ->sum('entry_platforms.verified_view_count');

        // Every connected account is listed. `verified` only records whether the
        // platform's API confirmed the account (Instagram Basic Display never
        // does), so filtering on it would hide accounts the creator did connect.
        $socialAccounts = $creatorProfile->user->socialAccounts
            ->map(fn ($account) => [
                'id' => $account->id,
                'platform' => [
                    'id' => $account->platform->id,
                    'name' => $account->platform->name,
                    'slug' => $account->platform->slug,
                ],
                'handle' => $account->handle,
                'follower_count' => $account->follower_count,
                'avg_views' => $account->avg_views,
                'total_likes' => $account->total_likes,
                'post_count' => $account->post_count,
                'engagement_rate' => $account->engagement_rate,
                'verified' => $account->verified,
                'last_synced_at' => $account->last_synced_at?->diffForHumans(),
            ])
            ->values();

        // One rail per connected platform, newest first. Accounts with nothing
        // synced yet are dropped so the profile doesn't show an empty rail.
        $videoRails = $creatorProfile->user->socialAccounts
            ->map(fn ($account) => [
                'platform' => [
                    'name' => $account->platform->name,
                    'slug' => $account->platform->slug,
                ],
                'handle' => $account->handle,
                'videos' => $account->videos
                    ->sortByDesc('posted_at')
                    ->map(fn ($video) => [
                        'id' => $video->id,
                        'title' => $video->title,
                        'thumbnail_url' => $video->thumbnail_url,
                        'share_url' => $video->share_url,
                        'view_count' => $video->view_count,
                        'like_count' => $video->like_count,
                        'comment_count' => $video->comment_count,
                        'duration_sec' => $video->duration_sec,
                        'posted_at' => $video->posted_at?->toDateString(),
                    ])
                    ->values(),
            ])
            ->filter(fn (array $rail) => $rail['videos']->isNotEmpty())
            ->values();

        // Videos produced through ProductMarket itself — entry uploads that
        // live in our own bucket, so they play inline rather than linking out.
        $platformVideos = $creatorProfile->entries()
            ->whereIn('status', ['live', 'won', 'approved'])
            ->whereNotNull('video_url')
            ->with(['campaign:id,title,type', 'platforms:id,name,slug'])
            ->latest('live_at')
            ->take(12)
            ->get()
            ->map(fn ($entry) => [
                'id' => $entry->id,
                'campaign_title' => $entry->campaign?->title,
                'campaign_type' => $entry->campaign?->type,
                'caption' => $entry->caption,
                'video_url' => $entry->video_full_url,
                'duration_sec' => $entry->video_duration_sec,
                'view_count' => (int) $entry->platforms->sum(fn ($p) => $p->pivot->verified_view_count),
                'posted_at' => $entry->live_at?->toDateString(),
            ])
            ->values();

        return Inertia::render('profiles/creator/show', [
            'creator' => [
                'id' => $creatorProfile->id,
                'display_name' => $creatorProfile->display_name,
                'bio' => $creatorProfile->bio,
                'total_earned' => $creatorProfile->total_earned,
                'user' => [
                    'name' => $creatorProfile->user->name,
                    'avatar' => $creatorProfile->user->avatar_url,
                    'country' => $creatorProfile->user->country,
                ],
                'niches' => $creatorProfile->niches->map(fn ($n) => [
                    'id' => $n->id,
                    'name' => $n->name,
                    'slug' => $n->slug,
                ]),
                'social_accounts' => $socialAccounts,
                'entries_count' => $liveEntries->count(),
                'total_views' => (int) $totalViews,
            ],
            'entries' => $liveEntries,
            'videoRails' => $videoRails,
            'platformVideos' => $platformVideos,
        ]);
    }

    public function mediaKit(CreatorProfile $creatorProfile): Response
    {
        $creatorProfile->load([
            'user:id,name,avatar,country',
            'niches:id,name,slug',
            'user.socialAccounts.platform:id,name,slug',
        ]);

        $liveEntries = $creatorProfile->entries()
            ->where('status', 'live')
            ->with(['campaign:id,title,type', 'platforms:id,name,slug'])
            ->latest('live_at')
            ->take(6)
            ->get()
            ->map(fn ($entry) => [
                'id' => $entry->id,
                'campaign_title' => $entry->campaign?->title,
                'campaign_type' => $entry->campaign?->type,
                'caption' => $entry->caption,
                'platforms' => $entry->platforms->map(fn ($p) => [
                    'name' => $p->name,
                    'posted_url' => $p->pivot->posted_url,
                    'verified_view_count' => $p->pivot->verified_view_count,
                ]),
                'live_at' => $entry->live_at?->toDateString(),
            ]);

        $totalViews = DB::table('entry_platforms')
            ->join('entries', 'entries.id', '=', 'entry_platforms.entry_id')
            ->where('entries.creator_profile_id', $creatorProfile->id)
            ->where('entries.status', 'live')
            ->sum('entry_platforms.verified_view_count');

        $socialAccounts = $creatorProfile->user->socialAccounts
            ->map(fn ($account) => [
                'platform' => [
                    'name' => $account->platform->name,
                    'slug' => $account->platform->slug,
                ],
                'handle' => $account->handle,
                'follower_count' => $account->follower_count,
                'avg_views' => $account->avg_views,
                'total_likes' => $account->total_likes,
                'post_count' => $account->post_count,
                'engagement_rate' => $account->engagement_rate,
                'verified' => $account->verified,
            ])
            ->values();

        return Inertia::render('profiles/creator/media-kit', [
            'creator' => [
                'id' => $creatorProfile->id,
                'display_name' => $creatorProfile->display_name,
                'bio' => $creatorProfile->bio,
                'user' => [
                    'name' => $creatorProfile->user->name,
                    'avatar' => $creatorProfile->user->avatar,
                    'country' => $creatorProfile->user->country,
                ],
                'niches' => $creatorProfile->niches->map(fn ($n) => ['name' => $n->name]),
                'social_accounts' => $socialAccounts,
                'entries_count' => $liveEntries->count(),
                'total_views' => (int) $totalViews,
                'total_earned' => $creatorProfile->total_earned,
            ],
            'entries' => $liveEntries,
        ]);
    }
}
