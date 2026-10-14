# Email Verification by Code

**Status:** 🟡 Implemented — awaiting staging verification
**Branch:** `feature/email-verification-code`
**Date:** 2026-10-13

## Overview

New email/password signups used to verify by clicking a signed link. They now get a
6-digit code by email and type it on the "Verify email" screen. This matches the
phone-OTP flow creators already use and avoids problems where the link opens in a
different browser from the one the user signed up in.

## How it works

1. Fortify fires `Registered` → Laravel calls `User::sendEmailVerificationNotification()`.
2. That method is overridden to call `EmailVerificationCodeService::send()`, which:
   - invalidates any unused codes for the user,
   - stores a new code **hashed** in `email_verification_codes` with a 10-minute expiry,
   - emails it via the `VerifyEmailCode` notification (sent synchronously, not queued,
     so it arrives without a queue worker).
3. The user enters the code on `auth/verify-email`, which posts to
   `POST /email/verify-code` (`verification.code`, `throttle:6,1`).
4. `EmailVerificationCodeController::store` calls `EmailVerificationCodeService::verify()`;
   on success the email is marked verified, `Verified` is dispatched, and the user is
   redirected to their intended page / dashboard.
5. "Resend" uses Fortify's existing `verification.send` route, which calls the same
   overridden method — so it sends a fresh code and kills the old one.

### Security

- Codes are stored hashed (`Hash::make`), never plain text.
- 5 wrong attempts burn a code; route is throttled to 6 requests/minute.
- Only the most recent unexpired, unconsumed code is accepted.

### Backward compatibility

- Fortify's signed-link route (`verification.verify`) is untouched, so links emailed
  before this change still verify.
- Additive migration only.

## Files

| File | Purpose |
|---|---|
| `database/migrations/2026_10_13_100000_create_email_verification_codes_table.php` | New table |
| `app/Models/EmailVerificationCode.php` | Model |
| `app/Services/EmailVerificationCodeService.php` | Generate / send / verify codes |
| `app/Notifications/VerifyEmailCode.php` | Email containing the code |
| `app/Http/Controllers/Auth/EmailVerificationCodeController.php` | Handles code submission |
| `app/Models/User.php` | Overrides `sendEmailVerificationNotification()` |
| `config/auth.php` | `email_verification_code` (length, ttl, max_attempts — env-overridable) |
| `routes/web.php` | `POST email/verify-code` |
| `resources/js/pages/auth/verify-email.tsx` | OTP input + resend |
| `tests/Feature/Auth/EmailVerificationCodeTest.php` | Code flow tests |

## Config

```
EMAIL_VERIFICATION_CODE_LENGTH=6
EMAIL_VERIFICATION_CODE_TTL=600        # seconds
EMAIL_VERIFICATION_CODE_MAX_ATTEMPTS=5
```

## Testing

- `./vendor/bin/pest tests/Feature/Auth` — all email verification tests pass.
- `PasswordResetTest > password can be reset with valid token` fails on `staging` too
  (the test uses a weak password the current rules reject) — unrelated to this feature.
