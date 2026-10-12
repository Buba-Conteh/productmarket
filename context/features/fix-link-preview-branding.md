# Fix: Link Preview Branding

**Status:** 🟢 Complete
**Branch:** `fix/link-preview-branding`
**Date:** 2026-10-12

## Problem

Sharing the site link (WhatsApp, iMessage, Slack, LinkedIn, X) showed the Laravel logo instead of Trendko.

## Root Cause

1. `public/favicon.ico` and `public/apple-touch-icon.png` were still the stock Laravel files from the initial scaffold — only `favicon.svg` had been rebranded. Most preview crawlers ignore SVG icons and use the ICO/PNG.
2. `og:image` / `twitter:image` pointed at `https://trendko.com/og-default.png` and `https://trendko.com/og-welcome.png`, both of which return 404. With no OG image, crawlers fell back to the (Laravel) favicon.

## Changes

| File | Change |
|---|---|
| `public/favicon.ico` | Rasterized from `favicon.svg` — "T" with amber dot top-right (16/32/48 px, PNG-in-ICO) |
| `public/apple-touch-icon.png` | 180×180 from `favicon.svg`, square corners (iOS rounds them itself) |
| `public/og-image.png` | 512×512 share image — identical to the tab icon (`favicon.svg` "T" + amber dot). Replaces the earlier `og-default.png` banner; renamed so platforms re-fetch |
| `resources/views/app.blade.php` | OG/Twitter image defaults now `asset('og-image.png')`; `og:image` dimensions 512×512; `twitter:card` = `summary` (square thumbnail); added `og:image:alt` |
| `app/Http/Controllers/WelcomeController.php` | Replaced dead `og-welcome.png` URLs with `asset('og-image.png')` |

## Notes

- `asset()` builds from `APP_URL` — production `.env` must have the correct public `https://` domain or crawlers will get a wrong image URL.
- Platforms cache previews. After deploy, re-scrape with the [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/), [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/), or append `?v=2` to the shared link. WhatsApp caches per URL for a while.
- Icons were rendered from the existing `favicon.svg` / `logo/trendko_logo_light.svg` designs via headless Chrome.
