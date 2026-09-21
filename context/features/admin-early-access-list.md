# Admin Early Access List

**Status:** 🟢 Complete
**Branch:** feature/admin-early-access-list (merged, deleted)

## Overview

A simple, read-only admin page to view the `/early-access` waitlist (see
[early-access-signup.md](early-access-signup.md)) without needing direct
DB access. Supersedes that feature's original "no admin UI" decision.

## Backend

| File | Purpose |
|---|---|
| `app/Http/Controllers/Admin/AdminEarlyAccessController.php` | `index()` — paginates `EarlyAccessSignup` (20/page, newest first), no filters. `exportCsv()` — streams the full (unpaginated) list as `early-access-waitlist-<date>.csv` |
| `routes/admin.php` | `GET /admin/early-access` (`admin.early-access.index`) and `GET /admin/early-access/export` (`admin.early-access.export`), both nested inside the existing `role:admin` middleware group |

## Frontend

| File | Purpose |
|---|---|
| `resources/js/pages/admin/early-access/index.tsx` | Plain table — Name, Email, Role (badge), Joined date — with the same pagination footer as `admin/users/index.tsx`, plus an "Export CSV" download button next to the heading |
| `resources/js/components/admin-sidebar.tsx` | New "Early Access" link in the "Manage" section |

## CSV export

Added as a same-day follow-up so the waitlist can be downloaded as an
email list. Streams via `response()->streamDownload()` — no new package.
Exports every row (ignores pagination, since the page has no filters to
scope by). Columns: Name, Email, Role, Joined At.

**Wayfinder gotcha:** the route name's last segment (`export`) is a JS
reserved word. Wayfinder derives its generated identifier from that
segment, not the PHP method name, and auto-renamed the named export to
`exportMethod` to avoid a syntax error. The controller method itself is
named `exportCsv` (unaffected — that's just the PHP side); the frontend
imports the generated helper as `import { exportMethod as exportWaitlist }`.

## Decisions

- Kept genuinely simple, matching the request: no search, filter, export,
  or delete — just a paginated read-only table. Can be extended later
  using `admin/users/index.tsx` as the reference pattern if needed.
- Reused the existing admin module conventions exactly (controller
  naming, route nesting, `AdminLayout`, role-badge styling) rather than
  introducing anything new.

## Verification

- Pint — pass.
- `route:list` confirms the route sits inside the `role:admin` group.
- `npm run build` generated the Wayfinder route helper automatically;
  `tsc --noEmit` and ESLint both pass.
- Live HTTP check (session + CSRF via `Invoke-WebRequest`, no browser
  automation tool available in this environment): logged in as the seeded
  admin account and loaded `/admin/early-access` — 200, with real
  paginated signup data, including one genuine signup submitted via the
  public form since that feature shipped.
