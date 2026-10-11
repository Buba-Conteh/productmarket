import { Eye, Play } from 'lucide-react';
import { formatDuration } from '@/components/videos/platform-video-card';
import { formatCompactNumber } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { FeaturedVideo } from '@/types/profile';
import { PlatformChip } from './platform-chip';

type Props = {
    video: FeaturedVideo;
    onClick: () => void;
    className?: string;
};

/**
 * A 9:16 tile in a creator's featured reel. Opens the video browser rather
 * than linking out, so the brand stays in the directory.
 */
export function FeaturedVideoThumb({ video, onClick, className }: Props) {
    const duration = formatDuration(video.duration_sec);

    return (
        <button
            type="button"
            onClick={(e) => {
                // Cards open the quick view on click — keep the two apart.
                e.stopPropagation();
                onClick();
            }}
            aria-label={`Play ${video.title ?? 'video'}`}
            className={cn(
                'group relative aspect-[9/16] w-full overflow-hidden rounded-xl bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                className,
            )}
        >
            {video.thumbnail_url ? (
                <img
                    src={video.thumbnail_url}
                    alt=""
                    loading="lazy"
                    className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
            ) : (
                <span className="flex size-full items-center justify-center bg-gradient-to-br from-primary/30 via-muted to-muted" />
            )}

            <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/25">
                <span className="flex size-9 items-center justify-center rounded-full bg-white/90 text-black opacity-0 shadow-lg transition group-hover:opacity-100">
                    <Play className="size-4 translate-x-px fill-current" />
                </span>
            </span>

            {video.platform && (
                <PlatformChip
                    slug={video.platform}
                    className="absolute top-1.5 left-1.5 size-5 bg-black/60 text-[8px] text-white backdrop-blur"
                />
            )}

            <span className="absolute inset-x-1.5 bottom-1.5 flex items-center justify-between text-[10px] font-medium text-white">
                {video.view_count > 0 ? (
                    <span className="flex items-center gap-0.5 rounded bg-black/60 px-1 py-0.5 tabular-nums">
                        <Eye className="size-2.5" />
                        {formatCompactNumber(video.view_count)}
                    </span>
                ) : (
                    <span />
                )}
                {duration && (
                    <span className="rounded bg-black/60 px-1 py-0.5 tabular-nums">
                        {duration}
                    </span>
                )}
            </span>
        </button>
    );
}
