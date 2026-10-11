# Fix — Welcome Navbar Mobile Responsiveness

**Status:** 🟢 Complete
**Branch:** `fix/welcome-navbar-mobile`

## Problem

On phones, the landing page navbar squeezed a 220px-wide logo (fixed 96px height) and the "Log in" / "Get started" buttons into one row. The buttons wrapped and got distorted, and the section links were hidden with no way to reach them on mobile.

## Changes

- Moved the navbar out of `pages/welcome.tsx` into its own component: `components/welcome/welcome-navbar.tsx` (`WelcomeNavbar`, `Logo`, `MobileMenu`).
- **Logo:** `h-16` and capped at 150px wide on mobile, back to full size from `sm`. It can shrink so the buttons always fit.
- **Buttons:** `shrink-0` + `whitespace-nowrap`, so they never wrap. Tighter padding on mobile. The arrow icon on "Get started" is hidden below `sm`.
- **Log in:** hidden below `sm` in the bar and moved into the mobile menu.
- **Mobile menu:** a hamburger (`md:hidden`) opens a shadcn `Sheet` with the section links plus Log in / Get started when signed out. It closes when you tap a link.
- The desktop layout (≥ `md`) is unchanged.
