import type { DriveStep } from 'driver.js';

export type TourRole = 'brand' | 'creator';

/**
 * Steps anchor to `data-tour` attributes. A step whose element isn't on the
 * page (e.g. the sidebar is collapsed into a sheet on mobile) falls back to a
 * centred popover, so every step still reads on its own.
 */
const welcomeStep = (body: string): DriveStep => ({
    popover: {
        title: 'Welcome to Trendko 👋',
        description: body,
    },
});

const helpStep: DriveStep = {
    element: '[data-tour="tour-button"]',
    popover: {
        title: 'Replay this tour anytime',
        description:
            'Click here whenever you want a refresher on where things are.',
    },
};

export const tours: Record<TourRole, DriveStep[]> = {
    brand: [
        welcomeStep(
            "Let's take a quick look around so you can launch your first campaign.",
        ),
        {
            element: '[data-tour="nav-campaigns"]',
            popover: {
                title: 'Create campaigns',
                description:
                    'Launch a Contest (you pick a winner), Ripple (pay per verified view), or Pitch (creators bid for your deal). Funds sit in escrow until results are delivered.',
            },
        },
        {
            element: '[data-tour="nav-creators"]',
            popover: {
                title: 'Find creators',
                description:
                    'Search creators by niche, platform, and verified audience, then invite them straight to a live campaign.',
            },
        },
        {
            element: '[data-tour="nav-messages"]',
            popover: {
                title: 'Messages',
                description:
                    'Every entry has its own thread for feedback, edit requests, and questions.',
            },
        },
        {
            element: '[data-tour="nav-analytics"]',
            popover: {
                title: 'Analytics',
                description:
                    'Track verified views, cost per view, and your top creators across campaigns.',
            },
        },
        {
            element: '[data-tour="nav-settings"]',
            popover: {
                title: 'Set up your account',
                description:
                    'Choose a plan under Settings → Billing before publishing campaigns. Your profile and notification preferences live here too.',
            },
        },
        {
            element: '[data-tour="notifications"]',
            popover: {
                title: 'Notifications',
                description:
                    "You'll be alerted here when new entries arrive or a creator posts.",
            },
        },
        helpStep,
    ],
    creator: [
        welcomeStep(
            "Let's get you set up and earning. This takes less than a minute.",
        ),
        {
            element: '[data-tour="nav-settings"]',
            popover: {
                title: 'Step 1 — Finish your setup',
                description:
                    'In Settings, connect your social accounts (so we can verify your views) and add a payout account (so you can get paid). Both are required before you submit.',
            },
        },
        {
            element: '[data-tour="nav-discover"]',
            popover: {
                title: 'Step 2 — Discover campaigns',
                description:
                    'Browse live Contest, Ripple, and Pitch campaigns from brands and pick the ones that fit your content.',
            },
        },
        {
            element: '[data-tour="nav-entries"]',
            popover: {
                title: 'Step 3 — Track your entries',
                description:
                    'Drafts, submissions, and live posts all live here. You can save a draft and come back anytime.',
            },
        },
        {
            element: '[data-tour="nav-wallet"]',
            popover: {
                title: 'Get paid',
                description:
                    'See your earnings, pending payouts, and transaction history. Views are verified automatically — no screenshots needed.',
            },
        },
        {
            element: '[data-tour="nav-messages"]',
            popover: {
                title: 'Messages',
                description:
                    'Chat with brands about your entries and respond to edit requests.',
            },
        },
        {
            element: '[data-tour="notifications"]',
            popover: {
                title: 'Notifications',
                description:
                    "You'll be alerted here when an entry is approved, needs edits, or a payout lands.",
            },
        },
        helpStep,
    ],
};

export function resolveTourRole(roles: string[]): TourRole | null {
    if (roles.includes('brand')) {
        return 'brand';
    }

    if (roles.includes('creator')) {
        return 'creator';
    }

    return null;
}
