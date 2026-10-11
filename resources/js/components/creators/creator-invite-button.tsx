import { Check, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Props = {
    /** Omitted when the brand has no live campaigns — the button is hidden. */
    onInvite?: () => void;
    /** True when a pending invitation already exists for every live campaign. */
    fullyInvited?: boolean;
    className?: string;
};

/** The invite action shared by the card, quick view and video browser. */
export function CreatorInviteButton({
    onInvite,
    fullyInvited = false,
    className,
}: Props) {
    if (!onInvite) {
        return null;
    }

    return (
        <Button
            size="sm"
            onClick={(e) => {
                e.stopPropagation();
                onInvite();
            }}
            disabled={fullyInvited}
            className={cn('gap-1.5 rounded-full px-4', className)}
        >
            {fullyInvited ? (
                <Check className="size-3.5" />
            ) : (
                <Send className="size-3.5" />
            )}
            {fullyInvited ? 'Invited' : 'Invite'}
        </Button>
    );
}
