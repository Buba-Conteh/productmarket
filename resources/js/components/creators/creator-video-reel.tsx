import { ChevronDown, ChevronUp, Film } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef } from 'react';
import { useArrowKeys } from '@/hooks/use-arrow-keys';
import type { FeaturedVideo } from '@/types/profile';
import { FeaturedVideoPlayer, VideoPoster } from './featured-video-player';

type Props = {
    videos: FeaturedVideo[];
    /** Applied on mount only — key the reel by creator to reset it. */
    initialIndex: number;
    activeIndex: number;
    onActiveChange: (index: number) => void;
    keyboardPaused?: boolean;
};

/**
 * One creator's videos as a vertical, snap-scrolling reel. Scroll, the arrow
 * buttons or the up/down keys move between clips; only the clip in view
 * mounts a player, so off-screen embeds never load or keep playing.
 */
export function CreatorVideoReel({
    videos,
    initialIndex,
    activeIndex,
    onActiveChange,
    keyboardPaused = false,
}: Props) {
    const scroller = useRef<HTMLDivElement>(null);
    const initial = useRef(initialIndex);
    const activeIndexRef = useRef(initialIndex);

    useEffect(() => {
        activeIndexRef.current = activeIndex;
    }, [activeIndex]);

    useLayoutEffect(() => {
        const el = scroller.current;

        if (el) {
            el.scrollTop = initial.current * el.clientHeight;
        }
    }, []);

    // Keep the active slide aligned if the viewport is resized mid-reel.
    useEffect(() => {
        const el = scroller.current;

        if (!el) {
            return;
        }

        const observer = new ResizeObserver(() => {
            el.scrollTop = activeIndexRef.current * el.clientHeight;
        });
        observer.observe(el);

        return () => observer.disconnect();
    }, []);

    function goTo(index: number) {
        const el = scroller.current;

        if (!el || index < 0 || index >= videos.length) {
            return;
        }

        el.scrollTo({ top: index * el.clientHeight, behavior: 'smooth' });
    }

    function handleScroll() {
        const el = scroller.current;

        if (!el || el.clientHeight === 0) {
            return;
        }

        const index = Math.round(el.scrollTop / el.clientHeight);

        if (index !== activeIndexRef.current) {
            onActiveChange(index);
        }
    }

    useArrowKeys(
        {
            up: () => goTo(activeIndexRef.current - 1),
            down: () => goTo(activeIndexRef.current + 1),
        },
        !keyboardPaused,
    );

    if (videos.length === 0) {
        return (
            <div className="flex size-full flex-col items-center justify-center gap-2 rounded-xl bg-muted text-sm text-muted-foreground">
                <Film className="size-6" />
                No videos synced yet
            </div>
        );
    }

    // Fills the frame the parent gives it; the video area itself stays black
    // in both themes, as any player does.
    return (
        <div className="relative size-full">
            <div
                ref={scroller}
                onScroll={handleScroll}
                className="size-full snap-y snap-mandatory overflow-y-auto overscroll-contain rounded-xl bg-black [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
                {videos.map((video, index) => (
                    <div
                        key={video.id}
                        className="h-full snap-start snap-always"
                    >
                        {index === activeIndex ? (
                            <FeaturedVideoPlayer video={video} />
                        ) : (
                            <button
                                type="button"
                                onClick={() => goTo(index)}
                                aria-label={`Go to video ${index + 1}`}
                                className="size-full"
                            >
                                <VideoPoster video={video} />
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {/* Sits on the video, clear of the embed's own bottom controls */}
            <div className="absolute top-1/2 right-2 flex -translate-y-1/2 flex-col gap-2">
                <ReelButton
                    label="Previous video"
                    disabled={activeIndex === 0}
                    onClick={() => goTo(activeIndex - 1)}
                >
                    <ChevronUp className="size-5" />
                </ReelButton>
                <ReelButton
                    label="Next video"
                    disabled={activeIndex >= videos.length - 1}
                    onClick={() => goTo(activeIndex + 1)}
                >
                    <ChevronDown className="size-5" />
                </ReelButton>
            </div>
        </div>
    );
}

function ReelButton({
    label,
    disabled,
    onClick,
    children,
}: {
    label: string;
    disabled: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            aria-label={label}
            disabled={disabled}
            onClick={onClick}
            className="flex size-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition hover:bg-black/70 disabled:pointer-events-none disabled:opacity-0"
        >
            {children}
        </button>
    );
}
