# Shorter Email Signup — Role Chosen After Registering

**Status:** 🟢 Implemented, awaiting staging test
**Branch:** `feature/signup-role-after-register`

## Overview

The email signup form had five fields, including an "I am a" Brand/Creator dropdown. The dropdown is removed. Email signups now pick their role on the same card screen (`/auth/select-role`) that Google and phone signups already use.

Form: **Name, Email, Password, Confirm password.**

Flow: Register → verify email → choose Brand or Creator → onboarding → dashboard.

## Implementation

- `CreateNewUser` no longer validates or assigns a role. It creates the user and stashes two optional values in the session:
  - `preferred_role` — from `?role=brand|creator` on the register URL (landing page CTAs). Only `brand`/`creator` are accepted.
  - `pending_referral_code` — from `?ref=CODE`.
- `RoleSelectionController`
  - `show()` passes `preselectedRole` so the matching card is already highlighted.
  - `store()` assigns the role, then attaches the pending referral (it needs the role as the referral type), then clears the session keys.
- `register.tsx` — role Select removed. Reads `role`/`ref` from the Inertia `url` and sends them as hidden inputs (`preferred_role`, `ref`). Tab order renumbered.
- `select-role.tsx` — accepts `preselectedRole` as the initial selection.

## Notes

- The role screen sits behind the `verified` middleware, so email users choose a role after verifying their email.
- The register form never sent `ref` before, so `/register?ref=CODE` referral links did not attach a referral on email signups. They now do.
- The session values are lost if the user verifies on a different browser; the role screen then simply shows no preselection and referrals are not attached.

## Tests

`tests/Feature/Auth/RegistrationTest.php` rewritten: register without role, preferred role carried to role step, invalid preferred role ignored, role assigned on role step, referral attached after role chosen, password confirmation still required. The old tests used a password that fails the current password rules, so they now use a valid one.

Known failures not caused by this change: `PasswordResetTest` (weak test password) and `DashboardTest` "users without a role can visit the dashboard" (the onboarding gate now redirects roleless users).
