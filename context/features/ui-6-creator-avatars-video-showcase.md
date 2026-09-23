# UI 6 — Creator avatars + platform video showcase

**Status:** 🟢 Complete
**Branch:** `feature/creator-avatars-video-showcase`
**Date:** 2026-09-23

## Overview

1. Profile photos: pulled from the connected platform **and** uploadable in the
   platform.
2. A horizontally scrolling video showcase on the creator profile, one rail per
   connected platform.
3. A rail for videos made **on** ProductMarket — entry uploads, which play inline.

## What was broken

**`users.avatar` was read in 6 places and written in none.** The column existed,
every profile, creator card, nav item and message avatar rendered it, and nothing
anywhere ever set it — no upload UI, and social connect never captured the
platform's picture. Every avatar in the product was a fallback initial.

The creator profile's portfolio was text rows with outbound links: no thumbnails,
no player, nothing to actually watch.

## API availability

Checked before building — **no OAuth scope changes were needed**, every field is
already covered by the scopes requested at connect time:

| | Avatar | Recent videos |
|---|---|---|
| TikTok | `user/info` → `avatar_large_url` (`user.info.basic`) | `video/list` → cover, share url, view/like/comment, duration (`video.list`) |
| Instagram | `/me` → `profile_picture_url` (`instagram_business_basic`) | `/me/media` → thumbnail, permalink, likes, comments |
| YouTube | `channels?part=snippet` → `thumbnails.high.url` (snippet was already fetched) | uploads playlist → `playlistItems` → batched `videos` for stats |

## New files

| File | Purpose |
|---|---|
| `database/migrations/2026_09_23_140000_add_avatar_to_social_accounts_and_create_creator_videos.php` | `social_accounts.avatar_url`; `creator_videos` table |
| [app/Models/CreatorVideo.php](../../app/Models/CreatorVideo.php) | Synced platform video |
| [app/Services/Social/DataObjects/PlatformVideo.php](../../app/Services/Social/DataObjects/PlatformVideo.php) | Provider-agnostic video DTO |
| [components/videos/video-rail.tsx](../../resources/js/components/videos/video-rail.tsx) | Horizontal snap-scrolling rail with arrow controls |
| [components/videos/platform-video-card.tsx](../../resources/js/components/videos/platform-video-card.tsx) | Platform video tile, links out to the original post |
| [components/videos/entry-video-card.tsx](../../resources/js/components/videos/entry-video-card.tsx) | ProductMarket entry video, plays inline |
| [components/settings/avatar-uploader.tsx](../../resources/js/components/settings/avatar-uploader.tsx) | Upload / change / remove profile photo |

## Changed

- **`PlatformProvider`** gains `fetchRecentVideos()`, implemented by all three
  providers with stub fixtures via `AbstractOAuthProvider::stubVideos()`.
- **All three providers** now return `avatarUrl` on `ConnectedAccount`.
- **`SocialAccountService`** — persists `avatar_url` on connect and sync; new
  `syncVideos()` upserts by `(social_account_id, platform_video_id)` and prunes
  videos deleted on the platform.
- **`SyncSocialAccountStatsJob`** refreshes stats and videos together.
- **`User::avatar_url`** accessor + `$appends`.
- **`ProfileController`** — `updateAvatar()` / `destroyAvatar()`, plus routes.
- **`CreatorProfileController::show()`** — passes `videoRails` and `platformVideos`.
- **`HandleInertiaRequests`** eager-loads `socialAccounts` so the nav avatar resolves.
- `BrandProfileController`, `CreatorSearchController`, `user-info.tsx` read the
  resolved URL.

## Decisions

**Videos are synced, not fetched on demand.** A public profile view must not
depend on three third-party APIs being reachable, and each provider rate-limits
per token. `syncVideos()` rides the existing 12-hourly stats sweep.

**Avatar precedence is resolved at read time, not copied.** `users.avatar` holds
only an uploaded path; the accessor falls back to the first connected account's
picture. Because the platform picture is never written into `users.avatar`, a
sync cannot clobber a deliberate upload — so no "source" column is needed to tell
the two apart, and removing an upload cleanly reveals the platform photo again.

**The accessor returns null when `socialAccounts` isn't loaded** rather than
lazy-loading, so appending it to every `User` serialization can't turn a creator
list into an N+1.

**Platform videos link out; entry videos play inline.** We hold a cover image and
counts for platform videos, not the file — there is nothing to play. Entry videos
live in our own bucket, so those get a real player with `preload="none"` so a rail
doesn't pull several videos on page load.

**Instagram view counts are left at zero and hidden.** Play counts are only
available from the insights endpoint, one request per media item; spending a
request per tile isn't worth it. Likes and comments come from the media call.

## Verification

- `npm run types:check`, `npm run build`, `prettier --check`, `eslint` — all clean.
- `./vendor/bin/pint --dirty` — pass.
- `./vendor/bin/pest` — **128 passed**, up from 117. The same 12 failures as on
  `main` (verified by stashing and re-running, including `ProfileUpdateTest`,
  which fails 5/5 on a clean tree and is unrelated to this work).
- New: `tests/Feature/Social/CreatorVideoShowcaseTest.php` (11) — video sync for
  all three platforms, re-sync idempotency, avatar capture, the
  upload-beats-platform and remove-reveals-platform precedence rules, non-image
  rejection, profile rendering, and empty-rail suppression.
- Live sync verified against the running app via tinker: 8 videos written,
  `avatar_url` captured, `User::avatar_url` resolving through the fallback.

**One trap specifically guarded:** a per-relation eager-load `limit(12)` can be
applied globally rather than per parent, which would silently truncate the second
and third rails. The render test asserts each rail keeps its own full set.

### Not verified
No authenticated browser walkthrough — the rails, the inline player and the
uploader have not been seen rendering. Worth a look before merge.

## Follow-ups

- Existing users get no avatar until the next 12-hourly sync (or a reconnect). A
  one-off `SyncSocialAccountStatsJob::dispatch()` backfills them.
- The media kit still shows the old text portfolio; it could reuse `VideoRail`.
- Instagram view counts would need a per-media insights call.
