import { Head, Link, router } from '@inertiajs/react';
import { Calendar, CheckCircle2, Clock, DollarSign, Filter, Search, Users } from 'lucide-react';
import { useState } from 'react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { Campaign, PaginatedData, Platform } from '@/types';

type Props = {
    campaigns: PaginatedData<Campaign>;
    filters: Record<string, string | undefined>;
    platforms: Platform[];
    enteredCampaignIds: string[];
    applicationStatuses: Record<string, string>;
};

const TYPE_LABELS: Record<string, string> = {
    contest: 'Contest',
    ripple: 'Ripple',
    pitch: 'Pitch',
};

const TYPE_GRADIENTS: Record<string, string> = {
    contest: 'from-purple-500 to-indigo-600',
    ripple: 'from-blue-500 to-cyan-600',
    pitch: 'from-orange-500 to-rose-600',
};

const SORT_OPTIONS = [
    { value: 'latest', label: 'Newest first' },
    { value: 'deadline', label: 'Deadline soonest' },
    { value: 'popular', label: 'Most entries' },
];

function formatDate(date: string | null): string {
    if (!date) {
        return 'No deadline';
    }

    return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
    });
}

function budgetDisplay(campaign: Campaign): string {
    switch (campaign.type) {
        case 'contest':
            return campaign.contest_details
                ? `$${Number(campaign.contest_details.prize_amount).toLocaleString()} prize`
                : '';
        case 'ripple':
            return campaign.ripple_details
                ? `$${Number(campaign.ripple_details.total_budget).toLocaleString()} budget`
                : '';
        case 'pitch':
            return campaign.pitch_details?.budget_cap
                ? `Up to $${Number(campaign.pitch_details.budget_cap).toLocaleString()}`
                : 'Open bidding';
        default:
            return '';
    }
}

function EntryStatusBadge({
    campaignId,
    campaignType,
    enteredCampaignIds,
    applicationStatuses,
}: {
    campaignId: string;
    campaignType: string;
    enteredCampaignIds: string[];
    applicationStatuses: Record<string, string>;
}) {
    const hasEntry = enteredCampaignIds.includes(campaignId);
    const appStatus = applicationStatuses[campaignId];

    if (hasEntry) {
        return (
            <span className="flex items-center gap-1 rounded-full bg-green-500 px-2 py-0.5 text-xs font-medium text-white shadow">
                <CheckCircle2 className="size-3" />
                Applied
            </span>
        );
    }

    if (campaignType === 'pitch' && appStatus) {
        const isPending = appStatus === 'pending';
        return (
            <span
                className={cn(
                    'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium shadow',
                    isPending
                        ? 'bg-yellow-400 text-yellow-900'
                        : appStatus === 'approved'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-400 text-white',
                )}
            >
                <Clock className="size-3" />
                {appStatus.charAt(0).toUpperCase() + appStatus.slice(1)}
            </span>
        );
    }

    return null;
}

export default function CreatorCampaignDiscovery({
    campaigns,
    filters,
    platforms,
    enteredCampaignIds,
    applicationStatuses,
}: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    function applyFilter(key: string, value: string | undefined) {
        const newFilters = { ...filters, [key]: value || undefined };

        if (!value) {
            delete newFilters[key];
        }

        router.get('/discover', newFilters, {
            preserveState: true,
        });
    }

    function handleSearch(e: React.SyntheticEvent) {
        e.preventDefault();
        applyFilter('search', search);
    }

    return (
        <>
            <Head title="Discover Campaigns" />

            <div className="px-4 py-6">
                <Heading
                    title="Discover Campaigns"
                    description="Find campaigns that match your skills and earn money creating content"
                />

                {/* Filters */}
                <div className="mb-6 space-y-4">
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search campaigns..."
                                className="pl-9"
                            />
                        </div>
                        <Button type="submit" variant="outline">
                            Search
                        </Button>
                    </form>

                    <div className="flex flex-wrap gap-3">
                        <Select
                            value={filters.type ?? 'all'}
                            onValueChange={(v) =>
                                applyFilter('type', v === 'all' ? undefined : v)
                            }
                        >
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="All types" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All types</SelectItem>
                                <SelectItem value="contest">Contest</SelectItem>
                                <SelectItem value="ripple">Ripple</SelectItem>
                                <SelectItem value="pitch">Pitch</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select
                            value={filters.platform_id ?? 'all'}
                            onValueChange={(v) =>
                                applyFilter('platform_id', v === 'all' ? undefined : v)
                            }
                        >
                            <SelectTrigger className="w-[160px]">
                                <SelectValue placeholder="All platforms" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All platforms</SelectItem>
                                {platforms.map((p) => (
                                    <SelectItem key={p.id} value={p.id}>
                                        {p.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={filters.sort ?? 'latest'}
                            onValueChange={(v) => applyFilter('sort', v)}
                        >
                            <SelectTrigger className="w-[160px]">
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent>
                                {SORT_OPTIONS.map((opt) => (
                                    <SelectItem
                                        key={opt.value}
                                        value={opt.value}
                                    >
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {Object.keys(filters).length > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                    router.get(
                                        '/discover',
                                        {},
                                        { preserveState: true },
                                    )
                                }
                                className="gap-1"
                            >
                                <Filter className="size-3.5" />
                                Clear filters
                            </Button>
                        )}
                    </div>
                </div>

                {/* Campaigns */}
                {campaigns.data.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
                            <Search className="size-10 text-muted-foreground" />
                            <div>
                                <p className="font-medium">
                                    No campaigns found
                                </p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Try adjusting your filters or check back
                                    later.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {campaigns.data.map((campaign) => (
                            <Link
                                key={campaign.id}
                                href={`/discover/${campaign.id}`}
                                className="block"
                            >
                                <Card className="h-full overflow-hidden transition-shadow hover:shadow-md">
                                    {/* Thumbnail */}
                                    <div className="relative h-40 w-full overflow-hidden">
                                        {campaign.thumbnail_url ? (
                                            <img
                                                src={campaign.thumbnail_url}
                                                alt={campaign.title}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div
                                                className={cn(
                                                    'flex h-full w-full items-center justify-center bg-gradient-to-br',
                                                    TYPE_GRADIENTS[campaign.type] ?? 'from-gray-400 to-gray-600',
                                                )}
                                            >
                                                <span className="text-2xl font-bold text-white/20">
                                                    {campaign.title.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                        )}
                                        {/* Type badge + entry status overlaid on image */}
                                        <div className="absolute top-2 left-2 right-2 flex items-start justify-between">
                                            <Badge
                                                variant="secondary"
                                                className="bg-black/50 text-white backdrop-blur-sm hover:bg-black/50 capitalize border-0"
                                            >
                                                {TYPE_LABELS[campaign.type] ?? campaign.type}
                                            </Badge>
                                            <EntryStatusBadge
                                                campaignId={campaign.id}
                                                campaignType={campaign.type}
                                                enteredCampaignIds={enteredCampaignIds}
                                                applicationStatuses={applicationStatuses}
                                            />
                                        </div>
                                    </div>

                                    <CardHeader className="pb-3">
                                        <div className="space-y-1">
                                            <CardTitle className="line-clamp-1 text-base">
                                                {campaign.title}
                                            </CardTitle>
                                            <CardDescription className="line-clamp-1">
                                                {campaign.brand?.company_name ?? 'Brand'}
                                            </CardDescription>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
                                            {campaign.brief.replace(
                                                /<[^>]*>/g,
                                                '',
                                            )}
                                        </p>
                                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1 font-medium text-foreground">
                                                <DollarSign className="size-3.5" />
                                                {budgetDisplay(campaign)}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Users className="size-3.5" />
                                                {campaign.entries_count ?? 0}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Calendar className="size-3.5" />
                                                {formatDate(campaign.deadline)}
                                            </span>
                                        </div>
                                        {campaign.platforms &&
                                            campaign.platforms.length > 0 && (
                                                <div className="mt-2 flex flex-wrap gap-1">
                                                    {campaign.platforms.map(
                                                        (p) => (
                                                            <Badge
                                                                key={p.id}
                                                                variant="secondary"
                                                                className="text-xs"
                                                            >
                                                                {p.name}
                                                            </Badge>
                                                        ),
                                                    )}
                                                </div>
                                            )}
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {campaigns.last_page > 1 && (
                    <div className="mt-6 flex items-center justify-center gap-2">
                        {campaigns.links.map((link, i) => (
                            <Button
                                key={i}
                                variant={link.active ? 'default' : 'outline'}
                                size="sm"
                                disabled={!link.url}
                                onClick={() =>
                                    link.url &&
                                    router.get(
                                        link.url,
                                        {},
                                        { preserveState: true },
                                    )
                                }
                                dangerouslySetInnerHTML={{
                                    __html: link.label,
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

CreatorCampaignDiscovery.layout = {
    breadcrumbs: [{ title: 'Discover', href: '/discover' }],
};
