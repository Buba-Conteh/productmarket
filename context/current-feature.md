# Current Feature — Google & Phone (SMS OTP) Signup

**Status:** In Progress
**Branch:** feature/google-phone-signup
**Started:** 2026-07-15

## Goal

Let people sign up / log in with:

1. **Google** — surface the existing OAuth flow on the register page (already on
   login) and fix the role gap: social users were created with **no role**.
2. **Phone number** — passwordless SMS OTP: enter phone → 6-digit code → verify.

Both new-account paths funnel through a shared **"select role"** step (Brand vs
Creator) before onboarding, since Google/phone don't carry a role.

## Decisions

- **Phone = passwordless SMS OTP** (lowest-friction rollout, no password to manage).
- **Provider = Vonage**, behind an `SMS_STUB_MODE` flag that mirrors the existing
  `ESCROW_STUB_MODE` pattern — stub logs the code locally (free, works on dev/
  staging); real Vonage send only when `SMS_STUB_MODE=false` + keys present.
- **Google role = asked after** the OAuth round-trip.

## Backend

- Migration: `users.phone` (nullable, unique) + `users.phone_verified_at`; make
  `users.email` **nullable** so phone-only accounts can exist.
- Migration + model: `phone_verification_codes` (ULID) — hashed code, expiry,
  attempts, consumed_at.
- `config/sms.php` — `stub_mode`, `from`, OTP length/TTL, Vonage keys.
- `App\Services\Sms\SmsService` — `send()`; stub logs, otherwise Vonage.
- `App\Services\PhoneOtpService` — generate (hash + store), verify, cooldown.
- `App\Http\Controllers\Auth\PhoneAuthController` — phone entry, send, verify page,
  verify, resend. Find-or-create user by phone; passwordless login.
- `App\Http\Controllers\Auth\RoleSelectionController` — show + assign role.
- `EnsureOnboardingComplete`: role-less verified user → redirect to role select.
- Rate limiting via `throttle` on send/resend + per-phone cooldown in service.

## Frontend

- `auth/register.tsx` — add "Continue with Google" + "Sign up with phone".
- `auth/login.tsx` — add "Continue with phone" (Google already present).
- `auth/phone.tsx` — phone entry.
- `auth/phone-verify.tsx` — OTP entry + resend (uses existing `InputOTP`).
- `auth/select-role.tsx` — Brand / Creator choice.

## Notes / follow-ups

- Phone-only accounts have `email = null`. Downstream Stripe customer creation
  (brand onboarding) and email notifications assume an email — a future step can
  prompt phone users to add an email. Out of scope for this feature.
- Real Vonage send requires `SMS_STUB_MODE=false` + `VONAGE_KEY`/`VONAGE_SECRET`.

## Status: 🟢 Complete

Full write-up in `context/features/1.16-google-phone-signup.md`.
