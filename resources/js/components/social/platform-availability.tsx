import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';

type Props = {
    /** True when the platform can't be connected yet. */
    disabled: boolean;
    children: ReactNode;
};

/**
 * Renders a platform row normally, or blurred and non-interactive with a
 * "Coming soon" badge when the platform isn't enabled yet.
 */
export function PlatformAvailability({ disabled, children }: Props) {
    if (!disabled) {
        return <>{children}</>;
    }

    return (
        <div className="relative">
            <div
                aria-hidden
                inert
                className="pointer-events-none opacity-60 blur-[2px] select-none"
            >
                {children}
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
                <Badge variant="secondary" className="shadow-sm">
                    Coming soon
                </Badge>
            </div>
        </div>
    );
}
