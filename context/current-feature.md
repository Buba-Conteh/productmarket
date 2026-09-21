# Current Feature — Early Access List CSV Export

**Status:** In Progress
**Branch:** feature/admin-early-access-export
**Started:** 2026-09-21

## Goal

Follow-up to the admin early-access list
(`context/features/admin-early-access-list.md`): add a CSV export so the
waitlist can be downloaded as an email list (e.g. to import into an email
tool), not just viewed on-screen.

## Decisions

- **CSV via `response()->streamDownload()`**, no new package — the
  codebase has no existing CSV export to match, and Laravel's streamed
  download is the standard, dependency-free way to do this.
- **Exports everything**, ignoring pagination — the admin page has no
  filters, so "export" unambiguously means the full waitlist.
- Columns: Name, Email, Role, Joined At (ISO date) — same fields already
  shown in the table, so the file matches what the admin sees.
- Route sits inside the same `role:admin` group as the list itself.

## Backend

- `AdminEarlyAccessController::export()` — streams `early-access-waitlist-<date>.csv`.
- Route: `GET /admin/early-access/export` (`admin.early-access.export`).

## Frontend

- `pages/admin/early-access/index.tsx` — "Export CSV" button (plain `<a>`
  download link, not an Inertia `Link`, since this is a file download).

## Note

Wayfinder derives its generated JS identifier from the **route name's
last segment**, not the PHP method name — `admin.early-access.export`
collided with the `export` reserved word, so Wayfinder auto-renamed the
named export to `exportMethod`. Renamed the controller method itself to
`exportCsv` (clearer name, avoids any confusion with the JS keyword) and
import the generated helper as `exportMethod as exportWaitlist` on the
frontend.

## Verification

- `./vendor/bin/pint --test` — pass.
- `php artisan route:list --path=admin/early-access` — both routes
  registered inside the `role:admin` group.
- `npm run build` — pass (after fixing the Wayfinder identifier mismatch
  above); `npm run types:check` / `npm run lint:check` — pass.
- **Live HTTP verification**: logged in as the seeded admin and downloaded
  `/admin/early-access/export` — 200, `Content-Type: text/csv`,
  `Content-Disposition: attachment; filename=early-access-waitlist-<date>.csv`,
  and the CSV body contains both real signups with correct columns.

## Status: 🟢 Complete
