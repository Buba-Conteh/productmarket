import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    Calendar,
    CheckCircle2,
    FileVideo,
    User,
} from 'lucide-react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Campaign, Entry, EntryStatus, PaginatedData } from '@/types';

type Props = {
    campaign: Campaign;
    entries: PaginatedData<Entry>;
    filters: { status: string };
    counts: Record<string, number>;
};

const STATUS_STYLES: Record<EntryStatus, string> = {
    draft: 'bg-muted text-muted-foreground',
    pending_review: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-blue-100 text-blue-700',
    rejected: 'bg-red-100 text-red-700',
    live: 'bg-green-100 text-green-700',
    won: 'bg-purple-100 text-purple-700',
    not_selected: 'bg-gray-100 text-gray-600',
    disqualified: 'bg-red-100 text-red-700',
};

const STATUS_LABELS: Record<EntryStatus, string> = {
    draft: 'Draft',
    pending_review: 'Pending Review',
    approved: 'Approved',
    rejected: 'Rejected',
    live: 'Live',
    won: 'Won',
    not_selected: 'Not Selected',
    disqualified: 'Disqualified',
};

function formatDate(date: string | null): string {
    if (!date) {
        return '-';
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

const TABS = [
    { key: 'all', label: 'All' },
    { key: 'pending_review', label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'live', label: 'Live' },
    { key: 'rejected', label: 'Rejected' },
];

export default function BrandEntryReview({
    campaign,
    entries,
    filters,
    counts,
}: Props) {
    const { props } = usePage();
    const flash = (props as { flash?: { success?: string; error?: string } })
        .flash;

    function setFilter(status: string) {
        router.get(
            `/campaigns/${campaign.id}/entries`,
            { status },
            { preserveState: true },
        );
    }

    return (
        <>
            <Head title={`Entries — ${campaign.title}`} />

            <div className="mx-auto max-w-5xl px-4 py-6">
                {flash?.success && (
                    <div className="mb-4 flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700">
                        <CheckCircle2 className="size-4 shrink-0" />
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                        <AlertCircle className="size-4 shrink-0" />
                        {flash.error}
                    </div>
                )}

                <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="mb-4 gap-1"
                >
                    <Link href={`/campaigns/${campaign.id}`}>
                        <ArrowLeft className="size-4" />
                        Back to campaign
                    </Link>
                </Button>

                <Heading title="Review Entries" description={campaign.title} />

                {/* Status tabs */}
                <div className="mb-6 flex flex-wrap gap-2">
                    {TABS.map((tab) => (
                        <Button
                            key={tab.key}
                            variant={
                                filters.status === tab.key
                                    ? 'default'
                                    : 'outline'
                            }
                            size="sm"
                            onClick={() => setFilter(tab.key)}
                        >
                            {tab.label}
                            {counts[tab.key] !== undefined && (
                                <span className="ml-1.5 text-xs opacity-70">
                                    {counts[tab.key]}
                                </span>
                            )}
                        </Button>
                    ))}
                </div>

                {/* Entries list */}
                {entries.data.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                            <FileVideo className="mb-3 size-10 text-muted-foreground" />
                            <p className="text-muted-foreground">
                                No entries yet for this campaign
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {entries.data.map((entry) => (
                            <Link
                                key={entry.id}
                                href={`/campaigns/${campaign.id}/entries/${entry.id}`}
                                className="block"
                            >
                                <Card className="transition-colors hover:border-primary/50">
                                    <CardContent className="flex items-center gap-4 py-4">
                                        {/* Creator info */}
                                        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
                                            <User className="size-5 text-muted-foreground" />
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="truncate font-medium">
                                                    {entry.creator?.user
                                                        ?.name ??
                                                        entry.creator
                                                            ?.display_name ??
                                                        'Creator'}
                                                </span>
                                                <span
                                                    className={cn(
                                                        'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium',
                                                        STATUS_STYLES[
                                                            entry.status
                                                        ],
                                                    )}
                                                >
                                                    {
                                                        STATUS_LABELS[
                                                            entry.status
                                                        ]
                                                    }
                                                </span>
                                            </div>
                                            <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                                                {entry.creator?.niches &&
                                                    entry.creator.niches
                                                        .length > 0 && (
                                                        <span>
                                                            {entry.creator.niches
                                                                .map(
                                                                    (n) =>
                                                                        n.name,
                                                                )
                                                                .join(', ')}
                                                        </span>
                                                    )}
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="size-3" />
                                                    {formatDate(
                                                        entry.submitted_at,
                                                    )}
                                                </span>
                                                {entry.content_type && (
                                                    <Badge
                                                        variant="secondary"
                                                        className="text-xs"
                                                    >
                                                        {
                                                            entry.content_type
                                                                .name
                                                        }
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>

                                        {/* Right side - type-specific info */}
                                        <div className="shrink-0 text-right">
                                            {entry.type === 'pitch' &&
                                                entry.pitch_details && (
                                                    <div className="text-sm">
                                                        <span className="text-muted-foreground">
                                                            Bid:{' '}
                                                        </span>
                                                        <span className="font-semibold text-green-600">
                                                            {formatCurrency(
                                                                entry
                                                                    .pitch_details
                                                                    .proposed_bid,
                                                            )}
                                                        </span>
                                                    </div>
                                                )}
                                            {entry.platforms &&
                                                entry.platforms.length > 0 && (
                                                    <div className="mt-1 flex gap-1">
                                                        {entry.platforms.map(
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
                                                )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {entries.last_page > 1 && (
                    <div className="mt-6 flex justify-center gap-2">
                        {entries.links.map((link, i) => (
                            <Button
                                key={i}
                                variant={link.active ? 'default' : 'outline'}
                                size="sm"
                                disabled={!link.url}
                                onClick={() => {
                                    if (link.url) {
                                        router.get(link.url);
                                    }
                                }}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
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
