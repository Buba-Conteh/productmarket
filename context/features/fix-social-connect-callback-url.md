# Fix — social connect callback landed on the dashboard

**Status:** 🟢 Complete
**Branch:** `fix/social-connect-callback-url`
**Date:** 2026-09-22

## Symptom

On production (TikTok sandbox), a creator granted permission on TikTok, was
returned to the site, landed on the **dashboard**, and the account never showed
as connected. Setting `TIKTOK_REDIRECT_URI` in the production environment did
not help.

## Root cause

Two separate OAuth callbacks exist:

| Purpose | Route | Controller |
|---|---|---|
| Social **login** | `auth/{provider}/callback` | `SocialAuthController`, inside `Route::middleware('guest')` |
| Account **connect** | `creator/social/{platform}/callback` | `SocialAccountController` |

`config/social_oauth.php` pointed the **connect** flow at the **login** callback
(`env('TIKTOK_REDIRECT_URI', '/auth/tiktok/callback')`). TikTok therefore returned
the creator to the login route, which is guarded by `guest`. Because the creator
is authenticated, `RedirectIfAuthenticated` sent them to the dashboard before any
controller ran, so `SocialAccountController@callback` never executed and no
`social_accounts` row was written. `SocialAuthController` could not have handled
it either — its driver map only covers `google` and `linkedin`.

Filling the env var did not fix it because the value deployed there was the same
login path (it had to match what was registered in the TikTok portal). An empty
value was worse: `url('')` resolves to the site root, which also bounces to the
dashboard.

A second, independent route to the same symptom: the callback ended with
`redirect()->intended(...)`, so a stale `url.intended` in the session would send
the creator to the dashboard even after a *successful* connect.

## What changed

- **`AbstractOAuthProvider::redirectUri()`** — now returns
  `route('creator.social.callback', ['platform' => ...])`. The connect callback is
  the single source of truth and cannot drift onto the login route.
- **`config/social_oauth.php`** — the per-platform `redirect` keys (and the
  `TIKTOK_/INSTAGRAM_/YOUTUBE_REDIRECT_URI` env vars) are removed. Nothing else
  read them. `config/services.php` keeps its own redirects for Socialite *login*
  and is untouched.
- **`SocialAccountController`** — records the page the connect started from
  (same-host URLs only) and returns the creator there on both success and failure,
  instead of `redirect()->intended()`. Falls back to the settings page for an
  onboarded creator, or the onboarding social step otherwise.

## Required outside the code

The platform developer portal must list the new callback as an allowed redirect
URI, matched exactly:

```
https://<prod-domain>/creator/social/tiktok/callback
```

Same shape for `instagram` and `youtube` when those are enabled. Until the portal
is updated, TikTok will reject the authorization request with a `redirect_uri`
mismatch instead of completing it.

## Verification
- `php artisan test tests/Feature/Social` — 11 passed (63 assertions).
- New `SocialConnectCallbackTest` covers: the authorization URL points at the
  connect callback and not the login callback; the login callback demonstrably
  bounces an authenticated creator to the dashboard (the original bug) while the
  connect callback reaches its controller; a successful connect returns the
  creator to where they started; and a stale `url.intended` no longer diverts
  them to the dashboard.
- `npm run build`, `pint` — pass.
