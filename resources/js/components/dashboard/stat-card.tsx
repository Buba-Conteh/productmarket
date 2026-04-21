import type { LucideIcon } from 'lucide-react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type StatCardProps = {
    label: string;
    value: string;
    delta?: string;
    trend?: 'up' | 'down' | 'flat';
    icon: LucideIcon;
    accent?: 'primary' | 'neutral';
};

export function StatCard({
    label,
    value,
    delta,
    trend = 'flat',
    icon: Icon,
    accent = 'neutral',
}: StatCardProps) {
    const TrendIcon =
        trend === 'down'
            ? ArrowDownRight
            : trend === 'up'
              ? ArrowUpRight
              : null;

    return (
        <div
            className={cn(
                'relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/80 bg-card p-5 shadow-sm transition hover:shadow-md',
                accent === 'primary' &&
                    'border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card',
            )}
        >
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                    {label}
                </span>
                <span
                    className={cn(
                        'flex size-9 items-center justify-center rounded-xl bg-muted text-muted-foreground',
                        accent === 'primary' && 'bg-primary/15 text-primary',
                    )}
                >
                    <Icon className="size-4" />
                </span>
            </div>

            <div className="mt-4 flex items-end justify-between gap-2">
                <span className="text-2xl font-semibold tracking-tight text-foreground">
                    {value}
                </span>
                {delta && (
                    <span
                        className={cn(
                            'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium',
                            trend === 'up' &&
                                'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
                            trend === 'down' &&
                                'bg-rose-500/10 text-rose-600 dark:text-rose-400',
                            trend === 'flat' &&
                                'bg-muted text-muted-foreground',
                        )}
                    >
                        {TrendIcon && <TrendIcon className="size-3" />}
                        {delta}
                    </span>
                )}
            </div>
        </div>
    );
}
