import { Head, Link, router } from '@inertiajs/react';
import { Calendar, DollarSign, Filter, Search, Users } from 'lucide-react';
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
import type { Campaign, ContentType, PaginatedData, Platform } from '@/types';

type Props = {
    campaigns: PaginatedData<Campaign>;
    filters: Record<string, string | undefined>;
    platforms: Platform[];
    contentTypes: ContentType[];
};

const TYPE_LABELS: Record<string, string> = {
    contest: 'Contest',
    ripple: 'Ripple',
    pitch: 'Pitch',
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

export default function CreatorCampaignDiscovery({
    campaigns,
    filters,
    platforms,
    contentTypes,
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

    function handleSearch(e: React.FormEvent) {
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
                            value={filters.type ?? ''}
                            onValueChange={(v) =>
                                applyFilter('type', v || undefined)
                            }
                        >
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="All types" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">All types</SelectItem>
                                <SelectItem value="contest">Contest</SelectItem>
                                <SelectItem value="ripple">Ripple</SelectItem>
                                <SelectItem value="pitch">Pitch</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select
                            value={filters.platform_id ?? ''}
                            onValueChange={(v) =>
                                applyFilter('platform_id', v || undefined)
                            }
                        >
                            <SelectTrigger className="w-[160px]">
                                <SelectValue placeholder="All platforms" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">All platforms</SelectItem>
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
                                <Card className="h-full transition-shadow hover:shadow-md">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="space-y-1">
                                                <CardTitle className="line-clamp-1 text-base">
                                                    {campaign.title}
                                                </CardTitle>
                                                <CardDescription className="line-clamp-1">
                                                    {campaign.brand
                                                        ?.company_name ??
                                                        'Brand'}
                                                </CardDescription>
                                            </div>
                                            <Badge
                                                variant="outline"
                                                className="shrink-0 capitalize"
                                            >
                                                {TYPE_LABELS[campaign.type] ??
                                                    campaign.type}
                                            </Badge>
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
