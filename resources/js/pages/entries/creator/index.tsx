import { Head, Link, router } from '@inertiajs/react';
import { FileVideo } from 'lucide-react';
import { EntryCard } from '@/components/entries/entry-card';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { Entry, PaginatedData } from '@/types';

type Props = {
    entries: PaginatedData<Entry>;
    filters: { status: string };
    counts: Record<string, number>;
};

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

            <div className="px-4 py-6">
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
                    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                        {entries.data.map((entry) => (
                            <EntryCard
                                key={entry.id}
                                entry={entry}
                                href={`/entries/${entry.id}`}
                            />
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
