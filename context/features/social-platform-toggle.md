# Social Platform Enable/Disable Switch

**Status:** 🟢 Implemented, awaiting staging test
**Branch:** `feature/social-platform-toggle`

## Overview

While TikTok is being fully integrated, only TikTok can be connected. Instagram and YouTube show as blurred, non-clickable rows with a "Coming soon" badge. Which platforms are active is controlled by one env variable:

```
SOCIAL_ENABLED_PLATFORMS=tiktok                     # default
SOCIAL_ENABLED_PLATFORMS=tiktok,instagram,youtube   # turn everything on
```

Enabling `youtube` also enables `youtube-shorts`. Changing the value needs a config refresh/redeploy on environments that cache config.

## Implementation

- `config/social_oauth.php` — `enabled_platforms` parsed from the env var (default `tiktok`).
- `PlatformProviderFactory` — `enabledPlatforms()` and `isEnabled()`.
- `SocialAccountController` — `connect` and `callback` reject disabled platforms (redirect back with a "coming soon" error). `refresh` and `disconnect` are unchanged.
- `CreatorOnboardingController::social()` and `Settings\SocialAccountsController::edit()` pass `enabledPlatforms` to the pages.
- `components/social/platform-availability.tsx` — wrapper that blurs, disables (`inert`) and badges a row. Used in `onboarding/creator/social.tsx` and `settings/social-accounts.tsx`.

## Backward compatibility

- No database changes.
- Creators who already connected Instagram or YouTube still see those accounts normally (not blurred), can refresh them, and can disconnect them. Sync jobs are untouched.
- The page props are additive; the pages fall back to showing all platforms if `enabledPlatforms` is missing.

## Tests

`tests/Feature/Social/PlatformAvailabilityTest.php` (default config, enabling via config, blocked connect and callback, TikTok still works, disconnect of an existing connection allowed, page props).
