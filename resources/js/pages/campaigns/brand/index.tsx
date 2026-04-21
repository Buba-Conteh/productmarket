import { Head, Link, router } from '@inertiajs/react';
import { Calendar, Eye, Plus, Users } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import type { Campaign, CampaignStatus, PaginatedData } from '@/types';

type Props = {
    campaigns: PaginatedData<Campaign>;
    filters: { status: string };
    counts: Record<string, number>;
};

const STATUS_TABS: { key: string; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'draft', label: 'Drafts' },
    { key: 'active', label: 'Active' },
    { key: 'closed', label: 'Closed' },
    { key: 'completed', label: 'Completed' },
];

const STATUS_STYLES: Record<CampaignStatus, string> = {
    draft: 'bg-muted text-muted-foreground',
    pending_escrow: 'bg-yellow-100 text-yellow-700',
    active: 'bg-green-100 text-green-700',
    closed: 'bg-orange-100 text-orange-700',
    completed: 'bg-blue-100 text-blue-700',
    cancelled: 'bg-red-100 text-red-700',
};

const TYPE_LABELS: Record<string, string> = {
    contest: 'Contest',
    ripple: 'Ripple',
    pitch: 'Pitch',
};

function formatDate(date: string | null): string {
    if (!date) {
        return '—';
    }

    return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

export default function BrandCampaignIndex({
    campaigns,
    filters,
    counts,
}: Props) {
    function filterByStatus(status: string) {
        router.get('/campaigns', { status }, { preserveState: true });
    }

    return (
        <>
            <Head title="Campaigns" />

            <div className="px-4 py-6">
                <div className="mb-6 flex items-center justify-between">
                    <Heading
                        title="Campaigns"
                        description="Manage your brand campaigns"
                    />
                    <Button asChild className="gap-2">
                        <Link href="/campaigns/create">
                            <Plus className="size-4" />
                            New campaign
                        </Link>
                    </Button>
                </div>

                {/* Status tabs */}
                <div className="mb-6 flex gap-1 rounded-lg border p-1">
                    {STATUS_TABS.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => filterByStatus(tab.key)}
                            className={cn(
                                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                                filters.status === tab.key
                                    ? 'bg-foreground text-background'
                                    : 'text-muted-foreground hover:text-foreground',
                            )}
                        >
                            {tab.label}
                            {counts[tab.key] !== undefined && (
                                <span className="ml-1.5 text-xs opacity-70">
                                    {counts[tab.key]}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Campaign grid */}
                {campaigns.data.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
                            <Eye className="size-10 text-muted-foreground" />
                            <div>
                                <p className="font-medium">No campaigns yet</p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Create your first campaign to start
                                    connecting with creators.
                                </p>
                            </div>
                            <Button asChild className="gap-2">
                                <Link href="/campaigns/create">
                                    <Plus className="size-4" />
                                    Create campaign
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {campaigns.data.map((campaign) => (
                            <Link
                                key={campaign.id}
                                href={
                                    campaign.status === 'draft'
                                        ? `/campaigns/${campaign.id}/edit`
                                        : `/campaigns/${campaign.id}`
                                }
                                className="block"
                            >
                                <Card className="h-full transition-shadow hover:shadow-md">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="space-y-1">
                                                <CardTitle className="line-clamp-1 text-base">
                                                    {campaign.title}
                                                </CardTitle>
                                                <CardDescription className="flex items-center gap-2">
                                                    <Badge
                                                        variant="outline"
                                                        className="text-xs"
                                                    >
                                                        {TYPE_LABELS[
                                                            campaign.type
                                                        ] ?? campaign.type}
                                                    </Badge>
                                                </CardDescription>
                                            </div>
                                            <span
                                                className={cn(
                                                    'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium',
                                                    STATUS_STYLES[
                                                        campaign.status
                                                    ] ??
                                                        'bg-muted text-muted-foreground',
                                                )}
                                            >
                                                {campaign.status.replace(
                                                    '_',
                                                    ' ',
                                                )}
                                            </span>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Users className="size-3.5" />
                                                {campaign.entries_count ??
                                                    0}{' '}
                                                entries
                                            </span>
                                            {campaign.deadline && (
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="size-3.5" />
                                                    {formatDate(
                                                        campaign.deadline,
                                                    )}
                                                </span>
                                            )}
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

BrandCampaignIndex.layout = {
    breadcrumbs: [{ title: 'Campaigns', href: '/campaigns' }],
};
