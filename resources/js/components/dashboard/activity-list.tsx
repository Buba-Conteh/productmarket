import type { LucideIcon } from 'lucide-react';

export type ActivityItem = {
    id: string;
    title: string;
    description: string;
    meta: string;
    icon: LucideIcon;
    tone?: 'primary' | 'success' | 'neutral';
};

const toneMap: Record<NonNullable<ActivityItem['tone']>, string> = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    neutral: 'bg-muted text-muted-foreground',
};

type ActivityListProps = {
    title: string;
    items: ActivityItem[];
    action?: React.ReactNode;
};

export function ActivityList({ title, items, action }: ActivityListProps) {
    return (
        <div className="flex h-full flex-col rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold tracking-tight">
                    {title}
                </h3>
                {action}
            </div>

            <ul className="mt-4 space-y-3">
                {items.map((item) => {
                    const tone = toneMap[item.tone ?? 'neutral'];
                    const Icon = item.icon;

                    return (
                        <li
                            key={item.id}
                            className="flex items-start gap-3 rounded-xl border border-transparent p-2 transition hover:border-border hover:bg-muted/40"
                        >
                            <span
                                className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${tone}`}
                            >
                                <Icon className="size-4" />
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-foreground">
                                    {item.title}
                                </p>
                                <p className="truncate text-xs text-muted-foreground">
                                    {item.description}
                                </p>
                            </div>
                            <span className="shrink-0 text-xs text-muted-foreground">
                                {item.meta}
                            </span>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
