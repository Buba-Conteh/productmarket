import { Link } from '@inertiajs/react';
import {
    Eye,
    Heart,
    MapPin,
    MessageCircle,
    Send,
    TrendingUp,
    Users,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatCompactNumber } from '@/lib/format';
import type { CreatorSearchResult } from '@/types/profile';
import { PlatformReachRow } from './platform-reach-row';

type Props = {
    creator: CreatorSearchResult;
    /** Opens the invite dialog. Omitted when the brand has no live campaigns. */
    onInvite?: () => void;
    /** True when a pending invitation already exists for every live campaign. */
    fullyInvited?: boolean;
};

function initials(name: string): string {
    return name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
}

/**
 * Directory tile: combined reach across every connected platform up top, the
 * per-platform breakdown below, then the invite action.
 */
export function CreatorDirectoryCard({
    creator,
    onInvite,
    fullyInvited = false,
}: Props) {
    const { totals } = creator;

    const headline = [
        {
            key: 'followers',
            icon: Users,
            label: 'Followers',
            value: formatCompactNumber(totals.followers),
        },
        {
            key: 'likes',
            icon: Heart,
            label: 'Likes',
            value: formatCompactNumber(totals.likes),
        },
        {
            key: 'comments',
            icon: MessageCircle,
            label: 'Comments',
            value: formatCompactNumber(totals.comments),
        },
    ];

    return (
        <Card className="flex h-full flex-col overflow-hidden transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg">
            <CardContent className="flex flex-1 flex-col gap-4 p-5">
                {/* Identity */}
                <div className="flex items-start gap-3">
                    <Avatar className="size-11 shrink-0 ring-2 ring-border">
                        <AvatarImage
                            src={creator.user.avatar ?? undefined}
                            alt={creator.display_name}
                        />
                        <AvatarFallback className="text-xs font-semibold">
                            {initials(creator.display_name)}
                        </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1">
                        <Link
                            href={`/creators/${creator.id}`}
                            className="line-clamp-1 font-semibold hover:underline"
                        >
                            {creator.display_name}
                        </Link>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                            {creator.user.country && (
                                <span className="flex items-center gap-1">
                                    <MapPin className="size-3" />
                                    {creator.user.country}
                                </span>
                            )}
                            {totals.engagement_rate !== null && (
                                <span className="flex items-center gap-1">
                                    <TrendingUp className="size-3" />
                                    {totals.engagement_rate}% engagement
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Combined reach across all connected platforms */}
                <div className="grid grid-cols-3 gap-px overflow-hidden rounded-xl bg-border">
                    {headline.map((stat) => (
                        <div
                            key={stat.key}
                            className="flex flex-col items-center gap-0.5 bg-card px-2 py-2.5"
                        >
                            <span className="flex items-center gap-1 text-[10px] tracking-wide text-muted-foreground uppercase">
                                <stat.icon className="size-3" />
                                {stat.label}
                            </span>
                            <span className="text-sm font-semibold tabular-nums">
                                {stat.value}
                            </span>
                        </div>
                    ))}
                </div>

                {creator.niches.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {creator.niches.slice(0, 3).map((n) => (
                            <Badge
                                key={n.id}
                                variant="secondary"
                                className="text-xs"
                            >
                                {n.name}
                            </Badge>
                        ))}
                        {creator.niches.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                                +{creator.niches.length - 3}
                            </Badge>
                        )}
                    </div>
                )}

                {creator.bio && (
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                        {creator.bio}
                    </p>
                )}

                {/* Per-platform breakdown */}
                <div className="space-y-1.5">
                    {creator.social_accounts.length > 0 ? (
                        creator.social_accounts.map((account) => (
                            <PlatformReachRow
                                key={account.platform.slug}
                                account={account}
                            />
                        ))
                    ) : (
                        <p className="rounded-lg border border-dashed px-2.5 py-2 text-xs text-muted-foreground">
                            No connected platforms yet
                        </p>
                    )}
                </div>

                {/* Campaign track record */}
                <div className="mt-auto flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                        <Eye className="size-3" />
                        {formatCompactNumber(totals.views)} campaign views
                    </span>
                    <span>
                        {totals.live_entries} entr
                        {totals.live_entries === 1 ? 'y' : 'ies'}
                    </span>
                </div>

                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="flex-1"
                    >
                        <Link href={`/creators/${creator.id}`}>
                            View profile
                        </Link>
                    </Button>
                    {onInvite && (
                        <Button
                            size="sm"
                            onClick={onInvite}
                            disabled={fullyInvited}
                            className="flex-1 gap-1.5"
                        >
                            <Send className="size-3.5" />
                            {fullyInvited ? 'Invited' : 'Invite'}
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
