import { useEffect } from 'react';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { useProductTour } from '@/hooks/use-product-tour';

/** Starts the product tour the first time a user lands on their dashboard. */
export function TourAutoStart() {
    const { isCurrentUrl } = useCurrentUrl();
    const { startTour, shouldAutoStart } = useProductTour();
    const onDashboard = isCurrentUrl('/dashboard');

    useEffect(() => {
        if (!onDashboard || !shouldAutoStart()) {
            return;
        }

        // Let the sidebar and header finish laying out before highlighting.
        const timer = window.setTimeout(startTour, 600);

        return () => window.clearTimeout(timer);
    }, [onDashboard, shouldAutoStart, startTour]);

    return null;
}
