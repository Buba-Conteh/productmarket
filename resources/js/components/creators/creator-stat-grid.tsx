import { formatCompactNumber } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { CreatorSocialTotals } from '@/types/profile';

type Props = {
    totals: CreatorSocialTotals;
    /** `inline` for the card row, `tiles` for the boxed quick-view grid. */
    variant?: 'inline' | 'tiles';
    inverted?: boolean;
};

function creatorStats(totals: CreatorSocialTotals) {
    return [
        {
            key: 'followers',
            label: 'Followers',
            value: formatCompactNumber(totals.followers),
        },
        {
            key: 'likes',
            label: 'Likes',
            value: formatCompactNumber(totals.likes),
        },
        {
            key: 'engagement',
            label: 'Engagement',
            value:
                totals.engagement_rate !== null
                    ? `${totals.engagement_rate}%`
                    : '—',
        },
        {
            key: 'views',
            label: 'Campaign views',
            value: formatCompactNumber(totals.views),
        },
        {
            key: 'entries',
            label: 'Entries',
            value: String(totals.live_entries),
        },
    ];
}

/** The creator's headline numbers, combined across every connected platform. */
export function CreatorStatGrid({
    totals,
    variant = 'inline',
    inverted = false,
}: Props) {
    const stats = creatorStats(totals);

    if (variant === 'tiles') {
        return (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {stats.map((stat) => (
                    <div
                        key={stat.key}
                        className={cn(
                            'flex flex-col items-center gap-0.5 rounded-xl px-2 py-3 text-center',
                            inverted ? 'bg-white/10' : 'bg-muted/60',
                        )}
                    >
                        <span
                            className={cn(
                                'text-xs',
                                inverted
                                    ? 'text-white/75'
                                    : 'text-muted-foreground',
                            )}
                        >
                            {stat.label}
                        </span>
                        <span className="text-base font-semibold tabular-nums">
                            {stat.value}
                        </span>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <dl className="grid grid-cols-4 gap-2">
            {stats.slice(0, 4).map((stat) => (
                <div key={stat.key} className="min-w-0">
                    <dt className="truncate text-[11px] text-muted-foreground">
                        {stat.label}
                    </dt>
                    <dd className="text-sm font-semibold tabular-nums">
                        {stat.value}
                    </dd>
                </div>
            ))}
        </dl>
    );
}
