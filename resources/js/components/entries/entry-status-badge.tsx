import { entryStatusLabel, entryStatusStyle } from '@/lib/entry-status';
import { cn } from '@/lib/utils';

type Props = {
    status: string;
    className?: string;
    /** `sm` is the in-row chip; `md` is the page-header chip. */
    size?: 'sm' | 'md';
};

/**
 * The entry status chip. Every entry surface renders through this so the tone
 * scale can't drift, and so dark mode is handled in one place.
 */
export function EntryStatusBadge({ status, className, size = 'sm' }: Props) {
    return (
        <span
            className={cn(
                'inline-flex shrink-0 items-center rounded-full font-medium ring-1 ring-inset',
                size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm',
                entryStatusStyle(status),
                className,
            )}
        >
            {entryStatusLabel(status)}
        </span>
    );
}
