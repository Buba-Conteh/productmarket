import { Eye, Play } from 'lucide-react';
import { useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { campaignTypeLabel } from '@/lib/campaign-type';
import { formatCompactNumber } from '@/lib/format';
import type { EntryVideoItem } from '@/types/profile';
import { formatDuration } from './platform-video-card';

/**
 * A video produced through a ProductMarket campaign. The file is in our own
 * bucket, so unlike the platform rails this one plays in place.
 *
 * `preload="none"` keeps a rail of these from pulling down several videos on
 * page load — the first frame arrives only once someone presses play.
 */
export function EntryVideoCard({ video }: { video: EntryVideoItem }) {
    const ref = useRef<HTMLVideoElement>(null);
    const [playing, setPlaying] = useState(false);
    const duration = formatDuration(video.duration_sec);

    function play() {
        setPlaying(true);
        // The element only exists once `playing` flips, so defer the call.
        requestAnimationFrame(() => void ref.current?.play());
    }

    return (
        <div className="w-[168px] shrink-0 snap-start">
            <div className="relative aspect-[9/16] overflow-hidden rounded-xl border bg-black">
                {playing ? (
                    <video
                        ref={ref}
                        src={video.video_url ?? undefined}
                        controls
                        playsInline
                        preload="none"
                        className="size-full object-contain"
                        onEnded={() => setPlaying(false)}
                    />
                ) : (
                    <button
                        type="button"
                        onClick={play}
                        aria-label={`Play ${video.campaign_title ?? 'entry video'}`}
                        className="group size-full bg-gradient-to-br from-primary/25 via-muted to-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    >
                        <span className="flex size-full items-center justify-center">
                            <span className="flex size-11 items-center justify-center rounded-full bg-white/90 text-black shadow-lg transition group-hover:scale-110">
                                <Play className="size-5 translate-x-px fill-current" />
                            </span>
                        </span>
                    </button>
                )}

                {duration && !playing && (
                    <span className="absolute right-1.5 bottom-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white tabular-nums">
                        {duration}
                    </span>
                )}
            </div>

            <div className="mt-2 space-y-1">
                <p className="line-clamp-1 text-xs font-medium">
                    {video.campaign_title ?? 'Campaign entry'}
                </p>

                <div className="flex items-center gap-1.5">
                    {video.campaign_type && (
                        <Badge
                            variant="secondary"
                            className="px-1.5 py-0 text-[10px]"
                        >
                            {campaignTypeLabel(video.campaign_type)}
                        </Badge>
                    )}
                    {video.view_count > 0 && (
                        <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground tabular-nums">
                            <Eye className="size-3" />
                            {formatCompactNumber(video.view_count)}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
