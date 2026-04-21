import { Head, Link, router } from '@inertiajs/react';
import { Calendar, FileVideo } from 'lucide-react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Entry, EntryStatus, PaginatedData } from '@/types';

type Props = {
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
        year: 'numeric',
    });
}

const TABS = [
    { key: 'all', label: 'All' },
    { key: 'draft', label: 'Drafts' },
    { key: 'pending_review', label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'live', label: 'Live' },
    { key: 'rejected', label: 'Rejected' },
];

export default function CreatorEntries({ entries, filters, counts }: Props) {
    function setFilter(status: string) {
        router.get('/entries', { status }, { preserveState: true });
    }

    return (
        <>
            <Head title="My Entries" />

            <div className="mx-auto max-w-5xl px-4 py-6">
                <Heading
                    title="My Entries"
                    description="Track your campaign submissions"
                />

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

                {/* Entries grid */}
                {entries.data.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                            <FileVideo className="mb-3 size-10 text-muted-foreground" />
                            <p className="text-muted-foreground">
                                No entries yet
                            </p>
                            <Button asChild className="mt-4" size="sm">
                                <Link href="/discover">Browse campaigns</Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {entries.data.map((entry) => (
                            <Link
                                key={entry.id}
                                href={`/entries/${entry.id}`}
                                className="block"
                            >
                                <Card className="h-full transition-colors hover:border-primary/50">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <CardTitle className="line-clamp-1 text-base">
                                                {entry.campaign?.title ??
                                                    'Campaign'}
                                            </CardTitle>
                                            <span
                                                className={cn(
                                                    'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium',
                                                    STATUS_STYLES[entry.status],
                                                )}
                                            >
                                                {STATUS_LABELS[entry.status]}
                                            </span>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Badge
                                                variant="outline"
                                                className="capitalize"
                                            >
                                                {entry.type}
                                            </Badge>
                                            {entry.campaign?.brand && (
                                                <span>
                                                    by{' '}
                                                    {
                                                        entry.campaign.brand
                                                            .company_name
                                                    }
                                                </span>
                                            )}
                                        </div>

                                        {entry.pitch_details && (
                                            <div className="flex items-center gap-1 text-sm">
                                                <span className="text-muted-foreground">
                                                    Bid:
                                                </span>
                                                <span className="font-medium text-green-600">
                                                    $
                                                    {Number(
                                                        entry.pitch_details
                                                            .proposed_bid,
                                                    ).toFixed(2)}
                                                </span>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="size-3" />
                                                {formatDate(
                                                    entry.submitted_at ??
                                                        entry.created_at,
                                                )}
                                            </span>
                                            {entry.platforms &&
                                                entry.platforms.length > 0 && (
                                                    <span>
                                                        {entry.platforms.length}{' '}
                                                        platform
                                                        {entry.platforms
                                                            .length !== 1
                                                            ? 's'
                                                            : ''}
                                                    </span>
                                                )}
                                        </div>

                                        {entry.rejection_reason && (
                                            <p className="line-clamp-2 text-xs text-red-600">
                                                {entry.rejection_reason}
                                            </p>
                                        )}
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

CreatorEntries.layout = {
    breadcrumbs: [{ title: 'My Entries', href: '/entries' }],
};
