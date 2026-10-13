import { CircleHelp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProductTour } from '@/hooks/use-product-tour';

export function TourButton() {
    const { canTour, startTour } = useProductTour();

    if (!canTour) {
        return null;
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={startTour}
            aria-label="Take the tour"
            title="Take the tour"
            data-tour="tour-button"
        >
            <CircleHelp className="size-4" />
        </Button>
    );
}
