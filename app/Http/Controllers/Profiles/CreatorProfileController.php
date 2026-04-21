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

        $socialAccounts = $creatorProfile->user->socialAccounts
            ->where('verified', true)
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
                'engagement_rate' => $account->engagement_rate,
            ]);

        return Inertia::render('profiles/creator/show', [
            'creator' => [
                'id' => $creatorProfile->id,
                'display_name' => $creatorProfile->display_name,
                'bio' => $creatorProfile->bio,
                'total_earned' => $creatorProfile->total_earned,
                'user' => [
                    'name' => $creatorProfile->user->name,
                    'avatar' => $creatorProfile->user->avatar,
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
            ->where('verified', true)
            ->map(fn ($account) => [
                'platform' => [
                    'name' => $account->platform->name,
                    'slug' => $account->platform->slug,
                ],
                'handle' => $account->handle,
                'follower_count' => $account->follower_count,
                'avg_views' => $account->avg_views,
                'engagement_rate' => $account->engagement_rate,
            ]);

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
