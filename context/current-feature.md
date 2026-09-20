# Current Feature — Creator UI Polish: Sidebar Navigation

**Status:** In Progress
**Branch:** fix/creator-sidebar-nav
**Started:** 2026-09-20

## Goal

Part 2 of 4. Messages, Analytics, and Referrals pages are fully built and
routed but have no entry in the sidebar
([app-sidebar.tsx](../resources/js/components/app-sidebar.tsx)), so they're
only reachable by typing the URL directly. A prior commit (`312c3ec`)
removed these links, describing them as "unimplemented" — inaccurate for
these three (only Achievements/Billing were genuinely unimplemented).

Add them back for both `creatorSections` and `brandSections` (Analytics has
a role-specific route for each; Messages and Referrals are shared).

## Routes (confirmed in routes/*.php)

- Messages → `/messages` (`messages.index`) — both roles.
- Analytics → `/creator/analytics` (creator) / `/analytics` (brand).
- Referrals → `/referrals` (`referrals.index`) — both roles.

## Decisions

- Keep using raw path strings (`/messages`, etc.) to match the existing
  convention in `app-sidebar.tsx` rather than switching to Wayfinder route
  helpers, since neither is imported there today.
- Add Messages under a new "Communication" section, Analytics under a
  renamed/expanded existing section, Referrals under "Growth" — for both
  brand and creator, since both are affected by the same missing-links bug.
- Do not touch Achievements/Billing (genuinely not implemented per the
  removal commit).

## Scope

- `resources/js/components/app-sidebar.tsx` only.

## Verification

- `npm run types:check` — pass.
- `npm run lint:check` — no errors in `app-sidebar.tsx`.
- `npm run build` — pass.

## Status: 🟢 Complete
