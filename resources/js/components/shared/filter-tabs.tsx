import { cn } from '@/lib/utils';

export type FilterTab = {
    key: string;
    label: string;
};

type Props = {
    tabs: FilterTab[];
    active: string;
    counts?: Record<string, number>;
    onChange: (key: string) => void;
    className?: string;
};

/**
 * Segmented status filter. Replaces the row of outline `Button`s each list page
 * hand-rolled — one track, a sliding active pill, and counts rendered as a
 * secondary chip rather than dimmed text.
 */
export function FilterTabs({
    tabs,
    active,
    counts,
    onChange,
    className,
}: Props) {
    return (
        <div
            className={cn(
                '-mx-1 flex snap-x gap-1 overflow-x-auto rounded-xl bg-muted/60 p-1',
                className,
            )}
        >
            {tabs.map((tab) => {
                const isActive = active === tab.key;
                const count = counts?.[tab.key];

                return (
                    <button
                        key={tab.key}
                        type="button"
                        onClick={() => onChange(tab.key)}
                        aria-pressed={isActive}
                        className={cn(
                            'flex shrink-0 snap-start items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap transition',
                            isActive
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground',
                        )}
                    >
                        {tab.label}
                        {count !== undefined && (
                            <span
                                className={cn(
                                    'rounded-full px-1.5 py-0.5 text-[11px] leading-none font-semibold tabular-nums',
                                    isActive
                                        ? 'bg-primary/10 text-primary'
                                        : 'bg-muted-foreground/10 text-muted-foreground',
                                )}
                            >
                                {count}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
