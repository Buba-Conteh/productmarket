import { MapPin } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';
import type { CreatorSearchResult } from '@/types/profile';

type Props = {
    creator: CreatorSearchResult;
    size?: 'md' | 'lg';
    /** Tone for use on the dark video-browser backdrop. */
    inverted?: boolean;
};

/**
 * Avatar, name, country and primary handle — the header every creator surface
 * in the directory (card, quick view, video browser) leads with.
 */
export function CreatorIdentity({
    creator,
    size = 'md',
    inverted = false,
}: Props) {
    const getInitials = useInitials();
    const primary = creator.social_accounts[0];

    return (
        <div className="flex min-w-0 items-center gap-3">
            <Avatar
                className={cn(
                    'shrink-0 ring-2',
                    inverted ? 'ring-white/20' : 'ring-border',
                    size === 'lg' ? 'size-14' : 'size-11',
                )}
            >
                <AvatarImage
                    src={creator.user.avatar ?? undefined}
                    alt={creator.display_name}
                />
                <AvatarFallback className="text-xs font-semibold text-foreground">
                    {getInitials(creator.display_name)}
                </AvatarFallback>
            </Avatar>

            <div className="min-w-0">
                <div className="flex items-center gap-2">
                    <span
                        className={cn(
                            'truncate font-semibold',
                            size === 'lg' ? 'text-lg' : 'text-base',
                        )}
                    >
                        {creator.display_name}
                    </span>
                    {creator.user.country && (
                        <span
                            className={cn(
                                'flex shrink-0 items-center gap-0.5 text-xs font-medium',
                                inverted
                                    ? 'text-white/70'
                                    : 'text-muted-foreground',
                            )}
                        >
                            <MapPin className="size-3" />
                            {creator.user.country}
                        </span>
                    )}
                </div>
                {primary && (
                    <p
                        className={cn(
                            'truncate text-sm',
                            inverted
                                ? 'text-white/75'
                                : 'text-muted-foreground',
                        )}
                    >
                        @{primary.handle}
                    </p>
                )}
            </div>
        </div>
    );
}
