import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Props = {
    title: ReactNode;
    /** Right-aligned slot for a handle, count or link. */
    meta?: ReactNode;
    children: ReactNode;
    className?: string;
};

/**
 * Horizontally scrolling rail of video tiles.
 *
 * Scrolling is native (with snap points) so touch and trackpad behave the way
 * people expect; the arrow buttons are an addition for mouse users and hide
 * themselves when there is nothing to scroll to in that direction.
 */
export function VideoRail({ title, meta, children, className }: Props) {
    const scroller = useRef<HTMLDivElement>(null);
    const [atStart, setAtStart] = useState(true);
    const [atEnd, setAtEnd] = useState(true);

    const updateArrows = useCallback(() => {
        const el = scroller.current;

        if (!el) {
            return;
        }

        // 1px of slack — sub-pixel widths otherwise leave the end arrow enabled.
        setAtStart(el.scrollLeft <= 1);
        setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 1);
    }, []);

    useEffect(() => {
        updateArrows();

        const el = scroller.current;

        if (!el) {
            return;
        }

        const observer = new ResizeObserver(updateArrows);

        observer.observe(el);

        return () => observer.disconnect();
    }, [updateArrows, children]);

    function scrollBy(direction: 1 | -1) {
        const el = scroller.current;

        if (!el) {
            return;
        }

        el.scrollBy({
            left: direction * Math.max(el.clientWidth * 0.8, 240),
            behavior: 'smooth',
        });
    }

    return (
        <section className={cn('space-y-3', className)}>
            <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">{title}</div>

                <div className="flex shrink-0 items-center gap-2">
                    {meta}
                    <div className="hidden gap-1 sm:flex">
                        <Button
                            variant="outline"
                            size="icon"
                            className="size-8"
                            aria-label="Scroll left"
                            disabled={atStart}
                            onClick={() => scrollBy(-1)}
                        >
                            <ChevronLeft className="size-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="size-8"
                            aria-label="Scroll right"
                            disabled={atEnd}
                            onClick={() => scrollBy(1)}
                        >
                            <ChevronRight className="size-4" />
                        </Button>
                    </div>
                </div>
            </div>

            <div
                ref={scroller}
                onScroll={updateArrows}
                className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-1 pb-2 [scrollbar-width:thin]"
            >
                {children}
            </div>
        </section>
    );
}
