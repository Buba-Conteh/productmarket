import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
    side: 'left' | 'right';
    /** Omitted at either end of the results — the arrow hides itself. */
    onClick?: () => void;
    label: string;
};

/**
 * Previous/next-creator control for the directory popups. Sits outside the
 * panel on wider screens and tucks inside its edge on phones.
 */
export function CreatorNavArrow({ side, onClick, label }: Props) {
    const Icon = side === 'left' ? ChevronLeft : ChevronRight;

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={!onClick}
            aria-label={label}
            className={cn(
                'absolute top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-background shadow-lg transition hover:bg-accent disabled:pointer-events-none disabled:opacity-0 dark:ring-1 dark:ring-white/10',
                side === 'left' ? 'left-1 sm:-left-14' : 'right-1 sm:-right-14',
            )}
        >
            <Icon className="size-5" />
        </button>
    );
}
