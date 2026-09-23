import { BadgeCheck, Heart, PlaySquare, Users } from 'lucide-react';
import { formatCompactNumber } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { SocialAccountSummary } from '@/types/profile';

/** Brand tint per platform so the three rows are scannable at a glance. */
const PLATFORM_TONES: Record<string, string> = {
    tiktok: 'bg-foreground/10 text-foreground',
    instagram:
        'bg-gradient-to-br from-fuchsia-500/20 to-orange-400/20 text-fuchsia-700 dark:text-fuchsia-300',
    youtube: 'bg-red-500/15 text-red-700 dark:text-red-400',
};

function platformTone(slug: string): string {
    return PLATFORM_TONES[slug] ?? 'bg-muted text-muted-foreground';
}

/**
 * One connected platform's verified reach. Metrics a platform doesn't expose
 * are omitted rather than shown as zero.
 */
export function PlatformReachRow({
    account,
}: {
    account: SocialAccountSummary;
}) {
    return (
        <div className="flex items-center gap-3 rounded-lg border bg-card/50 px-2.5 py-2">
            <span
                className={cn(
                    'flex size-7 shrink-0 items-center justify-center rounded-md text-[10px] font-bold uppercase',
                    platformTone(account.platform.slug),
                )}
            >
                {account.platform.name.slice(0, 2)}
            </span>

            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                    <span className="truncate text-xs font-medium">
                        @{account.handle}
                    </span>
                    {account.verified && (
                        <BadgeCheck className="size-3 shrink-0 text-primary" />
                    )}
                </div>
                <span className="text-[11px] text-muted-foreground">
                    {account.platform.name}
                </span>
            </div>

            <div className="flex shrink-0 items-center gap-2.5 text-xs tabular-nums">
                <span
                    className="flex items-center gap-1"
                    title="Followers"
                    aria-label={`${account.follower_count} followers`}
                >
                    <Users className="size-3 text-muted-foreground" />
                    <span className="font-semibold">
                        {formatCompactNumber(account.follower_count)}
                    </span>
                </span>
                {!!account.total_likes && (
                    <span
                        className="flex items-center gap-1"
                        title="Likes"
                        aria-label={`${account.total_likes} likes`}
                    >
                        <Heart className="size-3 text-muted-foreground" />
                        <span className="font-semibold">
                            {formatCompactNumber(account.total_likes)}
                        </span>
                    </span>
                )}
                {!!account.post_count && (
                    <span
                        className="flex items-center gap-1"
                        title="Posts"
                        aria-label={`${account.post_count} posts`}
                    >
                        <PlaySquare className="size-3 text-muted-foreground" />
                        <span className="font-semibold">
                            {formatCompactNumber(account.post_count)}
                        </span>
                    </span>
                )}
            </div>
        </div>
    );
}
