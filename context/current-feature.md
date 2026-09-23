# Current Feature — Creator avatars + platform video showcase

**Status:** 🟢 Complete — see context/features/ui-6-creator-avatars-video-showcase.md
**Branch:** `feature/creator-avatars-video-showcase`

## Goals

1. Creator profile images — pulled from the connected platform (TikTok /
   Instagram / YouTube) **and** uploadable in the platform.
2. A horizontally scrollable video showcase on the creator profile, covering all
   three platforms.
3. Include videos made **on** ProductMarket (entry videos uploaded to the bucket).

## What's actually broken today

- **`users.avatar` is read in 6 places and written in none.** The column exists,
  every profile/card/message renders it, and nothing anywhere sets it. So every
  avatar in the app is a fallback initial. There is no upload UI and social
  connect never captures the platform's picture.
- The creator profile lists live entries as **text rows with outbound links** —
  no thumbnails, no player, nothing to actually look at.

## API availability (checked against current scopes — no scope changes needed)

| | Avatar | Recent videos |
|---|---|---|
| TikTok | `user/info` → `avatar_url` (`user.info.basic`, already requested) | `video/list` → cover/share/stats (`video.list`, already requested) |
| Instagram | `/me` → `profile_picture_url` (`instagram_business_basic`) | `/me/media` → thumbnail/permalink |
| YouTube | `channels?part=snippet` → `thumbnails.high.url` (snippet already fetched) | uploads playlist → `playlistItems` + `videos` stats |

## Plan

### Backend
- Migration: `social_accounts.avatar_url`; new `creator_videos` table
  (unique on `(social_account_id, platform_video_id)`).
- `PlatformVideo` DTO; `avatarUrl` added to `ConnectedAccount`.
- `PlatformProvider::fetchRecentVideos()` implemented by all three providers,
  with stub-mode fixtures.
- `SocialAccountService::syncVideos()`; `SyncSocialAccountStatsJob` runs it
  alongside the stats sweep.
- `User::avatar_url` accessor: uploaded avatar wins, else the first connected
  account's platform picture. Resolving at read time means a platform sync can
  never clobber a deliberate upload, so no source flag is needed.
- Avatar upload/remove endpoints on settings/profile.
- `CreatorProfileController` passes platform videos + in-platform entry videos.

### Frontend
- `VideoRail` — horizontal snap-scrolling rail with arrow controls.
- `VideoCard` — platform-tinted tile: thumbnail, duration, views/likes/comments.
- `AvatarUploader` in settings/profile.
- Creator profile renders a rail per platform plus a "Made on ProductMarket" rail
  of entry videos, which play inline.

## Out of scope
- Backfilling avatars for existing users (the sync picks them up on next run).
- Video sync for brands.
