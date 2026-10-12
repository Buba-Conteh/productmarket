# Featured Videos on Connect

**Status:** 🟢 Complete
**Branch:** `feature/featured-videos-on-connect`
**Date:** 2026-10-12

## Overview

Creators who haven't made any videos on ProductMarket yet should still have a featured reel on the creator directory, quick view and video browser — filled from their TikTok (and Instagram / YouTube) account.

## What already existed

`FeaturedVideoService::forCreators()` already builds the reel as **ProductMarket entry videos first, then the creator's synced platform videos** (`creator_videos`, ordered by views), capped at 10. A creator with no entries therefore gets a reel made entirely of their TikTok videos — *if* those videos have been synced.

## The gap

`SocialAccountService::connect()` saved the account and stats but never fetched videos. Videos only arrived via `SyncSocialAccountStatsJob`, scheduled every 12 hours (`SOCIAL_STATS_SYNC_FREQUENCY_HOURS`) and only executed when both the scheduler and a queue worker are running. A newly connected creator showed an empty reel until then — or forever, if the scheduler wasn't running.

## Changes

| File | Change |
|---|---|
| `app/Services/Social/SocialAccountService.php` | `connect()` calls `syncVideos()` right after saving the account |
| `app/Http/Controllers/Creator/SocialAccountController.php` | `refresh()` (the "refresh stats" action) now also syncs videos |
| `tests/Feature/Social/SocialConnectCallbackTest.php` | Two tests: connecting TikTok writes `creator_videos`; a creator with no entries gets a TikTok-only featured reel |

## Decisions

- **Synchronous, not queued.** The fetch is one `video.list` call for TikTok. Running it inline means it works without a queue worker; queuing would reintroduce the dependency that caused the gap.
- **Cannot break connect.** `syncVideos()` catches every provider error and returns `null`, so a failed video fetch never fails the OAuth callback — the reel just stays empty until the next sweep.

## Existing creators

Creators who connected before this change only get videos when the scheduled sweep runs. To backfill everyone at once on a server:

```bash
php artisan tinker --execute="dispatch_sync(new App\Jobs\SyncSocialAccountStatsJob);"
```

## Verification

- `tests/Feature/Social` — 35 passed (2 new).
- Full suite — 144 passed, 13 failed; the same 13 fail on `staging` without this change.
- Pint — pass.
- Not seen in a browser: the local DB currently has no connected social accounts.
