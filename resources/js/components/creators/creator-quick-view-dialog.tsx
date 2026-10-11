import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Film, PlaySquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from '@/components/ui/dialog';
import { useArrowKeys } from '@/hooks/use-arrow-keys';
import type { CreatorSearchResult } from '@/types/profile';
import { CreatorIdentity } from './creator-identity';
import { CreatorInviteButton } from './creator-invite-button';
import { CreatorStatGrid } from './creator-stat-grid';
import { FeaturedVideoThumb } from './featured-video-thumb';
import { PlatformReachRow } from './platform-reach-row';

const NICHE_PREVIEW = 4;

type Props = {
    creator: CreatorSearchResult;
    position: { index: number; total: number };
    onClose: () => void;
    onPrevious?: () => void;
    onNext?: () => void;
    onPlayVideo: (videoIndex: number) => void;
    onInvite?: () => void;
    fullyInvited?: boolean;
    /** Suspends arrow-key paging while another dialog sits on top. */
    keyboardPaused?: boolean;
};

/**
 * Popup summary of one creator — reach, niches, per-platform breakdown and
 * featured creative — with arrows to step through the current results page
 * without returning to the list.
 */
export function CreatorQuickViewDialog({
    creator,
    position,
    onClose,
    onPrevious,
    onNext,
    onPlayVideo,
    onInvite,
    fullyInvited,
    keyboardPaused = false,
}: Props) {
    useArrowKeys({ left: onPrevious, right: onNext }, !keyboardPaused);

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent
                overlayClassName="bg-black/30 backdrop-blur-[2px]"
                className="gap-0 overflow-visible rounded-2xl border-0 bg-background p-0 shadow-2xl sm:max-w-3xl dark:ring-1 dark:ring-white/10"
            >
                <NavArrow
                    side="left"
                    onClick={onPrevious}
                    label="Previous creator"
                />
                <NavArrow side="right" onClick={onNext} label="Next creator" />

                <div className="max-h-[85vh] space-y-3 overflow-y-auto p-3 sm:p-4">
                    {/* Profile */}
                    <section className="space-y-4 rounded-xl bg-background p-4 pr-10 shadow-[0_2px_12px_rgba(0,0,0,0.08)] dark:bg-card dark:shadow-none">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <DialogTitle className="sr-only">
                                    {creator.display_name}
                                </DialogTitle>
                                <DialogDescription className="sr-only">
                                    Creator {position.index + 1} of{' '}
                                    {position.total}
                                </DialogDescription>
                                <CreatorIdentity creator={creator} size="lg" />
                            </div>
                            <div className="flex items-center gap-2">
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
                                <CreatorInviteButton
                                    onInvite={onInvite}
                                    fullyInvited={fullyInvited}
                                />
                            </div>
                        </div>

                        <CreatorStatGrid
                            totals={creator.totals}
                            variant="tiles"
                        />

                        {creator.bio && (
                            <p className="line-clamp-3 text-sm text-muted-foreground">
                                {creator.bio}
                            </p>
                        )}

                        {creator.niches.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                                {creator.niches
                                    .slice(0, NICHE_PREVIEW)
                                    .map((n) => (
                                        <Badge key={n.id} variant="secondary">
                                            {n.name}
                                        </Badge>
                                    ))}
                                {creator.niches.length > NICHE_PREVIEW && (
                                    <Badge variant="outline">
                                        +{creator.niches.length - NICHE_PREVIEW}
                                    </Badge>
                                )}
                            </div>
                        )}

                        {creator.social_accounts.length > 0 && (
                            <div className="grid gap-1.5 sm:grid-cols-2">
                                {creator.social_accounts.map((account) => (
                                    <PlatformReachRow
                                        key={account.platform.slug}
                                        account={account}
                                    />
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Featured creative */}
                    <section className="space-y-3 rounded-xl bg-background p-4 shadow-[0_2px_12px_rgba(0,0,0,0.08)] dark:bg-card dark:shadow-none">
                        <h3 className="flex items-center gap-2 text-sm font-semibold">
                            <PlaySquare className="size-4" />
                            Featured creative
                            <span className="text-xs font-normal text-muted-foreground">
                                {creator.featured_videos.length}
                            </span>
                        </h3>

                        {creator.featured_videos.length > 0 ? (
                            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                                {creator.featured_videos.map((video, index) => (
                                    <FeaturedVideoThumb
                                        key={video.id}
                                        video={video}
                                        onClick={() => onPlayVideo(index)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center gap-2 rounded-lg border border-dashed py-8 text-sm text-muted-foreground">
                                <Film className="size-4" />
                                No videos synced yet
                            </div>
                        )}
                    </section>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function NavArrow({
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
                'absolute top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-background shadow-lg transition hover:bg-accent disabled:pointer-events-none disabled:opacity-0 ' +
                (side === 'left'
                    ? 'left-1 sm:-left-14'
                    : 'right-1 sm:-right-14')
            }
        >
            <Icon className="size-5" />
        </button>
    );
}
