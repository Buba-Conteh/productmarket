# UI Polish 1 — Header Cleanup

**Status:** 🟢 Complete
**Branch:** fix/header-cleanup (merged, deleted)

## Overview

First of four creator-facing UI/process improvements. Removed Laravel
react-starter-kit leftovers from the global app header
([app-header.tsx](../../resources/js/components/app-header.tsx)) that made
the app read as unfinished scaffolding rather than a finished product:

- "Repository" link → `github.com/laravel/react-starter-kit`
- "Documentation" link → `laravel.com/docs/starter-kits#react`
- A search icon button with no click handler (dead control, no global
  search exists yet)

## Decisions

- No global search exists (Meilisearch indexing is deferred — see 3.11/7.5
  in `context/project-overview.md`), so the search button was removed
  rather than wired to a fake action. Can come back once search ships.
- The `rightNavItems` array (holding the two starter-kit links) was deleted
  entirely along with the now-unused `Tooltip`, `BookOpen`, `Folder`,
  `Search`, and `toUrl` imports.

## Verification

- `npm run types:check` — pass.
- `npm run lint:check` — no errors in the touched file.
- `npm run build` — pass.
