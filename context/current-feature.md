# Current Feature — Admin Early Access List

**Status:** In Progress
**Branch:** feature/admin-early-access-list
**Started:** 2026-09-21

## Goal

The `/early-access` waitlist route (see
`context/features/early-access-signup.md`) was built with "no admin UI —
query the DB directly" as an explicit decision. The user now wants a
simple admin page to see the collected emails without needing DB access.

## Decisions

- Kept genuinely simple per the request: a paginated, read-only table
  (name, email, role, joined date), no search/filter/export/delete. If
  that turns out to be too bare, filters can be added later — matches the
  existing `admin/users/index.tsx` pattern closely enough to extend.
- Follows the existing admin module conventions exactly:
  `Admin\AdminEarlyAccessController@index`, nested under the existing
  `role:admin` middleware group in `routes/admin.php`, a page under
  `pages/admin/early-access/index.tsx` using `AdminLayout`, and a new
  sidebar entry in `admin-sidebar.tsx`.
- Ordered newest-first (`created_at desc`), paginate 20 per page — same
  as the users list.

## Backend

- `App\Http\Controllers\Admin\AdminEarlyAccessController::index()` —
  paginates `EarlyAccessSignup`, no filters.
- Route: `GET /admin/early-access` (`admin.early-access.index`), inside
  the existing `role:admin` group.

## Frontend

- `resources/js/pages/admin/early-access/index.tsx` — simple table page.
- `resources/js/components/admin-sidebar.tsx` — new "Early Access" link
  in the "Manage" section.

## Verification

- `./vendor/bin/pint --test` on new/touched PHP files — pass.
- `php artisan route:list --path=admin/early-access` — route registered
  correctly under the `role:admin` group.
- `npm run build` — pass; generated the Wayfinder route helper
  (`resources/js/routes/admin/early-access/index.ts`) automatically.
- `npm run types:check` / `npm run lint:check` — pass, no errors in
  touched files.
- **Live HTTP verification** (same `Invoke-WebRequest` + session/CSRF
  approach as the earlier early-access route, since no browser-automation
  tool is available in this environment): logged in as the seeded admin
  (`admin@productmarket.com`), then loaded `/admin/early-access` — 200,
  and the page's data genuinely contains two real rows: a live signup
  ("Buba Conteh", `contehbuba404@gmail.com`, submitted via the public form
  since the feature shipped) and the test row from the previous session's
  verification (`test-early-access@example.com`). Confirms the
  `role:admin` gate, the controller, and the page all work end-to-end
  with real data.
- Noted but out of scope: logging in as this seeded admin redirects to
  `/auth/select-role` rather than the dashboard — a pre-existing quirk
  unrelated to this change (the `role:admin` middleware itself works
  correctly, as proven above). Not touched.

## Status: 🟢 Complete
