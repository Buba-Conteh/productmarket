# Early Access Signup Route

**Status:** 🟢 Complete
**Branch:** feature/early-access-signup (merged, deleted)

## Overview

A temporary, standalone public route, `/early-access`, that collects an
email list of interested creators and brands. Not part of the core
84-feature roadmap in `context/project-overview.md` — a marketing/lead
capture utility meant to run alongside (not replace) the existing
registration flow.

## Flow

```
GET  /early-access   → role picker (Creator / Brand) + name (optional) + email
POST /early-access   → validate → create row → redirect back with flash
                        "You're on the list!" success message
```

## Backend

| File | Purpose |
|---|---|
| `database/migrations/2026_09_20_100000_create_early_access_signups_table.php` | `early_access_signups` — ulid id, nullable `name`, unique `email`, `role` enum(creator,brand), timestamps |
| `app/Models/EarlyAccessSignup.php` | ULID model, fillable name/email/role |
| `app/Http/Controllers/EarlyAccessController.php` | `show()` renders the page with the flash `status`; `store()` validates (email required+unique, role required in creator/brand, name optional) and creates the row |
| `routes/web.php` | `GET /early-access` (`early-access.show`) and `POST /early-access` (`early-access.store`, `throttle:10,1`) — both public, no auth |

## Frontend

| File | Purpose |
|---|---|
| `resources/js/pages/early-access.tsx` | Role toggle (reuses the Brand/Creator card pattern from `auth/select-role.tsx`), name + email fields, submit button disabled until a role is picked, green flash-status message on success |
| `resources/js/app.tsx` | Added one layout-switch case (`name === 'early-access'`) so the page uses the guest-friendly `AuthLayout` — its name doesn't match the existing `auth/`-prefix case and would otherwise fall through to the authenticated `AppLayout` default |

## Decisions

- **Standalone, unlinked route.** Confirmed with the user: shared directly
  (ads, social bio), not surfaced in `welcome.tsx`'s nav, since
  registration is already open on the main site.
- **No admin UI.** Signups are queried directly from the DB (tinker/DB
  client) rather than building a page for what's meant to be temporary.
- **One combined form**, not separate creator/brand routes — both
  audiences answer the same three fields.
- **Inline `$request->validate()`**, not a FormRequest class — matches
  the existing pattern for other small guest flows (`PhoneAuthController`,
  `RoleSelectionController`).
- **Unique on email** across both roles, with a friendly "You're already
  on the list" message on conflict rather than the default Laravel
  "has already been taken."

## Verification

- Pint — pass on new files.
- Migration ran cleanly; both routes confirmed via `route:list`.
- `tsc --noEmit`, ESLint, and `npm run build` — all pass.
- Live HTTP check against the local Herd site (no browser-automation tool
  was available, so driven via `Invoke-WebRequest` with a real session +
  CSRF cookie rather than a real browser):
  - `GET /early-access` resolves to the Inertia `early-access` component.
  - A valid submission redirects back with the flash success message.
  - Resubmitting the same email surfaces the "already on the list"
    validation error — which also confirms the first row was persisted.
- Not confirmed visually: the disabled-submit-button state and the
  success message's styling, which need a real browser to see rendered.

## Follow-ups

- This is explicitly temporary. When real registration fully replaces the
  need for a waitlist, drop the route, controller, page, and (if desired)
  export + drop the `early_access_signups` table.
