# Current Feature — Connected Social Account Metrics on the Creator Profile

**Status:** 🟢 Complete — see `context/features/5.x-social-account-metrics-sync.md`
**Branch:** `feature/social-account-metrics-sync`

## Goal

When a creator connects TikTok (or Instagram / YouTube), the account must show as
**connected** everywhere it is surfaced, and the metrics for that specific account
(followers, total likes, post count, avg views, engagement) must be queried from the
platform and displayed on the creator's profile — and stay fresh, not frozen at the
moment of connection.

## Gaps found in the current implementation

1. **Metrics are fetched exactly once, at connect time.** `fetchAccountProfile()` is
   only called from `SocialAccountService::connect()`. Nothing ever re-queries the
   platform for account-level stats, so `follower_count`, `total_likes`, `post_count`
   and `avg_views` are frozen forever. `PlatformProvider::fetchFollowerCount()` is
   declared on the contract and implemented by all three providers but never called
   from anywhere in the app.
2. **Instagram accounts never appear on the public profile.** `InstagramProvider`
   sets `verified: false` on connect, and `CreatorProfileController` filters
   `->where('verified', true)` on both `show()` and `mediaKit()`. A creator can
   connect Instagram successfully and it is invisible on their profile.
3. **The profile drops the richer stats.** `total_likes` and `post_count` are stored
   and shown on the settings page, but the public profile and media kit only pass
   followers / avg views / engagement.
4. **No way to refresh on demand.** A creator whose follower count has moved has no
   way to pull fresh numbers short of disconnecting and reconnecting.

## Scope

### Backend
- `SocialAccountService::syncStats()` — re-query the platform for an already-connected
  account using the stored (auto-refreshed) token and persist the metrics. Never
  overwrites a known value with an empty one, because the real TikTok/Instagram/YouTube
  profile endpoints return `0` for `avg_views` / `engagement_rate`.
- `SyncSocialAccountStatsJob` — scheduled sweep that refreshes every connected account,
  gated by the existing `social_oauth.sync.enabled` flag.
- `SocialAccountController::refresh()` + `POST creator/social/{platform}/refresh` —
  on-demand refresh from the settings page, rate limited.
- `CreatorProfileController` — show every connected account (not just `verified`), and
  pass `verified`, `total_likes`, `post_count`, `last_synced_at` through.

### Frontend
- Shared `SocialStatChips` component so settings, onboarding, and the profile render
  the same metric set the same way.
- `profiles/creator/show.tsx` + `media-kit.tsx` — likes and posts alongside followers,
  plus a "Verified" marker on accounts the platform confirmed.
- `settings/social-accounts.tsx` — "Refresh" action per connected account.

### Tests
- Feature test covering connect → stats stored → profile shows the account, refresh
  updates the numbers, and an unverified (Instagram) account still appears.

## Out of scope
- New OAuth scopes or new platforms.
- Meilisearch indexing of creator profiles (7.5, still not started).
