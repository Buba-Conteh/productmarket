<?php

declare(strict_types=1);

namespace App\Http\Controllers\Brand;

use App\Models\CreatorProfile;
use App\Models\Niche;
use App\Models\Platform;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class CreatorSearchController
{
    public function index(Request $request): Response
    {
        $filters = $request->only(['search', 'niche_id', 'platform_id', 'country', 'min_followers', 'max_followers', 'sort']);

        $query = CreatorProfile::query()
            ->with([
                'user:id,name,avatar,country',
                'niches:id,name,slug',
                'user.socialAccounts.platform:id,name,slug',
            ])
            ->whereHas('user', fn ($q) => $q->where('status', 'active'));

        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('display_name', 'like', "%{$search}%")
                    ->orWhere('bio', 'like', "%{$search}%")
                    ->orWhereHas('user', fn ($u) => $u->where('name', 'like', "%{$search}%"));
            });
        }

        if (! empty($filters['niche_id'])) {
            $query->whereHas('niches', fn ($q) => $q->where('niches.id', $filters['niche_id']));
        }

        if (! empty($filters['platform_id'])) {
            $query->whereHas('user.socialAccounts', fn ($q) => $q
                ->where('platform_id', $filters['platform_id'])
                ->where('verified', true)
            );
        }

        if (! empty($filters['country'])) {
            $query->whereHas('user', fn ($q) => $q->where('country', $filters['country']));
        }

        if (! empty($filters['min_followers'])) {
            $query->whereHas('user.socialAccounts', fn ($q) => $q->where('follower_count', '>=', (int) $filters['min_followers']));
        }

        if (! empty($filters['max_followers'])) {
            $query->whereHas('user.socialAccounts', fn ($q) => $q->where('follower_count', '<=', (int) $filters['max_followers']));
        }

        $query->orderBy('total_earned', 'desc');

        $creators = $query->paginate(18)->withQueryString();

        $creators->through(fn ($creator) => [
            'id' => $creator->id,
            'display_name' => $creator->display_name,
            'bio' => $creator->bio,
            'total_earned' => $creator->total_earned,
            'user' => [
                'name' => $creator->user->name,
                'avatar' => $creator->user->avatar,
                'country' => $creator->user->country,
            ],
            'niches' => $creator->niches->map(fn ($n) => ['id' => $n->id, 'name' => $n->name]),
            'social_accounts' => $creator->user->socialAccounts
                ->where('verified', true)
                ->map(fn ($a) => [
                    'platform' => ['name' => $a->platform->name, 'slug' => $a->platform->slug],
                    'handle' => $a->handle,
                    'follower_count' => $a->follower_count,
                    'engagement_rate' => $a->engagement_rate,
                ]),
        ]);

        return Inertia::render('brand/creators/index', [
            'creators' => $creators,
            'filters' => $filters,
            'niches' => Niche::where('is_active', true)->orderBy('sort_order')->get(['id', 'name']),
            'platforms' => Platform::where('is_active', true)->orderBy('sort_order')->get(['id', 'name', 'slug']),
        ]);
    }
}
