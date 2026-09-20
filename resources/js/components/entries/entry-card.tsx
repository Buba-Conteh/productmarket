import { Link } from '@inertiajs/react';
import { Calendar, Eye } from 'lucide-react';
import { CampaignThumbnail } from '@/components/campaigns/campaign-thumbnail';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Entry, EntryStatus } from '@/types';

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

type Props = {
    entry: Entry;
    href: string;
};

/** My-entries grid tile — campaign thumbnail, type/status badges, view count, bid info, platform badges. */
export function EntryCard({ entry, href }: Props) {
    const totalViews =
        entry.platforms?.reduce(
            (sum, p) => sum + (p.pivot?.verified_view_count ?? 0),
            0,
        ) ?? 0;

    return (
        <Link href={href} className="block">
            <Card className="h-full overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-lg">
                <CampaignThumbnail
                    thumbnailUrl={entry.campaign?.thumbnail_url}
                    title={entry.campaign?.title ?? 'Campaign'}
                    type={entry.type}
                    className="h-48"
                    initialClassName="text-5xl font-bold text-white/20"
                    topOverlay={
                        <>
                            <Badge
                                variant="secondary"
                                className="border-0 bg-black/50 text-white capitalize backdrop-blur-sm hover:bg-black/50"
                            >
                                {entry.type}
                            </Badge>
                            <span
                                className={cn(
                                    'rounded-full px-2.5 py-1 text-xs font-medium',
                                    STATUS_STYLES[entry.status],
                                )}
                            >
                                {STATUS_LABELS[entry.status]}
                            </span>
                        </>
                    }
                    bottomOverlay={
                        totalViews > 0 ? (
                            <span className="flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
                                <Eye className="size-3" />
                                {totalViews.toLocaleString()}
                            </span>
                        ) : undefined
                    }
                />

                <CardHeader className="pb-2">
                    <CardTitle className="line-clamp-1 text-lg">
                        {entry.campaign?.title ?? 'Campaign'}
                    </CardTitle>
                    {entry.campaign?.brand && (
                        <p className="text-sm text-muted-foreground">
                            by {entry.campaign.brand.company_name}
                        </p>
                    )}
                </CardHeader>
                <CardContent className="space-y-3">
                    {entry.pitch_details && (
                        <div className="flex items-center gap-1.5 text-sm">
                            <span className="text-muted-foreground">
                                Bid:
                            </span>
                            <span className="font-semibold text-green-600">
                                $
                                {Number(
                                    entry.pitch_details.proposed_bid,
                                ).toFixed(2)}
                            </span>
                            {entry.pitch_details.accepted_bid && (
                                <>
                                    <span className="text-muted-foreground">
                                        → Accepted:
                                    </span>
                                    <span className="font-semibold text-green-700">
                                        $
                                        {Number(
                                            entry.pitch_details.accepted_bid,
                                        ).toFixed(2)}
                                    </span>
                                </>
                            )}
                        </div>
                    )}

                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <Calendar className="size-3.5" />
                            {formatDate(entry.submitted_at ?? entry.created_at)}
                        </span>
                        {entry.platforms && entry.platforms.length > 0 && (
                            <span>
                                {entry.platforms.length} platform
                                {entry.platforms.length !== 1 ? 's' : ''}
                            </span>
                        )}
                    </div>

                    {entry.platforms && entry.platforms.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {entry.platforms.map((p) => (
                                <Badge
                                    key={p.id}
                                    variant="secondary"
                                    className="text-xs"
                                >
                                    {p.name}
                                </Badge>
                            ))}
                        </div>
                    )}

                    {entry.rejection_reason && (
                        <p className="line-clamp-2 rounded-md bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-950/30">
                            {entry.rejection_reason}
                        </p>
                    )}
                </CardContent>
            </Card>
        </Link>
    );
}
