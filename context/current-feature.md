# Current Feature — Early Access Signup Route

**Status:** In Progress
**Branch:** feature/early-access-signup
**Started:** 2026-09-20

## Goal

A temporary, standalone public route to collect an email list of
interested creators and brands ahead of/alongside the existing
registration flow. Not part of the core roadmap in
`context/project-overview.md` — a marketing/lead-capture utility.

## Decisions

- **Standalone route, not linked from `welcome.tsx`.** Confirmed with the
  user: `/early-access` is a URL to be shared directly (ads, social bio),
  not surfaced in the main site nav, since registration is already open.
- **No admin UI.** Signups land in a plain table; confirmed with the user
  that querying the DB directly (tinker/DB client) is enough since this is
  meant to be temporary.
- **One combined form, not two.** A single page with a Brand/Creator role
  toggle (reusing the visual pattern from `auth/select-role.tsx`), rather
  than separate routes per role — the two audiences answer the same three
  fields (name, email, role).
- **Reuses `AuthLayout`** (the guest-friendly boxed-card layout used by
  login/register/phone) rather than a full custom landing page — this is a
  small utility form, not a marketing page, and `AuthLayout` has no
  authenticated-user dependency so it's safe for a fully public route.
  Since the page name `early-access` doesn't match any existing prefix
  case in `app.tsx`'s layout switch (it would otherwise fall through to
  the authenticated `AppLayout` default), added one explicit case.
- **Inline `$request->validate()` in the controller**, not a separate
  FormRequest class — matches the existing pattern for other small guest
  flows (`PhoneAuthController`, `RoleSelectionController`), appropriate for
  a 3-field temporary route.
- **Unique on email** (across both roles) — prevents duplicate signups;
  a friendly "You're already on the list" message on conflict.

## Backend

- Migration: `early_access_signups` (ulid id, `name` nullable, `email`
  unique, `role` enum contest/... no — enum('creator','brand'), timestamps).
- Model: `App\Models\EarlyAccessSignup` (ULID, fillable name/email/role).
- Controller: `App\Http\Controllers\EarlyAccessController` — `show()`
  renders the page; `store()` validates + creates + redirects back with a
  flash `status` message.
- Routes (`routes/web.php`, public, no auth): `GET /early-access` (show),
  `POST /early-access` (store, throttled `throttle:10,1`).

## Frontend

- `resources/js/pages/early-access.tsx` — role toggle (Brand/Creator, icons
  from `select-role.tsx`), name (optional), email (required), submit,
  flash `status` success message.
- `resources/js/app.tsx` — one new layout-switch case for `early-access`.

## Verification

- `./vendor/bin/pint --test` on new/touched PHP files — pass.
- `php artisan migrate` — table created cleanly.
- `php artisan route:list --path=early-access` — both routes registered.
- `npm run types:check` / `npm run lint:check` — pass, no errors in
  touched files.
- `npm run build` — pass.
- **Live HTTP verification** (no browser-automation tool was available in
  this environment, so driven via `Invoke-WebRequest` with a real session
  + CSRF cookie against the local Herd site, `http://productmarket.test`):
  - `GET /early-access` → 200, Inertia payload resolves to the
    `early-access` component.
  - Valid submission (role=creator, email=test-early-access@example.com)
    → redirects back to the same page with the flash success message
    ("You're on the list...") present in the response.
  - Re-submitting the same email → response contains "already on the
    list", confirming the unique-email validation path (and, by
    necessity, that the first row was actually persisted).
  - A local test row (`test-early-access@example.com`) remains in the
    dev SQLite DB from this check — harmless, dev-only.
  - Did not visually confirm the disabled-submit-button state or the
    green text styling, since that requires a real browser; the
    server-side behavior that matters (validation, persistence, flash
    message) is confirmed above.

## Status: 🟢 Complete
