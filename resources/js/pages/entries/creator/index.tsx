import { Head, Link, router } from '@inertiajs/react';
import { Compass, Eye, FileVideo, MessageCircle, Wallet } from 'lucide-react';
import { CampaignInvitationCard } from '@/components/entries/campaign-invitation-card';
import type { CampaignInvitation } from '@/components/entries/campaign-invitation-card';
import { EntryCard } from '@/components/entries/entry-card';
import Heading from '@/components/heading';
import { EmptyState } from '@/components/shared/empty-state';
import { FilterTabs } from '@/components/shared/filter-tabs';
import { FlashAlert } from '@/components/shared/flash-alert';
import { PaginationNav } from '@/components/shared/pagination-nav';
import { Button } from '@/components/ui/button';
import { formatCompactNumber } from '@/lib/format';
import type { Entry, PaginatedData } from '@/types';

type Summary = {
    total_views: number;
    total_comments: number;
    total_earned: string;
    pending_earnings: string;
};

type Props = {
    entries: PaginatedData<Entry>;
    filters: { status: string };
    counts: Record<string, number>;
    summary: Summary;
    invitations: CampaignInvitation[];
};

const TABS = [
    { key: 'all', label: 'All' },
    { key: 'draft', label: 'Drafts' },
    { key: 'pending_review', label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'live', label: 'Live' },
    { key: 'rejected', label: 'Rejected' },
];

function formatCurrency(value: string): string {
    return `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
}

export default function CreatorEntries({
    entries,
    filters,
    counts,
    summary,
    invitations,
}: Props) {
    function setFilter(status: string) {
        router.get(
            '/entries',
            { status },
            { preserveState: true, preserveScroll: true },
        );
    }

    const stats = [
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
            key: 'earned',
            icon: Wallet,
            label: 'Total earned',
            value: formatCurrency(summary.total_earned),
        },
        {
            key: 'pending',
            icon: FileVideo,
            label: 'Pending',
            value: formatCurrency(summary.pending_earnings),
        },
    ];

    return (
        <>
            <Head title="My Entries" />

            <div className="px-4 py-6">
                <FlashAlert />

                <Heading
                    title="My Entries"
                    description="Track your campaign submissions and the reach they earned"
                />

                {/* Portfolio summary */}
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

                {/* Brand invitations */}
                {invitations.length > 0 && (
                    <section className="mb-6 space-y-2.5">
                        <h3 className="text-sm font-medium text-muted-foreground">
                            Invitations ({invitations.length})
                        </h3>
                        {invitations.map((invitation) => (
                            <CampaignInvitationCard
                                key={invitation.id}
                                invitation={invitation}
                            />
                        ))}
                    </section>
                )}

                <FilterTabs
                    tabs={TABS}
                    active={filters.status}
                    counts={counts}
                    onChange={setFilter}
                    className="mb-6"
                />

                {/* Entries grid */}
                {entries.data.length === 0 ? (
                    <EmptyState
                        icon={FileVideo}
                        title={
                            filters.status === 'all'
                                ? 'No entries yet'
                                : 'Nothing in this status'
                        }
                        description="Browse live campaigns and submit your first entry to start earning."
                        action={
                            <Button asChild className="gap-1.5">
                                <Link href="/discover">
                                    <Compass className="size-4" />
                                    Browse campaigns
                                </Link>
                            </Button>
                        }
                    />
                ) : (
                    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {entries.data.map((entry) => (
                            <EntryCard
                                key={entry.id}
                                entry={entry}
                                href={`/entries/${entry.id}`}
                            />
                        ))}
                    </div>
                )}

                <PaginationNav meta={entries} />
            </div>
        </>
    );
}

CreatorEntries.layout = {
    breadcrumbs: [{ title: 'My Entries', href: '/entries' }],
};
