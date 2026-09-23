import { ExternalLink, Eye, Heart, MessageCircle, Play } from 'lucide-react';
import { formatCompactNumber } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { PlatformVideoItem } from '@/types/profile';

/** Seconds to m:ss. */
export function formatDuration(seconds: number | null): string | null {
    if (seconds === null || seconds <= 0) {
        return null;
    }

    const m = Math.floor(seconds / 60);
    const s = seconds % 60;

    return `${m}:${String(s).padStart(2, '0')}`;
}

type Props = {
    video: PlatformVideoItem;
    platformSlug: string;
};

/**
 * One video from a connected platform. The thumbnail links out to the original
 * post — we hold a cover image and counts, not the video file itself, so there
 * is nothing to play in place.
 */
export function PlatformVideoCard({ video, platformSlug }: Props) {
    const duration = formatDuration(video.duration_sec);

    const stats = [
        video.view_count > 0
            ? {
                  key: 'views',
                  icon: Eye,
                  value: formatCompactNumber(video.view_count),
              }
            : null,
        video.like_count > 0
            ? {
                  key: 'likes',
                  icon: Heart,
                  value: formatCompactNumber(video.like_count),
              }
            : null,
        video.comment_count > 0
            ? {
                  key: 'comments',
                  icon: MessageCircle,
                  value: formatCompactNumber(video.comment_count),
              }
            : null,
    ].filter((s) => s !== null);

    return (
        <a
            href={video.share_url ?? '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="group w-[168px] shrink-0 snap-start focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
            <div className="relative aspect-[9/16] overflow-hidden rounded-xl border bg-muted">
                {video.thumbnail_url ? (
                    <img
                        src={video.thumbnail_url}
                        alt={video.title ?? `${platformSlug} video`}
                        loading="lazy"
                        className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                ) : (
                    <div className="flex size-full items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/20">
                        <Play className="size-8 text-muted-foreground" />
                    </div>
                )}

                {/* Hover affordance */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100">
                    <span className="flex size-10 items-center justify-center rounded-full bg-white/90 text-black">
                        <ExternalLink className="size-4" />
                    </span>
                </div>

                {duration && (
                    <span className="absolute right-1.5 bottom-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white tabular-nums">
                        {duration}
                    </span>
                )}
            </div>

            <div className="mt-2 space-y-1">
                {video.title && (
                    <p className="line-clamp-2 text-xs leading-snug font-medium">
                        {video.title}
                    </p>
                )}

                {stats.length > 0 && (
                    <div
                        className={cn(
                            'flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] text-muted-foreground',
                        )}
                    >
                        {stats.map((stat) => (
                            <span
                                key={stat.key}
                                className="flex items-center gap-0.5 tabular-nums"
                            >
                                <stat.icon className="size-3" />
                                {stat.value}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </a>
    );
}
