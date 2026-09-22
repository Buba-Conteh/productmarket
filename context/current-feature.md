# Current Fix — TikTok token exchange sends client_id instead of client_key

**Status:** 🟢 Complete — see context/features/fix-tiktok-token-exchange.md
**Branch:** `fix/tiktok-token-exchange-client-key`

## Symptom

With the callback routing fixed, TikTok now returns the creator to the correct
controller, but the connect fails with the generic alert:
"We couldn't connect your tiktok account. Try again shortly."

## Root cause

`AbstractOAuthProvider::exchangeCodeForToken()` and `refreshAccessToken()` both
hardcode `client_id` in the request body:

```php
'client_id' => $this->config[$this->clientIdKey()],
```

TikTok's `/v2/oauth/token/` requires **`client_key`**, not `client_id`. The class
already knows the correct name — `TikTokProvider::clientIdParamName()` returns
`client_key` — but it is only applied when building the authorization URL, not
when exchanging the code. TikTok rejects the exchange, the exception is caught in
`SocialAccountController::callback()`, and the creator sees the generic message.

This is not a sandbox limitation; it fails the same way against production
credentials. Instagram and YouTube are unaffected because `clientIdParamName()`
defaults to `client_id` for them.

## Secondary issue — the real error is hidden

TikTok returns **HTTP 200 with an `error` body** for some failures, so
`$response->failed()` does not catch them. `parseTokenResponse()` then throws the
unhelpful "Access token missing from response", discarding TikTok's actual
`error_description`. The genuine reason never reaches the log.

## Scope

1. Use `clientIdParamName()` in both token requests, so TikTok gets `client_key`.
2. Treat a 2xx response carrying an `error` payload as a failure, and include the
   platform's own `error_description` in the thrown exception so
   `social_account_connect_failed` logs say what actually went wrong.

## Out of scope
- No change to scopes, the callback routing (already fixed), or the login flow.
