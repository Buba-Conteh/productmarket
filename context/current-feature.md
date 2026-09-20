# Current Feature — Creator UI Polish: Header Cleanup

**Status:** In Progress
**Branch:** fix/header-cleanup
**Started:** 2026-09-20

## Goal

Part 1 of a 4-part creator UI/process improvement pass. Remove Laravel
react-starter-kit leftovers from the global app header
([app-header.tsx](../resources/js/components/app-header.tsx)) that read as
unfinished, generic scaffolding rather than product UI:

- "Repository" link → `github.com/laravel/react-starter-kit`
- "Documentation" link → `laravel.com/docs/starter-kits#react`
- A search icon button with no click handler (dead control)

## Decisions

- No real global search exists yet (Meilisearch indexing is deferred per
  `context/project-overview.md` 3.11/7.5), so the search button is removed
  rather than wired to a fake action. Can be reintroduced once search ships.
- `rightNavItems` (the Repository/Documentation array) is removed entirely
  since nothing else in the codebase references it.

## Scope

- `resources/js/components/app-header.tsx` only. No route/controller changes.

## Verification

- `npm run types:check` — pass.
- `npm run lint:check` — no errors in `app-header.tsx` (remaining errors in
  output are pre-existing, in files this change doesn't touch).
- `npm run build` — pass.

## Status: 🟢 Complete — ready to commit

Awaiting user confirmation to commit per workflow.
