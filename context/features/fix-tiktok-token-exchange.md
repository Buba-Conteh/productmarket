# Fix — TikTok token exchange sent client_id instead of client_key

**Status:** 🟢 Complete
**Branch:** `fix/tiktok-token-exchange-client-key`
**Date:** 2026-09-22

## Symptom

After the callback routing fix, TikTok returned the creator to the correct
controller, but connecting failed with the generic alert:
"We couldn't connect your tiktok account. Try again shortly."

## Root cause

`AbstractOAuthProvider::exchangeCodeForToken()` and `refreshAccessToken()` both
hardcoded `client_id` in the POST body. TikTok's `/v2/oauth/token/` requires
**`client_key`**. The class already encodes this difference —
`TikTokProvider::clientIdParamName()` returns `client_key` — but it was only
applied when building the authorization URL, never to the token request.

TikTok rejected the exchange, `SocialAccountController::callback()` caught the
exception, and the creator saw the generic message.

Not a sandbox limitation — it fails identically against production credentials.
Instagram and YouTube were unaffected, since `clientIdParamName()` defaults to
`client_id`.

## Secondary issue — the real error was hidden

TikTok answers some failures with **HTTP 200 and an `error` body**, which
`$response->failed()` does not catch. `parseTokenResponse()` then threw
"Access token missing from response", discarding TikTok's own
`error_description`, so the log never recorded the actual reason.

## What changed

- **`tokenRequestPayload()`** — builds the credential pair using
  `clientIdParamName()`, so TikTok receives `client_key` and everyone else keeps
  `client_id`. Used by both the code exchange and the refresh.
- **`tokenResponseError()`** — returns the platform's own error message for a
  failed status *or* a 2xx response carrying an `error` payload, and combines
  `error` with `error_description`. A success reported as `error: "ok"` (or
  `{code: "ok"}`) is correctly treated as success. The real reason now reaches
  the `social_account_connect_failed` log line.

## Verification
- `php artisan test tests/Feature/Social` — 15 passed (68 assertions).
- New `TokenExchangeTest` asserts against a faked HTTP layer that TikTok's request
  carries `client_key` and no `client_id`; that YouTube still sends `client_id`;
  that a 200-with-error response throws carrying `invalid_grant: ...`; and that
  `error: "ok"` is not mistaken for a failure.
- `npm run build`, `pint` — pass.

## If it still fails after this

The genuine platform error is now logged. On production check:

```
tail -n 100 storage/logs/laravel.log | grep social_account_connect_failed
```

The `error` field holds TikTok's own message (e.g. an unapproved scope, an
unregistered redirect URI, or a sandbox account that is not on the app's test-user
list).
