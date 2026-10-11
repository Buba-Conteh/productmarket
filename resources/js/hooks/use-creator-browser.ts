import { useState } from 'react';

type BrowserState = {
    creatorIndex: number;
    /** Set while the video browser is open. */
    videoIndex: number | null;
    /** Whether the video browser was launched from the quick view. */
    fromQuickView: boolean;
};

/**
 * Which creator the directory popups are showing, and whether the quick view
 * or the video browser is open. Closing the video browser returns to the
 * quick view when that's where it was opened from.
 */
export function useCreatorBrowser(count: number) {
    const [state, setState] = useState<BrowserState | null>(null);

    // The results page can change under an open popup (filters, pagination).
    const current = state && state.creatorIndex < count ? state : null;

    const step = (delta: number) =>
        setState((s) =>
            s ? { ...s, creatorIndex: s.creatorIndex + delta } : s,
        );

    return {
        creatorIndex: current?.creatorIndex ?? null,
        quickViewOpen: current !== null && current.videoIndex === null,
        videoIndex: current?.videoIndex ?? null,
        hasPrevious: current !== null && current.creatorIndex > 0,
        hasNext: current !== null && current.creatorIndex < count - 1,

        openQuickView: (creatorIndex: number) =>
            setState({ creatorIndex, videoIndex: null, fromQuickView: false }),

        openVideo: (creatorIndex: number, videoIndex: number) =>
            setState((s) => ({
                creatorIndex,
                videoIndex,
                fromQuickView: s !== null && s.videoIndex === null,
            })),

        previous: () => step(-1),
        next: () => step(1),

        closeVideo: () =>
            setState((s) =>
                s?.fromQuickView ? { ...s, videoIndex: null } : null,
            ),

        close: () => setState(null),
    };
}
