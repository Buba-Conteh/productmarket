import { Clock, Heart, PlaySquare, TrendingUp, Users } from 'lucide-react';
import { formatCompactNumber } from '@/lib/format';
import type { SocialAccountSummary } from '@/types/profile';

type Props = {
    account: Pick<
        SocialAccountSummary,
        | 'follower_count'
        | 'avg_views'
        | 'total_likes'
        | 'post_count'
        | 'engagement_rate'
        | 'last_synced_at'
    >;
    /** Show the "Synced x ago" chip. Off by default — public profiles don't need it. */
    showSyncedAt?: boolean;
};

type Chip = {
    key: string;
    icon: typeof Users;
    label: string;
};

/**
 * The verified metrics pulled from a connected platform account. Any metric a
 * platform doesn't expose is omitted rather than rendered as zero.
 */
export function SocialStatChips({ account, showSyncedAt = false }: Props) {
    const chips: Chip[] = [
        {
            key: 'followers',
            icon: Users,
            label: `${formatCompactNumber(account.follower_count)} followers`,
        },
    ];

    if (account.total_likes) {
        chips.push({
            key: 'likes',
            icon: Heart,
            label: `${formatCompactNumber(account.total_likes)} likes`,
        });
    }

    if (account.post_count) {
        chips.push({
            key: 'posts',
            icon: PlaySquare,
            label: `${formatCompactNumber(account.post_count)} posts`,
        });
    }

    if (account.avg_views) {
        chips.push({
            key: 'avg-views',
            icon: TrendingUp,
            label: `~${formatCompactNumber(account.avg_views)} avg views`,
        });
    }

    if (account.engagement_rate && Number(account.engagement_rate) > 0) {
        chips.push({
            key: 'engagement',
            icon: TrendingUp,
            label: `${Number(account.engagement_rate)}% engagement`,
        });
    }

    if (showSyncedAt && account.last_synced_at) {
        chips.push({
            key: 'synced',
            icon: Clock,
            label: `Synced ${account.last_synced_at}`,
        });
    }

    return (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            {chips.map((chip) => (
                <span key={chip.key} className="flex items-center gap-1">
                    <chip.icon className="size-3" />
                    {chip.label}
                </span>
            ))}
        </div>
    );
}
