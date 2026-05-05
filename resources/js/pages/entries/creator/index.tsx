import { Head, Link, router } from '@inertiajs/react';
import { Calendar, FileVideo } from 'lucide-react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Entry, EntryStatus, PaginatedData } from '@/types';

const TYPE_GRADIENTS: Record<string, string> = {
    contest: 'from-purple-500 to-indigo-600',
    ripple: 'from-blue-500 to-cyan-600',
    pitch: 'from-orange-500 to-rose-600',
};

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
                                <Card className="h-full overflow-hidden transition-shadow hover:shadow-md">
                                    {/* Campaign thumbnail */}
                                    <div className="relative h-36 w-full overflow-hidden">
                                        {entry.campaign?.thumbnail_url ? (
                                            <img
                                                src={entry.campaign.thumbnail_url}
                                                alt={entry.campaign.title}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div
                                                className={cn(
                                                    'flex h-full w-full items-center justify-center bg-gradient-to-br',
                                                    TYPE_GRADIENTS[entry.type] ?? 'from-gray-400 to-gray-600',
                                                )}
                                            >
                                                <span className="text-2xl font-bold text-white/20">
                                                    {(entry.campaign?.title ?? 'C').charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                        )}
                                        <div className="absolute top-2 left-2 right-2 flex items-start justify-between">
                                            <Badge
                                                variant="secondary"
                                                className="bg-black/50 text-white backdrop-blur-sm hover:bg-black/50 capitalize border-0 text-xs"
                                            >
                                                {entry.type}
                                            </Badge>
                                            <span
                                                className={cn(
                                                    'rounded-full px-2 py-0.5 text-xs font-medium',
                                                    STATUS_STYLES[entry.status],
                                                )}
                                            >
                                                {STATUS_LABELS[entry.status]}
                                            </span>
                                        </div>
                                    </div>

                                    <CardHeader className="pb-3">
                                        <CardTitle className="line-clamp-1 text-base">
                                            {entry.campaign?.title ?? 'Campaign'}
                                        </CardTitle>
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
