# Guided Product Tour

**Status:** 🟡 Implemented — awaiting staging verification
**Branch:** `feature/guided-tour`

## Overview

A step-by-step, role-aware walkthrough that shows new users how to set up their
account and where the main parts of the app live. Built on
[driver.js](https://driverjs.com) (~5 KB gzipped, zero dependencies, MIT,
framework-agnostic — no React version coupling).

## Behaviour

- **Auto-start:** the first time a brand or creator lands on `/dashboard`, the
  tour starts automatically (after a short delay so the shell has laid out).
- **Replay:** a help (?) button in the top header restarts the tour at any time.
- **Remembered per user/device:** finishing or closing the tour sets
  `trendko.tour.<role>.v<N>.<userId>` in `localStorage`. Bump `TOUR_VERSION` in
  `use-product-tour.ts` to show an updated tour to everyone again.
- **Admins / users without a brand or creator role** get no tour and no button.
- **Mobile:** when the sidebar is collapsed into a sheet, steps whose element
  isn't visible fall back to a centred popover, so the copy still reads.

### Brand tour
Welcome → Campaigns (Contest/Ripple/Pitch + escrow) → Find Creators → Messages
→ Analytics → Settings (pick a plan under Billing) → Notifications → Replay button.

### Creator tour
Welcome → **Step 1: Settings** (connect social accounts + payout account) →
**Step 2: Discover** → **Step 3: My Entries** → Wallet → Messages →
Notifications → Replay button.

## Implementation

| File | Purpose |
|---|---|
| `resources/js/lib/tours.ts` | Step definitions per role + `resolveTourRole()` |
| `resources/js/hooks/use-product-tour.ts` | Builds/starts the driver instance, seen-flag storage |
| `resources/js/components/tour/tour-auto-start.tsx` | First-visit auto-start on the dashboard |
| `resources/js/components/tour/tour-button.tsx` | Header "Take the tour" button |
| `resources/js/types/navigation.ts` | Optional `tourId` on `NavItem` |
| `resources/js/components/nav-main.tsx` | Renders `data-tour={item.tourId}` on nav links |
| `resources/js/components/app-sidebar.tsx` | `tourId`s on brand/creator nav items + Settings |
| `resources/js/components/notification-bell.tsx` | `data-tour="notifications"` anchor |
| `resources/js/components/app-sidebar-header.tsx` | Mounts `TourButton` |
| `resources/js/layouts/app/app-sidebar-layout.tsx` | Mounts `TourAutoStart` |
| `resources/css/app.css` | `.trendko-tour` popover theme using design tokens (light + dark) |

No backend, migration, or route changes.

## Adding a step

1. Add `tourId` to the nav item (or `data-tour="..."` to any element).
2. Add a `{ element: '[data-tour="..."]', popover: { title, description } }`
   entry to the role's array in `lib/tours.ts`.

## Verification checklist

- [x] `npm run types:check`, ESLint, `npm run build` pass
- [ ] New brand: tour auto-starts on dashboard, all steps highlight correctly
- [ ] New creator: same; Settings step reads first
- [ ] Reload after finishing — tour does not reappear; ? button replays it
- [ ] Dark mode popover styling
- [ ] Mobile width — centred fallback popovers
