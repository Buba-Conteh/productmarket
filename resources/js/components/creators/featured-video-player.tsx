import { ExternalLink, Play } from 'lucide-react';
import type { FeaturedVideo } from '@/types/profile';
import { platformLabel } from './platform-chip';

/** YouTube needs explicit params to autoplay and stay on-channel. */
function embedSrc(video: FeaturedVideo): string | null {
    if (!video.embed_url) {
        return null;
    }

    return video.platform === 'youtube'
        ? `${video.embed_url}?autoplay=1&rel=0&playsinline=1`
        : video.embed_url;
}

/**
 * Plays one featured video: our own uploads in a native player, platform
 * videos through the platform's official embed, and anything unembeddable as
 * its cover with a link out to the original post.
 *
 * Only mount this for the active slide — embeds are heavy iframes.
 */
export function FeaturedVideoPlayer({ video }: { video: FeaturedVideo }) {
    if (video.source === 'entry' && video.video_url) {
        return (
            <video
                src={video.video_url}
                controls
                autoPlay
                playsInline
                className="size-full bg-black object-contain"
            />
        );
    }

    const src = embedSrc(video);

    if (src) {
        return (
            <iframe
                src={src}
                title={video.title ?? 'Creator video'}
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
                className="size-full border-0 bg-black"
            />
        );
    }

    return <VideoPoster video={video} />;
}

/** Static cover for inactive slides and videos that can't be embedded. */
export function VideoPoster({ video }: { video: FeaturedVideo }) {
    const linkOut = video.source === 'platform' ? video.share_url : null;

    return (
        <div className="relative size-full bg-black">
            {video.thumbnail_url ? (
                <img
                    src={video.thumbnail_url}
                    alt=""
                    className="size-full object-cover opacity-80"
                />
            ) : (
                <div className="size-full bg-gradient-to-br from-primary/30 via-neutral-900 to-black" />
            )}

            <div className="absolute inset-0 flex items-center justify-center">
                {linkOut ? (
                    <a
                        href={linkOut}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-black shadow-lg transition hover:bg-white"
                    >
                        <ExternalLink className="size-4" />
                        Watch on {platformLabel(video.platform ?? '')}
                    </a>
                ) : (
                    <span className="flex size-14 items-center justify-center rounded-full bg-white/90 text-black shadow-lg">
                        <Play className="size-6 translate-x-px fill-current" />
                    </span>
                )}
            </div>
        </div>
    );
}
