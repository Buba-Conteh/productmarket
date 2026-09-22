import { BadgeCheck, Globe } from 'lucide-react';
import { formatCompactNumber } from '@/lib/format';
import type { SocialAccountSummary } from '@/types/profile';

type Props = {
    account: SocialAccountSummary;
};

type Metric = { key: string; value: string; label: string };

function metricsFor(account: SocialAccountSummary): Metric[] {
    const metrics: Metric[] = [
        {
            key: 'followers',
            value: formatCompactNumber(account.follower_count),
            label: 'Followers',
        },
    ];

    if (account.total_likes) {
        metrics.push({
            key: 'likes',
            value: formatCompactNumber(account.total_likes),
            label: 'Likes',
        });
    }

    if (account.post_count) {
        metrics.push({
            key: 'posts',
            value: formatCompactNumber(account.post_count),
            label: 'Posts',
        });
    }

    if (account.avg_views) {
        metrics.push({
            key: 'avg-views',
            value: formatCompactNumber(account.avg_views),
            label: 'Avg Views',
        });
    }

    if (account.engagement_rate && Number(account.engagement_rate) > 0) {
        metrics.push({
            key: 'engagement',
            value: `${Number(account.engagement_rate)}%`,
            label: 'Engagement',
        });
    }

    return metrics;
}

/**
 * One connected platform account with the metrics queried from that platform.
 */
export function ConnectedAccountRow({ account }: Props) {
    return (
        <div className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
            <div className="flex items-center gap-3">
                <Globe className="size-4 text-muted-foreground" />
                <div>
                    <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium">
                            {account.platform.name}
                        </p>
                        {account.verified && (
                            <BadgeCheck
                                className="size-3.5 text-emerald-600"
                                aria-label="Verified by platform"
                            />
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        @{account.handle}
                    </p>
                </div>
            </div>

            <div className="flex gap-6 text-right text-sm">
                {metricsFor(account).map((metric) => (
                    <div key={metric.key}>
                        <p className="font-semibold">{metric.value}</p>
                        <p className="text-xs text-muted-foreground">
                            {metric.label}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
