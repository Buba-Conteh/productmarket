# UI 7 — Creator directory quick view + video browser

**Status:** 🟡 Implemented — awaiting browser verification
**Branch:** `feature/creator-quick-view`
**Date:** 2026-10-11
**Extends:** 7.4 Creator search (see `ui-5-entries-ux-creator-directory.md`)

## Overview

Brands can now evaluate creators from the `/creators` directory without
going back and forth to each profile:

1. **Directory card** now shows identity, a compact stats row (followers, likes,
   engagement, campaign views), niches, and a **strip of 5 featured videos**.
2. **Quick view** opens when you click a card. It shows stats tiles, bio,
   niches, the per-platform breakdown and up to 10 featured videos. **← / →**
   (buttons or keyboard) step to the previous/next creator on the page.
3. **Video browser** opens when you click any video, from the card or the
   quick view. It is a full-screen player with a vertical snap-scrolling reel:
   **↑ / ↓** (scroll, buttons or keys) moves through that creator's videos, and
   **← / →** jumps to the previous/next creator. A side panel shows the creator's
   stats, the current video's stats, Invite and Full profile. If it was opened
   from the quick view, closing it returns there.

You can invite from all three surfaces. The invite dialog opens on top of the
popups, and arrow-key paging pauses while it is open.

## Data — `featured_videos`

Built by `App\Services\Creators\FeaturedVideoService` (final, readonly). It is
injected into `CreatorSearchController::index()` with method injection and
returns at most 10 videos per creator (`PER_CREATOR`). It runs **2 batched
queries per page**, so there is no N+1:

| Order | Source | Plays via |
|---|---|---|
| 1st | Entry videos (`live` / `won` / `approved`, `video_url` set), newest first | native `<video>` from our bucket |
| 2nd | Synced `creator_videos`, highest `view_count` first | the platform's official embed iframe |

Embed URLs are built server-side:

| Platform | `embed_url` |
|---|---|
| TikTok | `https://www.tiktok.com/embed/v2/{platform_video_id}` |
| YouTube | `https://www.youtube.com/embed/{platform_video_id}` (+ `autoplay=1&rel=0` client-side) |
| Instagram | `{permalink}/embed` |

Stub-mode videos (`*_stub_*` ids) and videos without a permalink get
`embed_url: null`. They render as their cover with a "Watch on {platform}" link
out.

## Files

| File | Purpose |
|---|---|
| `app/Services/Creators/FeaturedVideoService.php` | Builds the featured reel and embed URLs |
| `app/Http/Controllers/Brand/CreatorSearchController.php` | Adds `featured_videos` to each result |
| `components/creators/creator-directory-card.tsx` | Redesigned card with the video strip |
| `components/creators/creator-quick-view-dialog.tsx` | Quick-view popup with creator paging |
| `components/creators/creator-video-viewer.tsx` | Full-screen browser that pages between creators |
| `components/creators/creator-video-reel.tsx` | One creator's vertical snap reel (↑/↓) |
| `components/creators/featured-video-player.tsx` | Player for a video/embed, plus the poster fallback |
| `components/creators/featured-video-thumb.tsx` | 9:16 thumbnail tile |
| `components/creators/creator-identity.tsx` | Avatar, name, country and handle header |
| `components/creators/creator-stat-grid.tsx` | Stats as an inline row (card) or tiles (popups) |
| `components/creators/creator-invite-button.tsx` | Shared Invite / Invited button |
| `components/creators/platform-chip.tsx` | Tinted platform marker |
| `hooks/use-creator-browser.ts` | Tracks which creator is open and whether the quick view or the video browser is showing |
| `hooks/use-arrow-keys.ts` | Arrow-key bindings; ignored inside form fields |

## Behaviour notes

- Only the active reel slide mounts a player. Off-screen slides are static
  posters, so embeds don't load or keep playing in the background.
- Creator paging covers the **current results page** (18 per page). It does not
  cross into the next page.
- When a platform iframe has focus, it captures the keyboard and mouse wheel.
  The ↑/↓ buttons beside the reel still work.
- Removed from the card (moved into the quick view): the bio and the
  per-platform reach rows.

## Tests

Added to `tests/Feature/Campaign/CampaignInvitationTest.php`:
- featured videos are ordered by views and have the correct embed URL per platform
- the reel is capped at 10 and stub videos have no embed URL
- a creator with no videos gets an empty reel
