import { Head, router } from '@inertiajs/react';
import { Search, SlidersHorizontal, Users, X } from 'lucide-react';
import { useState } from 'react';
import { CreatorDirectoryCard } from '@/components/creators/creator-directory-card';
import { CreatorQuickViewDialog } from '@/components/creators/creator-quick-view-dialog';
import { CreatorVideoViewer } from '@/components/creators/creator-video-viewer';
import { InviteCreatorDialog } from '@/components/creators/invite-creator-dialog';
import Heading from '@/components/heading';
import { CountrySelect } from '@/components/shared/country-select';
import { EmptyState } from '@/components/shared/empty-state';
import { FlashAlert } from '@/components/shared/flash-alert';
import { PaginationNav } from '@/components/shared/pagination-nav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useCreatorBrowser } from '@/hooks/use-creator-browser';
import type { PaginatedData, Platform } from '@/types';
import type { CreatorSearchResult, InvitableCampaign } from '@/types/profile';

type Niche = { id: string; name: string };

type Props = {
    creators: PaginatedData<CreatorSearchResult>;
    filters: Record<string, string | undefined>;
    niches: Niche[];
    platforms: Platform[];
    invitableCampaigns: InvitableCampaign[];
};

const SORTS = [
    { value: 'followers', label: 'Most followers' },
    { value: 'views', label: 'Most campaign views' },
    { value: 'engagement', label: 'Highest engagement' },
    { value: 'earnings', label: 'Top earning' },
    { value: 'newest', label: 'Recently joined' },
];

export default function BrandCreatorSearch({
    creators,
    filters,
    niches,
    platforms,
    invitableCampaigns,
}: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [showFilters, setShowFilters] = useState(false);
    const [inviting, setInviting] = useState<CreatorSearchResult | null>(null);
    const browser = useCreatorBrowser(creators.data.length);

    const browsing =
        browser.creatorIndex !== null
            ? creators.data[browser.creatorIndex]
            : null;
    const position = {
        index: browser.creatorIndex ?? 0,
        total: creators.data.length,
    };

    function inviteHandler(creator: CreatorSearchResult) {
        return invitableCampaigns.length > 0
            ? () => setInviting(creator)
            : undefined;
    }

    function isFullyInvited(creator: CreatorSearchResult): boolean {
        return (
            invitableCampaigns.length > 0 &&
            invitableCampaigns.every((c) =>
                creator.invited_campaign_ids.includes(c.id),
            )
        );
    }

    function applyFilter(key: string, value: string | undefined) {
        const updated = { ...filters, [key]: value || undefined };

        if (!value) {
            delete updated[key];
        }

        router.get('/creators', updated, {
            preserveState: true,
            preserveScroll: true,
        });
    }

    function handleSearch(e: React.SyntheticEvent<HTMLFormElement>) {
        e.preventDefault();
        applyFilter('search', search);
    }

    const activeFilterKeys = Object.keys(filters).filter(
        (k) => k !== 'sort' && filters[k],
    );

    return (
        <>
            <Head title="Find Creators" />

            <div className="px-4 py-6">
                <FlashAlert />

                <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                    <Heading
                        title="Find Creators"
                        description="Verified reach across TikTok, Instagram and YouTube — invite the right creators straight to a campaign"
                    />
                    <p className="pb-1 text-sm text-muted-foreground">
                        <span className="font-semibold text-foreground">
                            {creators.total}
                        </span>{' '}
                        creator{creators.total === 1 ? '' : 's'}
                    </p>
                </div>

                {/* Search + sort bar */}
                <div className="mb-4 flex flex-col gap-2 sm:flex-row">
                    <form onSubmit={handleSearch} className="flex flex-1 gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search creators by name or bio..."
                                className="pl-9"
                            />
                        </div>
                        <Button type="submit" variant="secondary">
                            Search
                        </Button>
                    </form>

                    <div className="flex gap-2">
                        <Select
                            value={filters.sort ?? 'followers'}
                            onValueChange={(v) => applyFilter('sort', v)}
                        >
                            <SelectTrigger className="w-[190px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {SORTS.map((s) => (
                                    <SelectItem key={s.value} value={s.value}>
                                        {s.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Button
                            variant={showFilters ? 'default' : 'outline'}
                            onClick={() => setShowFilters((v) => !v)}
                            className="gap-1.5"
                        >
                            <SlidersHorizontal className="size-4" />
                            Filters
                            {activeFilterKeys.length > 0 && (
                                <span className="rounded-full bg-primary-foreground/20 px-1.5 text-xs">
                                    {activeFilterKeys.length}
                                </span>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Filter panel */}
                {showFilters && (
                    <div className="mb-6 grid gap-4 rounded-xl border bg-muted/30 p-4 sm:grid-cols-2 lg:grid-cols-5">
                        <div className="space-y-1.5">
                            <Label className="text-xs">Niche</Label>
                            <Select
                                value={filters.niche_id ?? 'all'}
                                onValueChange={(v) =>
                                    applyFilter(
                                        'niche_id',
                                        v === 'all' ? undefined : v,
                                    )
                                }
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="All niches" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        All niches
                                    </SelectItem>
                                    {niches.map((n) => (
                                        <SelectItem key={n.id} value={n.id}>
                                            {n.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs">Platform</Label>
                            <Select
                                value={filters.platform_id ?? 'all'}
                                onValueChange={(v) =>
                                    applyFilter(
                                        'platform_id',
                                        v === 'all' ? undefined : v,
                                    )
                                }
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="All platforms" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        All platforms
                                    </SelectItem>
                                    {platforms.map((p) => (
                                        <SelectItem key={p.id} value={p.id}>
                                            {p.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs" htmlFor="min-followers">
                                Min followers
                            </Label>
                            <Input
                                id="min-followers"
                                type="number"
                                min={0}
                                placeholder="e.g. 10000"
                                defaultValue={filters.min_followers ?? ''}
                                onBlur={(e) =>
                                    applyFilter('min_followers', e.target.value)
                                }
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs" htmlFor="max-followers">
                                Max followers
                            </Label>
                            <Input
                                id="max-followers"
                                type="number"
                                min={0}
                                placeholder="No limit"
                                defaultValue={filters.max_followers ?? ''}
                                onBlur={(e) =>
                                    applyFilter('max_followers', e.target.value)
                                }
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs" htmlFor="country">
                                Country
                            </Label>
                            <CountrySelect
                                id="country"
                                placeholder="Any country"
                                value={filters.country ?? ''}
                                onChange={(code) =>
                                    applyFilter('country', code)
                                }
                            />
                        </div>

                        {activeFilterKeys.length > 0 && (
                            <div className="sm:col-span-2 lg:col-span-5">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="gap-1"
                                    onClick={() => {
                                        setSearch('');
                                        router.get(
                                            '/creators',
                                            filters.sort
                                                ? { sort: filters.sort }
                                                : {},
                                            { preserveState: true },
                                        );
                                    }}
                                >
                                    <X className="size-3.5" />
                                    Clear all filters
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {/* Results */}
                {creators.data.length === 0 ? (
                    <EmptyState
                        icon={Users}
                        title="No creators found"
                        description="Try widening your follower range or clearing a filter."
                        action={
                            activeFilterKeys.length > 0 ? (
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setSearch('');
                                        router.get('/creators');
                                    }}
                                >
                                    Clear filters
                                </Button>
                            ) : undefined
                        }
                    />
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {creators.data.map((creator, index) => (
                            <CreatorDirectoryCard
                                key={creator.id}
                                creator={creator}
                                onOpen={() => browser.openQuickView(index)}
                                onPlayVideo={(videoIndex) =>
                                    browser.openVideo(index, videoIndex)
                                }
                                onInvite={inviteHandler(creator)}
                                fullyInvited={isFullyInvited(creator)}
                            />
                        ))}
                    </div>
                )}

                <PaginationNav meta={creators} />
            </div>

            {browsing && browser.quickViewOpen && (
                <CreatorQuickViewDialog
                    creator={browsing}
                    position={position}
                    onClose={browser.close}
                    onPrevious={
                        browser.hasPrevious ? browser.previous : undefined
                    }
                    onNext={browser.hasNext ? browser.next : undefined}
                    onPlayVideo={(videoIndex) =>
                        browser.openVideo(browser.creatorIndex ?? 0, videoIndex)
                    }
                    onInvite={inviteHandler(browsing)}
                    fullyInvited={isFullyInvited(browsing)}
                    keyboardPaused={inviting !== null}
                />
            )}

            {browsing && browser.videoIndex !== null && (
                <CreatorVideoViewer
                    creator={browsing}
                    position={position}
                    initialVideoIndex={browser.videoIndex}
                    onClose={browser.closeVideo}
                    onPrevious={
                        browser.hasPrevious ? browser.previous : undefined
                    }
                    onNext={browser.hasNext ? browser.next : undefined}
                    onInvite={inviteHandler(browsing)}
                    fullyInvited={isFullyInvited(browsing)}
                    keyboardPaused={inviting !== null}
                />
            )}

            {inviting && (
                <InviteCreatorDialog
                    creator={inviting}
                    campaigns={invitableCampaigns}
                    open
                    onOpenChange={(open) => !open && setInviting(null)}
                />
            )}
        </>
    );
}

BrandCreatorSearch.layout = {
    breadcrumbs: [{ title: 'Find Creators', href: '/creators' }],
};
