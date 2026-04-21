# Phase 5 — View Tracking & Milestones

**Status:** 🟢 Complete  
**Last updated:** 2026-04-19

## Overview

Verified view-count tracking is the platform's core trust differentiator vs. self-reporting. Phase 5 wires in OAuth connections to TikTok, Instagram, and YouTube, a scheduled sync job that pulls verified view counts from each connected account, and milestone detection that triggers automatic Ripple payouts.

**Stub mode** (`VIEW_SYNC_STUB_MODE=true`) lets the full flow run without real API credentials — each provider returns deterministic fake data. Set to `false` once real platform credentials are configured.

## Feature checklist

| # | Feature | Status | Notes |
|---|---|---|---|
| 5.1 | TikTok OAuth | 🟢 Complete | Real API + stub mode; video.list for view counts |
| 5.2 | Instagram OAuth | 🟢 Complete | Real API + long-lived token exchange + stub mode |
| 5.3 | YouTube OAuth | 🟢 Complete | Real API + offline access params + stub mode |
| 5.4 | SyncViewCountJob every 6h | 🟢 Complete | Configurable via `VIEW_SYNC_FREQUENCY_HOURS` |
| 5.5 | Milestone detection — Ripple | 🟢 Complete | Budget cap + per-creator cap both enforced |
| 5.6 | view_sync_logs audit trail | 🟢 Complete | Written on every success/failure |
| 5.7 | Contest deadline resolution | 🟢 Complete | Final sync → rank → payouts → campaign closed |
| 5.8 | Token refresh handling | 🟢 Complete | Hourly job + just-in-time refresh during sync |

## Architecture

```
app/Services/Social/
├── Contracts/PlatformProvider.php         # OAuth + view-fetch interface
├── DataObjects/
│   ├── ConnectedAccount.php               # Profile DTO from provider
│   └── TokenSet.php                       # Access + refresh token DTO
├── Exceptions/PlatformConnectionException.php
├── Providers/
│   ├── AbstractOAuthProvider.php          # Shared OAuth, token refresh, extraAuthParams()
│   ├── TikTokProvider.php                 # TikTok Open API v2
│   ├── InstagramProvider.php              # Instagram Graph API v21 + long-lived token
│   └── YouTubeProvider.php               # YouTube Data API v3 + offline access
├── PlatformProviderFactory.php            # slug → provider
├── SocialAccountService.php               # connect/disconnect/refresh
└── ViewSyncService.php                    # sync + milestone detection

app/Jobs/
├── SyncEntryViewCountJob.php              # single entry (retries 3×)
├── SyncAllLiveEntriesJob.php              # scheduler fans out to per-entry jobs
├── ResolveContestDeadlineJob.php          # final sync + rank + payouts
└── RefreshSocialTokensJob.php             # hourly batch refresh

app/Http/Controllers/Creator/
└── SocialAccountController.php            # redirect / callback / disconnect

resources/js/pages/onboarding/creator/social.tsx  # connect/disconnect UI

routes/creator.php                         # creator-only OAuth routes
config/social_oauth.php                    # client ids, scopes, urls, sync settings
```

## Platform-specific implementation details

### TikTok (`TikTokProvider`)
- Auth URL: `https://www.tiktok.com/v2/auth/authorize/`
- Token URL: `https://open.tiktokapis.com/v2/oauth/token/`
- Profile: `GET /v2/user/info/?fields=open_id,display_name,follower_count,likes_count,video_count`
- View count: `POST /v2/video/list/?fields=id,view_count` — video ID extracted from `tiktok.com/@handle/video/{id}` URL pattern
- Uses `client_key` (not `client_id`) in OAuth params — handled by overriding `clientIdKey()`

### Instagram (`InstagramProvider`)
- Auth URL: `https://www.instagram.com/oauth/authorize`
- Short-lived token: `POST https://api.instagram.com/oauth/access_token`
- Long-lived exchange: `GET https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=...&access_token=...` — done automatically in `exchangeCodeForToken()`, tokens last 60 days
- Refresh: `GET https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=...`
- Profile: `GET /v21.0/me?fields=id,username,followers_count,media_count`
- View count: media ID resolved from URL via oEmbed, then `/{media-id}/insights?metric=plays,video_views`

### YouTube (`YouTubeProvider`)
- Auth URL: `https://accounts.google.com/o/oauth2/v2/auth` + `access_type=offline&prompt=consent` (via `extraAuthParams()`)
- Token URL: `https://oauth2.googleapis.com/token`
- Profile: `GET /youtube/v3/channels?part=snippet,statistics&mine=true`
- View count: video ID extracted from `?v=`, `youtu.be/`, `/shorts/` URL patterns, then `GET /youtube/v3/videos?part=statistics&id={videoId}`
- `subscriberCount` hidden for channels < 1,000 subs (returns 0)

## OAuth flow

1. Creator hits `GET /creator/social/{platform}/connect` — controller generates a CSRF `state`, stashes it in session, redirects to provider authorization URL.
2. Provider redirects back to `GET /creator/social/{platform}/callback?code=...&state=...`. Controller verifies state, exchanges `code` for a `TokenSet`, fetches the creator's profile, and upserts a `social_accounts` row.
3. `oauth_token` + `oauth_refresh_token` are encrypted at rest via the model's `encrypted` cast.
4. Disconnect: `DELETE /creator/social/{platform}`.

Route names: `creator.social.connect`, `creator.social.callback`, `creator.social.disconnect`.

## Onboarding UI

`resources/js/pages/onboarding/creator/social.tsx` shows platform cards for TikTok, Instagram, and YouTube:

- Connected: shows `@handle` + follower count + disconnect button (Inertia DELETE)
- Disconnected: "Connect" button navigates via `window.location.href` (full-page, not Inertia, so session state is set before redirect)
- "Continue" button enabled once ≥1 account connected; skip link always available
- Flash error shown when OAuth callback returns with an error

## Sync flow

Every `VIEW_SYNC_FREQUENCY_HOURS` hours (default: 6):

1. `SyncAllLiveEntriesJob` finds entries with status `live` or `approved` that have at least one `posted_url`, and dispatches `SyncEntryViewCountJob` per entry (chunked by 100).
2. Per-entry job calls `ViewSyncService::syncEntry()` — iterates each `(entry, platform)` pivot with a `posted_url`.
3. For each pair:
   - `SocialAccountService::refreshIfNeeded()` runs first — refreshes the token if within the buffer window.
   - Provider fetches the view count via the appropriate API.
   - Pivot updated, `view_sync_logs` row written.
   - If Ripple entry: `detectAndQueueMilestones` compares old vs new total views, queues a `ripple_milestone` payout per new crossing (budget cap + creator cap enforced).

Failed syncs are logged to `view_sync_logs` with `success=false` and `error_message`. The next scheduled tick retries automatically.

## Contest resolution

Hourly, the scheduler finds active contest campaigns past their deadline and dispatches `ResolveContestDeadlineJob`:

1. Final view sync on all `live` entries.
2. Rank by `sum(verified_view_count)` across platforms.
3. Winner: `status → won`, `winner_entry_id` set on `campaign_contest_details`.
4. Others: `status → not_selected`.
5. `contest_prize` payout created; `contest_runner_up` payout created if `runner_up_prize > 0`.
6. Campaign: `status → completed`.

## Token refresh handling

`RefreshSocialTokensJob` runs hourly. Finds `social_accounts` expiring within `OAUTH_TOKEN_REFRESH_BUFFER_MINUTES` (default 60) and calls `SocialAccountService::refreshIfNeeded()`. Each provider implements `refreshAccessToken()`:

- TikTok / YouTube: standard `refresh_token` POST grant
- Instagram: `ig_refresh_token` GET grant (no `refresh_token` field — uses the access token itself)

Just-in-time refresh also fires inside `ViewSyncService` before every fetch.

## Scheduler registration

All jobs registered in `routes/console.php` conditionally on `VIEW_SYNC_ENABLED`:

| Cron | Job |
|---|---|
| `0 */6 * * *` | `SyncAllLiveEntriesJob` |
| Hourly | `RefreshSocialTokensJob` |
| Hourly | Contest deadline check → `ResolveContestDeadlineJob` per expired campaign |

All use `withoutOverlapping()`.

## Environment variables

```
TIKTOK_CLIENT_KEY=
TIKTOK_CLIENT_SECRET=
TIKTOK_REDIRECT_URI=https://yourdomain.com/creator/social/tiktok/callback

INSTAGRAM_CLIENT_ID=
INSTAGRAM_CLIENT_SECRET=
INSTAGRAM_REDIRECT_URI=https://yourdomain.com/creator/social/instagram/callback

YOUTUBE_CLIENT_ID=
YOUTUBE_CLIENT_SECRET=
YOUTUBE_REDIRECT_URI=https://yourdomain.com/creator/social/youtube/callback

VIEW_SYNC_ENABLED=true
VIEW_SYNC_FREQUENCY_HOURS=6
VIEW_SYNC_STUB_MODE=true          # set false to use real APIs
OAUTH_TOKEN_REFRESH_BUFFER_MINUTES=60
```

## Switching from stub to live

1. Register developer apps: TikTok for Developers, Meta App Dashboard, Google Cloud Console.
2. Configure approved scopes + redirect URIs matching `config/social_oauth.php`.
3. Populate env vars above.
4. Set `VIEW_SYNC_STUB_MODE=false`.
5. All three providers now have real HTTP calls implemented — no further code changes needed.

## Known limitations / future work

- **Webhooks** — platforms that support push notifications (Instagram Graph, YouTube PubSubHubbub) could replace polling. Not in scope for Phase 5.
- **Rate limit backoff** — jobs retry 3× with 60s backoff. Under real load, per-platform Redis throttling may be needed.
- **YouTube subscriber count** — hidden for channels under 1,000 subscribers (API returns 0).
- **Instagram oEmbed** — requires the app to be approved for `instagram_business_basic` scope; in sandbox only test accounts can be connected.
