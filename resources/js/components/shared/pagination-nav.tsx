import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import type { PaginatedData } from '@/types';

type Props = {
    /** Any paginator — only `links`, `last_page`, `from`, `to` and `total` are read. */
    meta: Pick<
        PaginatedData<unknown>,
        'links' | 'last_page' | 'from' | 'to' | 'total'
    >;
    /** Preserve component state across the page change (filters, scroll position). */
    preserveState?: boolean;
};

/**
 * Shared paginator with a result-range summary. Replaces the nine near-identical
 * `links.map(...)` blocks that were copied across the list pages.
 */
export function PaginationNav({ meta, preserveState = true }: Props) {
    if (meta.last_page <= 1) {
        return null;
    }

    return (
        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t pt-4 sm:flex-row">
            <p className="text-sm text-muted-foreground">
                Showing{' '}
                <span className="font-medium text-foreground">
                    {meta.from ?? 0}–{meta.to ?? 0}
                </span>{' '}
                of{' '}
                <span className="font-medium text-foreground">
                    {meta.total}
                </span>
            </p>

            <div className="flex flex-wrap items-center justify-center gap-1">
                {meta.links.map((link, i) => (
                    <Button
                        key={i}
                        variant={link.active ? 'default' : 'ghost'}
                        size="sm"
                        className="min-w-9"
                        disabled={!link.url}
                        onClick={() => {
                            if (link.url) {
                                router.get(link.url, {}, { preserveState });
                            }
                        }}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                ))}
            </div>
        </div>
    );
}
