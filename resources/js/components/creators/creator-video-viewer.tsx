import { Link } from '@inertiajs/react';
import { ExternalLink, Eye, Heart, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from '@/components/ui/dialog';
import { useArrowKeys } from '@/hooks/use-arrow-keys';
import { formatCompactNumber } from '@/lib/format';
import type { CreatorSearchResult, FeaturedVideo } from '@/types/profile';
import { CreatorIdentity } from './creator-identity';
import { CreatorInviteButton } from './creator-invite-button';
import { CreatorNavArrow } from './creator-nav-arrow';
import { CreatorStatGrid } from './creator-stat-grid';
import { CreatorVideoReel } from './creator-video-reel';
import { platformLabel } from './platform-chip';

const PANEL_CARD =
    'rounded-xl bg-background p-4 shadow-[0_2px_12px_rgba(0,0,0,0.08)] dark:bg-card dark:shadow-none';

type Props = {
    creator: CreatorSearchResult;
    position: { index: number; total: number };
    initialVideoIndex: number;
    onClose: () => void;
    onPrevious?: () => void;
    onNext?: () => void;
    onInvite?: () => void;
    fullyInvited?: boolean;
    keyboardPaused?: boolean;
};

/**
 * Video browser popup. It shares the quick view's light, themed treatment so
 * the directory stays visible behind it: the brand is still clearly on the
 * site, just looking closer. Up/down moves through the creator's reel;
 * left/right jumps to the previous/next creator in the results.
 */
export function CreatorVideoViewer({
    creator,
    position,
    initialVideoIndex,
    onClose,
    onPrevious,
    onNext,
    onInvite,
    fullyInvited,
    keyboardPaused = false,
}: Props) {
    // Reset to the first clip whenever the creator changes — adjusting state
    // during render rather than in an effect avoids a flash of the old index.
    const [activeIndex, setActiveIndex] = useState(initialVideoIndex);
    const [shownCreatorId, setShownCreatorId] = useState(creator.id);

    if (shownCreatorId !== creator.id) {
        setShownCreatorId(creator.id);
        setActiveIndex(0);
    }

    const video = creator.featured_videos[activeIndex];

    useArrowKeys({ left: onPrevious, right: onNext }, !keyboardPaused);

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent
                overlayClassName="bg-black/30 backdrop-blur-[2px]"
                className="flex h-[min(88dvh,860px)] flex-col gap-3 overflow-visible rounded-2xl border-0 bg-background p-3 shadow-2xl sm:max-w-4xl lg:flex-row lg:gap-4 dark:ring-1 dark:ring-white/10"
            >
                <DialogTitle className="sr-only">
                    {creator.display_name} — videos
                </DialogTitle>
                <DialogDescription className="sr-only">
                    Use the up and down arrows for this creator's videos and
                    left and right for other creators.
                </DialogDescription>

                <CreatorNavArrow
                    side="left"
                    onClick={onPrevious}
                    label="Previous creator"
                />
                <CreatorNavArrow
                    side="right"
                    onClick={onNext}
                    label="Next creator"
                />

                {/* Compact header for screens without the side panel */}
                <div className="flex items-center justify-between gap-3 pr-8 lg:hidden">
                    <CreatorIdentity creator={creator} />
                    <CreatorInviteButton
                        onInvite={onInvite}
                        fullyInvited={fullyInvited}
                    />
                </div>

                <div className="flex min-h-0 flex-1 justify-center lg:flex-none">
                    <div className="aspect-[9/16] h-full max-w-full">
                        <CreatorVideoReel
                            key={creator.id}
                            videos={creator.featured_videos}
                            initialIndex={activeIndex}
                            activeIndex={activeIndex}
                            onActiveChange={setActiveIndex}
                            keyboardPaused={keyboardPaused}
                        />
                    </div>
                </div>

                <aside className="hidden min-w-0 flex-1 flex-col gap-3 overflow-y-auto lg:flex">
                    <section className={`${PANEL_CARD} space-y-4 pr-10`}>
                        <CreatorIdentity creator={creator} size="lg" />
                        <div className="flex items-center gap-2">
                            <CreatorInviteButton
                                onInvite={onInvite}
                                fullyInvited={fullyInvited}
                            />
                            <Button
                                variant="outline"
                                size="sm"
                                asChild
                                className="rounded-full"
                            >
                                <Link href={`/creators/${creator.id}`}>
                                    Full profile
                                </Link>
                            </Button>
                        </div>
                        <CreatorStatGrid
                            totals={creator.totals}
                            variant="tiles"
                        />
                    </section>

                    {video && (
                        <VideoDetails
                            video={video}
                            index={activeIndex}
                            total={creator.featured_videos.length}
                        />
                    )}

                    <p className="mt-auto px-1 text-xs text-muted-foreground">
                        Creator {position.index + 1} of {position.total} · ↑↓
                        videos · ←→ creators
                    </p>
                </aside>
            </DialogContent>
        </Dialog>
    );
}

function VideoDetails({
    video,
    index,
    total,
}: {
    video: FeaturedVideo;
    index: number;
    total: number;
}) {
    return (
        <section className={`${PANEL_CARD} space-y-2`}>
            <p className="text-xs text-muted-foreground">
                Video {index + 1} of {total}
                {video.platform && ` · ${platformLabel(video.platform)}`}
                {video.source === 'entry' && ' · Made on ProductMarket'}
            </p>

            {video.title && (
                <p className="line-clamp-3 text-sm font-medium">
                    {video.title}
                </p>
            )}

            <div className="flex items-center gap-3 text-xs text-muted-foreground tabular-nums">
                <span className="flex items-center gap-1">
                    <Eye className="size-3.5" />
                    {formatCompactNumber(video.view_count)}
                </span>
                {video.like_count > 0 && (
                    <span className="flex items-center gap-1">
                        <Heart className="size-3.5" />
                        {formatCompactNumber(video.like_count)}
                    </span>
                )}
                {video.comment_count > 0 && (
                    <span className="flex items-center gap-1">
                        <MessageCircle className="size-3.5" />
                        {formatCompactNumber(video.comment_count)}
                    </span>
                )}
                {video.share_url && (
                    <a
                        href={video.share_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto flex items-center gap-1 font-medium text-primary hover:underline"
                    >
                        <ExternalLink className="size-3.5" />
                        View original
                    </a>
                )}
            </div>
        </section>
    );
}
