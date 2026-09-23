<?php

declare(strict_types=1);

namespace App\Http\Controllers\Brand;

use App\Models\Campaign;
use App\Models\CampaignInvitation;
use App\Models\CreatorProfile;
use App\Models\Niche;
use App\Models\Platform;
use App\Models\SocialAccount;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The brand-side creator directory: aggregate social presence across every
 * connected platform, plus the campaign-invite entry point.
 */
final class CreatorSearchController
{
    private const SORTS = ['followers', 'earnings', 'views', 'engagement', 'newest'];

    public function index(Request $request): Response
    {
        $filters = array_filter(
            $request->only(['search', 'niche_id', 'platform_id', 'country', 'min_followers', 'max_followers', 'sort']),
            fn ($value) => $value !== null && $value !== ''
        );

        $sort = in_array($filters['sort'] ?? '', self::SORTS, true)
            ? $filters['sort']
            : 'followers';

        $query = CreatorProfile::query()
            ->with([
                'user:id,name,avatar,country',
                'niches:id,name,slug',
                'user.socialAccounts.platform:id,name,slug',
                'invitations:id,campaign_id,creator_profile_id,status',
            ])
            ->whereHas('user', fn ($q) => $q->where('status', 'active'))
            ->select('creator_profiles.*')
            ->addSelect([
                'total_followers' => $this->socialSumSub('follower_count'),
                'total_likes' => $this->socialSumSub('total_likes'),
                'total_posts' => $this->socialSumSub('post_count'),
            ]);

        $this->applyFilters($query, $filters);
        $this->applySort($query, $sort);

        $creators = $query->paginate(18)->withQueryString();

        // Verified comment counts only exist per-post on entry_platforms — no
        // provider exposes an account-level total under the current OAuth
        // scopes — so the directory reports comments earned on campaign content.
        $engagement = $this->engagementTotals(
            collect($creators->items())->pluck('id')->all()
        );

        $creators->through(fn (CreatorProfile $creator) => $this->present($creator, $engagement));

        return Inertia::render('brand/creators/index', [
            'creators' => $creators,
            'filters' => $filters + ['sort' => $sort],
            'niches' => Niche::where('is_active', true)->orderBy('sort_order')->get(['id', 'name']),
            'platforms' => Platform::where('is_active', true)->orderBy('sort_order')->get(['id', 'name', 'slug']),
            'invitableCampaigns' => $this->invitableCampaigns($request),
        ]);
    }

    /**
     * Correlated sum of one social_accounts metric for the creator's user.
     */
    private function socialSumSub(string $column): Builder
    {
        return SocialAccount::query()
            ->selectRaw("coalesce(sum({$column}), 0)")
            ->whereColumn('social_accounts.user_id', 'creator_profiles.user_id');
    }

    /**
     * @param  array<string, string>  $filters
     */
    private function applyFilters(Builder $query, array $filters): void
    {
        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search): void {
                $q->where('display_name', 'like', "%{$search}%")
                    ->orWhere('bio', 'like', "%{$search}%")
                    ->orWhereHas('user', fn ($u) => $u->where('name', 'like', "%{$search}%"));
            });
        }

        if (! empty($filters['niche_id'])) {
            $query->whereHas('niches', fn ($q) => $q->where('niches.id', $filters['niche_id']));
        }

        if (! empty($filters['platform_id'])) {
            $query->whereHas('user.socialAccounts', fn ($q) => $q->where('platform_id', $filters['platform_id']));
        }

        if (! empty($filters['country'])) {
            $query->whereHas('user', fn ($q) => $q->where('country', $filters['country']));
        }

        // Follower bounds match the creator's combined audience rather than a
        // single account — a brand budgeting reach cares about the total.
        $followersSql = '('.$this->socialSumSub('follower_count')->toSql().')';

        if (! empty($filters['min_followers'])) {
            $query->whereRaw("{$followersSql} >= ?", [(int) $filters['min_followers']]);
        }

        if (! empty($filters['max_followers'])) {
            $query->whereRaw("{$followersSql} <= ?", [(int) $filters['max_followers']]);
        }
    }

    private function applySort(Builder $query, string $sort): void
    {
        match ($sort) {
            'earnings' => $query->orderByDesc('total_earned'),
            'views' => $query->orderByDesc(
                DB::table('entry_platforms')
                    ->join('entries', 'entries.id', '=', 'entry_platforms.entry_id')
                    ->selectRaw('coalesce(sum(entry_platforms.verified_view_count), 0)')
                    ->whereColumn('entries.creator_profile_id', 'creator_profiles.id')
            ),
            'engagement' => $query->orderByDesc(
                SocialAccount::query()
                    ->selectRaw('coalesce(max(engagement_rate), 0)')
                    ->whereColumn('social_accounts.user_id', 'creator_profiles.user_id')
            ),
            'newest' => $query->orderByDesc('creator_profiles.created_at'),
            default => $query->orderByDesc('total_followers'),
        };
    }

    /**
     * Verified views and comments earned on campaign content, per creator.
     *
     * @param  string[]  $creatorIds
     * @return array<string, array{views: int, comments: int, live_entries: int}>
     */
    private function engagementTotals(array $creatorIds): array
    {
        if ($creatorIds === []) {
            return [];
        }

        return DB::table('entry_platforms')
            ->join('entries', 'entries.id', '=', 'entry_platforms.entry_id')
            ->whereIn('entries.creator_profile_id', $creatorIds)
            ->groupBy('entries.creator_profile_id')
            ->selectRaw('entries.creator_profile_id as creator_id')
            ->selectRaw('coalesce(sum(entry_platforms.verified_view_count), 0) as views')
            ->selectRaw('coalesce(sum(entry_platforms.comment_count), 0) as comments')
            ->selectRaw('count(distinct entries.id) as live_entries')
            ->get()
            ->mapWithKeys(fn ($row) => [$row->creator_id => [
                'views' => (int) $row->views,
                'comments' => (int) $row->comments,
                'live_entries' => (int) $row->live_entries,
            ]])
            ->all();
    }

    /**
     * @param  array<string, array{views: int, comments: int, live_entries: int}>  $engagement
     * @return array<string, mixed>
     */
    private function present(CreatorProfile $creator, array $engagement): array
    {
        $totals = $engagement[$creator->id] ?? ['views' => 0, 'comments' => 0, 'live_entries' => 0];
        $accounts = $creator->user->socialAccounts;

        $engagementRates = $accounts
            ->pluck('engagement_rate')
            ->filter(fn ($rate) => $rate !== null && (float) $rate > 0);

        return [
            'id' => $creator->id,
            'display_name' => $creator->display_name,
            'bio' => $creator->bio,
            'total_earned' => $creator->total_earned,
            'user' => [
                'name' => $creator->user->name,
                'avatar' => $creator->user->avatar_url,
                'country' => $creator->user->country,
            ],
            'niches' => $creator->niches->map(fn ($n) => ['id' => $n->id, 'name' => $n->name])->values(),
            'totals' => [
                'followers' => (int) ($creator->total_followers ?? 0),
                'likes' => (int) ($creator->total_likes ?? 0),
                'posts' => (int) ($creator->total_posts ?? 0),
                'views' => $totals['views'],
                'comments' => $totals['comments'],
                'live_entries' => $totals['live_entries'],
                'platform_count' => $accounts->count(),
                'engagement_rate' => $engagementRates->isEmpty()
                    ? null
                    : round((float) $engagementRates->avg(), 2),
            ],
            'social_accounts' => $accounts
                ->map(fn (SocialAccount $a) => [
                    'platform' => ['name' => $a->platform->name, 'slug' => $a->platform->slug],
                    'handle' => $a->handle,
                    'follower_count' => (int) $a->follower_count,
                    'avg_views' => $a->avg_views,
                    'total_likes' => $a->total_likes,
                    'post_count' => $a->post_count,
                    'engagement_rate' => $a->engagement_rate,
                    'verified' => (bool) $a->verified,
                ])
                ->sortByDesc('follower_count')
                ->values(),
            'invited_campaign_ids' => $creator->invitations
                ->where('status', CampaignInvitation::STATUS_PENDING)
                ->pluck('campaign_id')
                ->values(),
        ];
    }

    /**
     * The brand's live campaigns — what a creator can actually be invited to.
     *
     * @return array<int, array<string, mixed>>
     */
    private function invitableCampaigns(Request $request): array
    {
        $brandProfileId = $request->user()->brandProfile?->id;

        if ($brandProfileId === null) {
            return [];
        }

        return Campaign::query()
            ->where('brand_profile_id', $brandProfileId)
            ->where('status', 'active')
            ->orderByDesc('published_at')
            ->get(['id', 'title', 'type'])
            ->map(fn (Campaign $c) => [
                'id' => $c->id,
                'title' => $c->title,
                'type' => $c->type,
            ])
            ->all();
    }
}
