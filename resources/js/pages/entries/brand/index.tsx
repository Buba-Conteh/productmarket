import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    Banknote,
    Calendar,
    Check,
    ChevronRight,
    Eye,
    FileVideo,
    MessageCircle,
    Search,
    Users,
    X,
} from 'lucide-react';
import { useState } from 'react';
import { EntryStatusBadge } from '@/components/entries/entry-status-badge';
import Heading from '@/components/heading';
import { EmptyState } from '@/components/shared/empty-state';
import { FilterTabs } from '@/components/shared/filter-tabs';
import { FlashAlert } from '@/components/shared/flash-alert';
import { PaginationNav } from '@/components/shared/pagination-nav';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { REVIEW_STATUS_STYLES } from '@/lib/entry-status';
import { formatCompactNumber } from '@/lib/format';
import { cn } from '@/lib/utils';
import type {
    Campaign,
    CampaignApplication,
    Entry,
    PaginatedData,
} from '@/types';

type Summary = {
    total_entries: number;
    total_views: number;
    total_comments: number;
    paid_out: string;
};

type Props = {
    campaign: Campaign;
    entries: PaginatedData<Entry>;
    filters: { status: string; search: string | null; sort: string };
    counts: Record<string, number>;
    applications: CampaignApplication[];
    summary: Summary;
};

const TABS = [
    { key: 'all', label: 'All' },
    { key: 'pending_review', label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'live', label: 'Live' },
    { key: 'rejected', label: 'Rejected' },
];

const SORTS = [
    { value: 'newest', label: 'Newest first' },
    { value: 'oldest', label: 'Oldest first' },
    { value: 'views', label: 'Most views' },
    { value: 'bid', label: 'Highest bid' },
];

function formatDate(date: string | null): string {
    if (!date) {
        return '—';
    }

    return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
    });
}

function formatCurrency(value: string | number | null | undefined): string {
    if (value === null || value === undefined) {
        return '$0';
    }

    return `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
}

function initials(name: string): string {
    return name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
}

/** Total verified followers across every platform the creator has connected. */
function creatorFollowers(entry: Entry): number {
    return (
        entry.creator?.user?.social_accounts?.reduce(
            (sum, a) => sum + (a.follower_count ?? 0),
            0,
        ) ?? 0
    );
}

function entryViews(entry: Entry): number {
    return (
        entry.platforms?.reduce(
            (sum, p) => sum + (p.pivot?.verified_view_count ?? 0),
            0,
        ) ?? 0
    );
}

export default function BrandEntryReview({
    campaign,
    entries,
    filters,
    counts,
    applications,
    summary,
}: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    function navigate(overrides: Record<string, string | undefined>) {
        router.get(
            `/campaigns/${campaign.id}/entries`,
            {
                status: filters.status,
                sort: filters.sort,
                search: filters.search ?? undefined,
                ...overrides,
            },
            { preserveState: true, preserveScroll: true },
        );
    }

    function approveApplication(applicationId: string) {
        router.post(
            `/campaigns/${campaign.id}/applications/${applicationId}/approve`,
            {},
            { preserveState: false },
        );
    }

    function rejectApplication(applicationId: string) {
        if (!confirm('Reject this application?')) {
            return;
        }

        router.post(
            `/campaigns/${campaign.id}/applications/${applicationId}/reject`,
            {},
            { preserveState: false },
        );
    }

    const pendingApplications = applications.filter(
        (a) => a.status === 'pending',
    ).length;

    const stats = [
        {
            key: 'entries',
            icon: FileVideo,
            label: 'Entries',
            value: summary.total_entries.toLocaleString(),
        },
        {
            key: 'views',
            icon: Eye,
            label: 'Verified views',
            value: formatCompactNumber(summary.total_views),
        },
        {
            key: 'comments',
            icon: MessageCircle,
            label: 'Comments',
            value: formatCompactNumber(summary.total_comments),
        },
        {
            key: 'paid',
            icon: Banknote,
            label: 'Paid out',
            value: formatCurrency(summary.paid_out),
        },
    ];

    return (
        <>
            <Head title={`Entries — ${campaign.title}`} />

            <div className="mx-auto max-w-6xl px-4 py-6">
                <FlashAlert />

                <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="mb-4 -ml-2 gap-1 text-muted-foreground"
                >
                    <Link href={`/campaigns/${campaign.id}`}>
                        <ArrowLeft className="size-4" />
                        Back to campaign
                    </Link>
                </Button>

                <Heading title="Review Entries" description={campaign.title} />

                {/* Campaign-level reach */}
                <div className="mb-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-border lg:grid-cols-4">
                    {stats.map((stat) => (
                        <div
                            key={stat.key}
                            className="flex flex-col gap-1 bg-card p-4"
                        >
                            <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                                <stat.icon className="size-3.5" />
                                {stat.label}
                            </span>
                            <span className="text-xl font-semibold tracking-tight tabular-nums">
                                {stat.value}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Applications — Pitch campaigns only */}
                {campaign.type === 'pitch' && applications.length > 0 && (
                    <Card className="mb-6">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base">
                                Applications
                                {pendingApplications > 0 && (
                                    <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                                        {pendingApplications} pending
                                    </span>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {applications.map((app) => (
                                <div
                                    key={app.id}
                                    className="flex flex-col gap-3 rounded-xl border p-3 sm:flex-row sm:items-start sm:justify-between"
                                >
                                    <div className="flex min-w-0 items-start gap-3">
                                        <Avatar className="size-9 shrink-0">
                                            <AvatarFallback className="text-xs">
                                                {initials(
                                                    app.creator?.display_name ??
                                                        app.creator?.user
                                                            ?.name ??
                                                        'C',
                                                )}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="text-sm font-medium">
                                                    {app.creator
                                                        ?.display_name ??
                                                        app.creator?.user
                                                            ?.name ??
                                                        'Creator'}
                                                </span>
                                                <span
                                                    className={cn(
                                                        'rounded-full px-2 py-0.5 text-xs font-medium capitalize ring-1 ring-inset',
                                                        REVIEW_STATUS_STYLES[
                                                            app.status
                                                        ] ?? '',
                                                    )}
                                                >
                                                    {app.status}
                                                </span>
                                            </div>
                                            {app.creator?.niches &&
                                                app.creator.niches.length >
                                                    0 && (
                                                    <div className="mt-1.5 flex flex-wrap gap-1">
                                                        {app.creator.niches
                                                            .slice(0, 3)
                                                            .map((n) => (
                                                                <Badge
                                                                    key={n.id}
                                                                    variant="secondary"
                                                                    className="text-xs"
                                                                >
                                                                    {n.name}
                                                                </Badge>
                                                            ))}
                                                    </div>
                                                )}
                                            {app.pitch && (
                                                <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                                                    {app.pitch}
                                                </p>
                                            )}
                                            <p className="mt-1.5 text-xs text-muted-foreground">
                                                Applied{' '}
                                                {new Date(
                                                    app.created_at,
                                                ).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    {app.status === 'pending' && (
                                        <div className="flex shrink-0 gap-2">
                                            <Button
                                                size="sm"
                                                onClick={() =>
                                                    approveApplication(app.id)
                                                }
                                                className="gap-1"
                                            >
                                                <Check className="size-3.5" />
                                                Approve
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() =>
                                                    rejectApplication(app.id)
                                                }
                                                className="gap-1"
                                            >
                                                <X className="size-3.5" />
                                                Reject
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}

                {/* Filters */}
                <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <FilterTabs
                        tabs={TABS}
                        active={filters.status}
                        counts={counts}
                        onChange={(status) => navigate({ status })}
                        className="lg:max-w-fit"
                    />

                    <div className="flex gap-2">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                navigate({ search: search || undefined });
                            }}
                            className="relative flex-1 lg:w-56"
                        >
                            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search creators..."
                                className="pl-9"
                            />
                        </form>

                        <Select
                            value={filters.sort}
                            onValueChange={(sort) => navigate({ sort })}
                        >
                            <SelectTrigger className="w-[150px]">
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
                    </div>
                </div>

                {/* Entries */}
                {entries.data.length === 0 ? (
                    <EmptyState
                        icon={FileVideo}
                        title={
                            filters.search
                                ? 'No entries match that search'
                                : 'No entries yet'
                        }
                        description={
                            filters.search
                                ? 'Try a different creator name.'
                                : 'Creators who submit to this campaign will appear here for review.'
                        }
                        action={
                            <Button variant="outline" asChild>
                                <Link href="/creators">Invite creators</Link>
                            </Button>
                        }
                    />
                ) : (
                    <div className="space-y-2.5">
                        {entries.data.map((entry) => {
                            const followers = creatorFollowers(entry);
                            const views = entryViews(entry);
                            const name =
                                entry.creator?.user?.name ??
                                entry.creator?.display_name ??
                                'Creator';

                            return (
                                <Link
                                    key={entry.id}
                                    href={`/campaigns/${campaign.id}/entries/${entry.id}`}
                                    className="group block"
                                >
                                    <Card className="transition-all group-hover:border-primary/40 group-hover:shadow-md">
                                        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                                            <Avatar className="size-11 shrink-0 ring-2 ring-border">
                                                <AvatarImage
                                                    src={
                                                        entry.creator?.user
                                                            ?.avatar ??
                                                        undefined
                                                    }
                                                    alt={name}
                                                />
                                                <AvatarFallback className="text-xs font-semibold">
                                                    {initials(name)}
                                                </AvatarFallback>
                                            </Avatar>

                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="truncate font-medium">
                                                        {name}
                                                    </span>
                                                    <EntryStatusBadge
                                                        status={entry.status}
                                                    />
                                                    {entry.edit_requests &&
                                                        entry.edit_requests.some(
                                                            (r) =>
                                                                r.status ===
                                                                'pending',
                                                        ) && (
                                                            <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-blue-500/20 ring-inset dark:text-blue-400">
                                                                Edit requested
                                                            </span>
                                                        )}
                                                </div>

                                                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                                    {followers > 0 && (
                                                        <span className="flex items-center gap-1">
                                                            <Users className="size-3" />
                                                            {formatCompactNumber(
                                                                followers,
                                                            )}{' '}
                                                            followers
                                                        </span>
                                                    )}
                                                    {views > 0 && (
                                                        <span className="flex items-center gap-1 font-medium text-foreground">
                                                            <Eye className="size-3" />
                                                            {formatCompactNumber(
                                                                views,
                                                            )}{' '}
                                                            views
                                                        </span>
                                                    )}
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="size-3" />
                                                        {formatDate(
                                                            entry.submitted_at,
                                                        )}
                                                    </span>
                                                    {entry.creator?.niches &&
                                                        entry.creator.niches
                                                            .length > 0 && (
                                                            <span className="truncate">
                                                                {entry.creator.niches
                                                                    .slice(0, 2)
                                                                    .map(
                                                                        (n) =>
                                                                            n.name,
                                                                    )
                                                                    .join(', ')}
                                                            </span>
                                                        )}
                                                </div>

                                                <div className="mt-2 flex flex-wrap gap-1">
                                                    {entry.content_type && (
                                                        <Badge
                                                            variant="secondary"
                                                            className="text-xs"
                                                        >
                                                            {
                                                                entry
                                                                    .content_type
                                                                    .name
                                                            }
                                                        </Badge>
                                                    )}
                                                    {entry.platforms?.map(
                                                        (p) => (
                                                            <Badge
                                                                key={p.id}
                                                                variant="outline"
                                                                className="text-xs"
                                                            >
                                                                {p.name}
                                                            </Badge>
                                                        ),
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end sm:gap-1">
                                                {entry.type === 'pitch' &&
                                                    entry.pitch_details && (
                                                        <div className="text-right">
                                                            <p className="text-[11px] tracking-wide text-muted-foreground uppercase">
                                                                {entry
                                                                    .pitch_details
                                                                    .accepted_bid
                                                                    ? 'Accepted'
                                                                    : 'Bid'}
                                                            </p>
                                                            <p className="font-semibold text-emerald-600 tabular-nums dark:text-emerald-400">
                                                                {formatCurrency(
                                                                    entry
                                                                        .pitch_details
                                                                        .accepted_bid ??
                                                                        entry
                                                                            .pitch_details
                                                                            .proposed_bid,
                                                                )}
                                                            </p>
                                                        </div>
                                                    )}
                                                <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            );
                        })}
                    </div>
                )}

                <PaginationNav meta={entries} />
            </div>
        </>
    );
}

BrandEntryReview.layout = {
    breadcrumbs: [
        { title: 'Campaigns', href: '/campaigns' },
        { title: 'Entries', href: '#' },
    ],
};
