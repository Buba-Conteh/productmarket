import type { ReactNode } from 'react';
import { campaignTypeGradient } from '@/lib/campaign-type';
import { cn } from '@/lib/utils';

type Props = {
    /** Uploaded thumbnail URL, if any. Falls back to a gradient + initial. */
    thumbnailUrl?: string | null;
    /** Campaign/entry title — used for alt text and the fallback initial. */
    title: string;
    /** Campaign type — selects the fallback gradient. */
    type: string;
    /** Height + any other sizing classes for the thumbnail container. */
    className?: string;
    /** Classes for the fallback initial letter (controls its size). */
    initialClassName?: string;
    /** Badges rendered top-left/top-right, overlaid on the thumbnail. */
    topOverlay?: ReactNode;
    /** Content rendered bottom-right, overlaid on the thumbnail. */
    bottomOverlay?: ReactNode;
};

/**
 * Shared campaign/entry card thumbnail: shows the uploaded image, or a
 * type-colored gradient with the title's first letter when there is none.
 * Used by both the campaign discovery card and the entry card so the two
 * grids stay visually consistent.
 */
export function CampaignThumbnail({
    thumbnailUrl,
    title,
    type,
    className,
    initialClassName = 'text-2xl font-bold text-white/20',
    topOverlay,
    bottomOverlay,
}: Props) {
    return (
        <div className={cn('relative w-full overflow-hidden', className)}>
            {thumbnailUrl ? (
                <img
                    src={thumbnailUrl}
                    alt={title}
                    className="h-full w-full object-cover"
                />
            ) : (
                <div
                    className={cn(
                        'flex h-full w-full items-center justify-center bg-gradient-to-br',
                        campaignTypeGradient(type),
                    )}
                >
                    <span className={initialClassName}>
                        {title.charAt(0).toUpperCase()}
                    </span>
                </div>
            )}

            {topOverlay && (
                <div className="absolute top-2 left-2 right-2 flex items-start justify-between">
                    {topOverlay}
                </div>
            )}

            {bottomOverlay && (
                <div className="absolute bottom-3 right-3">
                    {bottomOverlay}
                </div>
            )}
        </div>
    );
}
