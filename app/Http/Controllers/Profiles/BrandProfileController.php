<?php

declare(strict_types=1);

namespace App\Http\Controllers\Profiles;

use App\Models\BrandProfile;
use Inertia\Inertia;
use Inertia\Response;

final class BrandProfileController
{
    public function show(BrandProfile $brandProfile): Response
    {
        $brandProfile->load([
            'user:id,name,avatar',
            'industry:id,name',
        ]);

        $activeCampaigns = $brandProfile->campaigns()
            ->whereIn('status', ['active', 'closed'])
            ->with(['platforms:id,name,slug'])
            ->latest('published_at')
            ->get()
            ->map(fn ($c) => [
                'id' => $c->id,
                'title' => $c->title,
                'type' => $c->type,
                'status' => $c->status,
                'deadline' => $c->deadline?->toDateString(),
                'platforms' => $c->platforms->map(fn ($p) => ['name' => $p->name, 'slug' => $p->slug]),
            ]);

        $pastCampaigns = $brandProfile->campaigns()
            ->where('status', 'completed')
            ->latest('published_at')
            ->take(6)
            ->get()
            ->map(fn ($c) => [
                'id' => $c->id,
                'title' => $c->title,
                'type' => $c->type,
                'status' => $c->status,
            ]);

        $stats = [
            'total_campaigns' => $brandProfile->campaigns()->whereNotIn('status', ['draft', 'cancelled'])->count(),
            'active_campaigns' => $activeCampaigns->count(),
            'completed_campaigns' => $brandProfile->campaigns()->where('status', 'completed')->count(),
            'total_entries' => $brandProfile->campaigns()
                ->withCount('entries')
                ->get()
                ->sum('entries_count'),
        ];

        return Inertia::render('profiles/brand/show', [
            'brand' => [
                'id' => $brandProfile->id,
                'company_name' => $brandProfile->company_name,
                'logo' => $brandProfile->logo,
                'website' => $brandProfile->website,
                'description' => $brandProfile->description,
                'industry' => $brandProfile->industry?->name,
                'user' => [
                    'avatar' => $brandProfile->user->avatar,
                ],
            ],
            'active_campaigns' => $activeCampaigns,
            'past_campaigns' => $pastCampaigns,
            'stats' => $stats,
        ]);
    }
}
