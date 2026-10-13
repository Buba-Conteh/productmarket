import { usePage } from '@inertiajs/react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useCallback, useMemo } from 'react';
import { resolveTourRole, tours } from '@/lib/tours';
import type { TourRole } from '@/lib/tours';
import type { Auth } from '@/types';

// Bump when the tour content changes enough that everyone should see it again.
const TOUR_VERSION = 1;

function storageKey(role: TourRole, userId: unknown): string {
    return `trendko.tour.${role}.v${TOUR_VERSION}.${String(userId)}`;
}

function hasSeen(key: string): boolean {
    try {
        return window.localStorage.getItem(key) === '1';
    } catch {
        return false;
    }
}

function markSeen(key: string): void {
    try {
        window.localStorage.setItem(key, '1');
    } catch {
        // Storage unavailable (private mode) — the tour may show again.
    }
}

export function useProductTour() {
    const { auth } = usePage<{ auth: Auth }>().props;
    const role = resolveTourRole(auth?.roles ?? []);
    const key = useMemo(
        () => (role ? storageKey(role, auth?.user?.id) : null),
        [role, auth?.user?.id],
    );

    const startTour = useCallback(() => {
        if (!role || !key) {
            return;
        }

        const tour = driver({
            steps: tours[role],
            showProgress: true,
            allowClose: true,
            smoothScroll: true,
            stagePadding: 4,
            stageRadius: 8,
            popoverClass: 'trendko-tour',
            nextBtnText: 'Next',
            prevBtnText: 'Back',
            doneBtnText: 'Got it',
            onDestroyed: () => markSeen(key),
        });

        tour.drive();
    }, [role, key]);

    const shouldAutoStart = useCallback(
        () => key !== null && !hasSeen(key),
        [key],
    );

    return { canTour: role !== null, startTour, shouldAutoStart };
}
