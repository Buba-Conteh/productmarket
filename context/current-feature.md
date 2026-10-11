# Current Feature — Creator directory quick view + video browser

**Status:** 🟡 Implemented — awaiting browser verification (see context/features/ui-7-creator-quick-view-video-browser.md)
**Branch:** `feature/creator-quick-view`

## Goals

Let a brand evaluate creators from the directory without bouncing between the
list and each profile page.

1. **Richer directory card** — compact stats row (followers, likes, engagement,
   campaign views, niches) plus a strip of the creator's featured videos.
2. **Quick-view modal** — clicking a card opens a popup with the creator's
   stats, niches, connected platforms and featured creative. Left/right arrows
   (and the keyboard arrows) step to the previous/next creator in the results.
3. **Video browser** — clicking any video opens a full-screen player. Up/down
   (scroll, wheel or arrow keys) moves through that creator's videos;
   left/right jumps to the previous/next creator.

## Data

`featured_videos` is added to each directory result (max 10 per creator):

- ProductMarket entry videos first (live / won / approved, file in our bucket —
  plays inline in a `<video>`).
- Then the creator's synced platform videos (`creator_videos`) by view count.
  These play through the platform's official embed iframe (TikTok
  `embed/v2/{id}`, YouTube `embed/{id}`, Instagram `{permalink}embed`).
  Stub-mode videos have no embed and fall back to the thumbnail + outbound link.

Loaded in two batched queries per page (no N+1) by `FeaturedVideoService`.

## Out of scope

- Favourites / star (no spec for it).
- "Online" presence indicator.
- Navigating past the current results page from inside the popup.
