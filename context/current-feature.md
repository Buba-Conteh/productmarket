# Current Fix — TikTok (and IG/YouTube) connect callback lands on the dashboard

**Status:** 🟢 Complete — see context/features/fix-social-connect-callback-url.md
**Branch:** `fix/social-connect-callback-url`

## Symptom (production, TikTok sandbox)

A creator grants permission on TikTok, is returned to the site, lands on the
**dashboard**, and the account never shows as connected.

## Root cause

The app has two separate OAuth callbacks:

| Purpose | Route | Controller |
|---|---|---|
| Social **login** | `auth/{provider}/callback` | `SocialAuthController`, inside `Route::middleware('guest')` |
| Account **connect** | `creator/social/{platform}/callback` | `SocialAccountController` |

`config/social_oauth.php` pointed the **connect** flow at the **login** callback:

```php
'redirect' => env('TIKTOK_REDIRECT_URI', '/auth/tiktok/callback'),
```

So TikTok returns the creator to `/auth/tiktok/callback`, which is guarded by
`guest`. The creator is authenticated, so `RedirectIfAuthenticated` sends them
straight to the dashboard and `SocialAccountController@callback` never runs —
no `social_accounts` row is written. `SocialAuthController` could not have
handled it either; its driver map only covers `google` and `linkedin`.

Setting `TIKTOK_REDIRECT_URI` in the environment does not save it, because the
value deployed there is the same login path (it has to be, to match what is
registered in the TikTok developer portal). An empty value is worse:
`url('')` resolves to the site root, which also bounces to the dashboard.

## Scope

1. **`AbstractOAuthProvider::redirectUri()`** — derive the redirect from
   `route('creator.social.callback', ['platform' => ...])`. The connect callback
   becomes the single source of truth and cannot drift onto the login route.
2. **`config/social_oauth.php`** — drop the per-platform `redirect` keys and the
   `*_REDIRECT_URI` env vars for the connect flow. Nothing else reads them.
   (`config/services.php` keeps its own redirects for Socialite *login* — untouched.)
3. **`SocialAccountController`** — stop using `redirect()->intended()` after a
   successful connect. A stale `url.intended` in the session is a second,
   independent way to land on the dashboard. Return the creator to wherever they
   started the connect from (settings or onboarding) instead.

## Required outside the code
The TikTok developer portal must list the new callback as an allowed redirect
URI, exactly: `https://<prod-domain>/creator/social/tiktok/callback`.
Same shape for Instagram and YouTube when those are enabled.

## Out of scope
- The social **login** flow (`SocialAuthController` / Socialite) is not touched.
- No new OAuth scopes or platforms.
