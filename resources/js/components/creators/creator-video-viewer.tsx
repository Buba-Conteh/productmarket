import { Link } from '@inertiajs/react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import {
    ChevronLeft,
    ChevronRight,
    ExternalLink,
    Eye,
    Heart,
    MessageCircle,
    X,
} from 'lucide-react';
import { useState } from 'react';
import { useArrowKeys } from '@/hooks/use-arrow-keys';
import { formatCompactNumber } from '@/lib/format';
import type { CreatorSearchResult } from '@/types/profile';
import { CreatorIdentity } from './creator-identity';
import { CreatorInviteButton } from './creator-invite-button';
import { CreatorStatGrid } from './creator-stat-grid';
import { CreatorVideoReel } from './creator-video-reel';
import { platformLabel } from './platform-chip';

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
 * Full-screen video browser. Up/down moves through the current creator's
 * reel; left/right jumps to the previous/next creator in the results, so a
 * brand can audition creators back-to-back without leaving the directory.
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
        <DialogPrimitive.Root open onOpenChange={(open) => !open && onClose()}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="backdrop-blur-mddata-[state=open]:animate-in fixed inset-0 z-50 bg-black/75 data-[state=open]:fade-in-0" />
                <DialogPrimitive.Content className="fixed inset-0 z-50 flex items-center justify-center text-white outline-none">
                    <DialogPrimitive.Title className="sr-only">
                        {creator.display_name} — videos
                    </DialogPrimitive.Title>
                    <DialogPrimitive.Description className="sr-only">
                        Use the up and down arrows for this creator's videos and
                        left and right for other creators.
                    </DialogPrimitive.Description>

                    <DialogPrimitive.Close
                        className="absolute top-4 right-4 z-10 flex size-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
                        aria-label="Close"
                    >
                        <X className="size-5" />
                    </DialogPrimitive.Close>

                    <CreatorArrow
                        side="left"
                        onClick={onPrevious}
                        label="Previous creator"
                    />

                    <div className="flex items-center gap-8">
                        <div className="flex flex-col gap-3">
                            {/* Compact identity for screens without the side panel */}
                            <div className="flex items-center justify-between gap-3 lg:hidden">
                                <CreatorIdentity creator={creator} inverted />
                                <CreatorInviteButton
                                    onInvite={onInvite}
                                    fullyInvited={fullyInvited}
                                />
                            </div>

                            <CreatorVideoReel
                                key={creator.id}
                                videos={creator.featured_videos}
                                initialIndex={activeIndex}
                                activeIndex={activeIndex}
                                onActiveChange={setActiveIndex}
                                keyboardPaused={keyboardPaused}
                            />
                        </div>

                        <aside className="hidden w-80 space-y-5 lg:block">
                            <CreatorIdentity
                                creator={creator}
                                size="lg"
                                inverted
                            />

                            <CreatorStatGrid
                                totals={creator.totals}
                                variant="tiles"
                                inverted
                            />

                            {video && (
                                <div className="space-y-2 rounded-xl bg-white/5 p-3">
                                    <p className="text-xs text-white/50">
                                        Video {activeIndex + 1} of{' '}
                                        {creator.featured_videos.length}
                                        {video.platform &&
                                            ` · ${platformLabel(video.platform)}`}
                                        {video.source === 'entry' &&
                                            ' · Made on ProductMarket'}
                                    </p>
                                    {video.title && (
                                        <p className="line-clamp-3 text-sm font-medium">
                                            {video.title}
                                        </p>
                                    )}
                                    <div className="flex items-center gap-3 text-xs text-white/70 tabular-nums">
                                        <span className="flex items-center gap-1">
                                            <Eye className="size-3.5" />
                                            {formatCompactNumber(
                                                video.view_count,
                                            )}
                                        </span>
                                        {video.like_count > 0 && (
                                            <span className="flex items-center gap-1">
                                                <Heart className="size-3.5" />
                                                {formatCompactNumber(
                                                    video.like_count,
                                                )}
                                            </span>
                                        )}
                                        {video.comment_count > 0 && (
                                            <span className="flex items-center gap-1">
                                                <MessageCircle className="size-3.5" />
                                                {formatCompactNumber(
                                                    video.comment_count,
                                                )}
                                            </span>
                                        )}
                                        {video.share_url && (
                                            <a
                                                href={video.share_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="ml-auto flex items-center gap-1 hover:text-white"
                                            >
                                                <ExternalLink className="size-3.5" />
                                                Original
                                            </a>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center gap-2">
                                <CreatorInviteButton
                                    onInvite={onInvite}
                                    fullyInvited={fullyInvited}
                                />
                                <Link
                                    href={`/creators/${creator.id}`}
                                    className="rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium transition hover:bg-white/20"
                                >
                                    Full profile
                                </Link>
                            </div>

                            <p className="text-xs text-white/40">
                                Creator {position.index + 1} of {position.total}{' '}
                                · ↑↓ videos · ←→ creators
                            </p>
                        </aside>
                    </div>

                    <CreatorArrow
                        side="right"
                        onClick={onNext}
                        label="Next creator"
                    />
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}

function CreatorArrow({
    side,
    onClick,
    label,
}: {
    side: 'left' | 'right';
    onClick?: () => void;
    label: string;
}) {
    const Icon = side === 'left' ? ChevronLeft : ChevronRight;

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={!onClick}
            aria-label={label}
            className={
                'absolute top-1/2 z-10 flex size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20 disabled:pointer-events-none disabled:opacity-0 ' +
                (side === 'left' ? 'left-2 sm:left-6' : 'right-2 sm:right-6')
            }
        >
            <Icon className="size-6" />
        </button>
    );
}
