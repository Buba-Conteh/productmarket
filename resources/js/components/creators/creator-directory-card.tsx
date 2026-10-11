import { Link } from '@inertiajs/react';
import { Film } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { CreatorSearchResult } from '@/types/profile';
import { CreatorIdentity } from './creator-identity';
import { CreatorInviteButton } from './creator-invite-button';
import { CreatorStatGrid } from './creator-stat-grid';
import { FeaturedVideoThumb } from './featured-video-thumb';
import { PlatformChip } from './platform-chip';

const STRIP_SIZE = 5;

type Props = {
    creator: CreatorSearchResult;
    /** Opens the quick-view popup for this creator. */
    onOpen: () => void;
    /** Opens the video browser on the given featured video. */
    onPlayVideo: (videoIndex: number) => void;
    /** Opens the invite dialog. Omitted when the brand has no live campaigns. */
    onInvite?: () => void;
    /** True when a pending invitation already exists for every live campaign. */
    fullyInvited?: boolean;
};

/**
 * Directory tile: identity and combined reach up top, then a strip of the
 * creator's featured videos so a brand can judge the work without leaving
 * the list. Clicking the card opens the quick view; a video opens the player.
 */
export function CreatorDirectoryCard({
    creator,
    onOpen,
    onPlayVideo,
    onInvite,
    fullyInvited = false,
}: Props) {
    const strip = creator.featured_videos.slice(0, STRIP_SIZE);

    return (
        <Card
            role="button"
            tabIndex={0}
            onClick={onOpen}
            onKeyDown={(e) => {
                if (e.target === e.currentTarget && e.key === 'Enter') {
                    onOpen();
                }
            }}
            aria-label={`Quick view ${creator.display_name}`}
            className="flex h-full cursor-pointer flex-col overflow-hidden border-0 bg-background shadow-[0_2px_12px_rgba(0,0,0,0.08)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none dark:bg-card dark:ring-1 dark:ring-white/10"
        >
            <CardContent className="flex flex-1 flex-col gap-4 p-5">
                <div className="flex items-start justify-between gap-3">
                    <CreatorIdentity creator={creator} />
                    <CreatorInviteButton
                        onInvite={onInvite}
                        fullyInvited={fullyInvited}
                        className="shrink-0"
                    />
                </div>

                <CreatorStatGrid totals={creator.totals} />

                {creator.niches.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1">
                        {creator.niches.slice(0, 2).map((n) => (
                            <Badge
                                key={n.id}
                                variant="secondary"
                                className="text-xs"
                            >
                                {n.name}
                            </Badge>
                        ))}
                        {creator.niches.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                                +{creator.niches.length - 2}
                            </Badge>
                        )}
                    </div>
                )}

                {/* Featured video strip */}
                {strip.length > 0 ? (
                    <div className="grid grid-cols-5 gap-1.5">
                        {strip.map((video, index) => (
                            <FeaturedVideoThumb
                                key={video.id}
                                video={video}
                                onClick={() => onPlayVideo(index)}
                                className="rounded-lg"
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex items-center justify-center gap-2 rounded-lg border border-dashed py-6 text-xs text-muted-foreground">
                        <Film className="size-4" />
                        No videos synced yet
                    </div>
                )}

                <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-1">
                        {creator.social_accounts.map((account) => (
                            <PlatformChip
                                key={account.platform.slug}
                                slug={account.platform.slug}
                            />
                        ))}
                    </div>
                    <Link
                        href={`/creators/${creator.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs font-medium text-primary hover:underline"
                    >
                        View profile
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}
