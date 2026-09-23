import { Link } from '@inertiajs/react';
import { Calendar, Eye } from 'lucide-react';
import { CampaignThumbnail } from '@/components/campaigns/campaign-thumbnail';
import { EntryStatusBadge } from '@/components/entries/entry-status-badge';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Entry } from '@/types';

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
                            {/* Solid backing so the tinted chip stays legible
                                over an arbitrary thumbnail image. */}
                            <span className="rounded-full bg-background/90 backdrop-blur-sm">
                                <EntryStatusBadge status={entry.status} />
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
                            <span className="text-muted-foreground">Bid:</span>
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
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
                                    <span className="font-semibold text-emerald-700 dark:text-emerald-300">
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
                        <p className="line-clamp-2 rounded-md bg-rose-500/10 px-3 py-2 text-xs text-rose-700 dark:text-rose-400">
                            {entry.rejection_reason}
                        </p>
                    )}
                </CardContent>
            </Card>
        </Link>
    );
}
