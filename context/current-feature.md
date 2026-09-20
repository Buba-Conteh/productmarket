# Current Feature — Creator UI Polish: Shared Campaign/Entry Cards

**Status:** In Progress
**Branch:** feature/shared-campaign-entry-cards
**Started:** 2026-09-20

## Goal

Part 4 of 4 (last item). `campaigns/creator/index.tsx:279-365` (campaign
discovery grid) and `entries/creator/index.tsx:130-233` (my-entries grid)
each hand-build a nearly identical tile: image-or-gradient thumbnail with a
letter fallback, a type badge + status badge overlaid on top, budget/entry
metadata, platform badges. Both files also independently define an
identical `TYPE_GRADIENTS` map. Extract this into reusable components.

## Decisions

- **`CampaignThumbnail`** (`resources/js/components/campaigns/campaign-thumbnail.tsx`)
  is the shared presentational piece: renders the image-or-gradient
  fallback and exposes `topOverlay`/`bottomOverlay` slots for badges, since
  the two cards' badge sets differ (discovery: type + entry-status; entries:
  type + entry-status + view count).
- **`CAMPAIGN_TYPE_LABELS` / `CAMPAIGN_TYPE_GRADIENTS`** move to
  `resources/js/lib/campaign-type.ts` as the single source of truth,
  replacing the two duplicated `TYPE_GRADIENTS` maps.
- **`CampaignCard`** (`resources/js/components/campaigns/campaign-card.tsx`)
  and **`EntryCard`** (`resources/js/components/entries/entry-card.tsx`)
  stay as two separate components rather than one mega-component with
  conditional branches — their card bodies (budget row vs bid row,
  entries-count vs view-count) are different enough that forcing a single
  component would need more branching than it saves.
- **Scope is creator-side only** — `campaigns/creator/index.tsx` and
  `entries/creator/index.tsx`. The same `TYPE_GRADIENTS`/`STATUS_STYLES`
  duplication also exists on the brand side (`campaigns/brand/*.tsx`,
  `entries/brand/*.tsx`) and in `entries/creator/show.tsx`, but those
  weren't part of the agreed scope (creator card/grid pages specifically).
  Noted as a follow-up in the feature doc, not touched here.

## Scope

- New: `resources/js/lib/campaign-type.ts`
- New: `resources/js/components/campaigns/campaign-thumbnail.tsx`
- New: `resources/js/components/campaigns/campaign-card.tsx`
- New: `resources/js/components/entries/entry-card.tsx`
- Edit: `resources/js/pages/campaigns/creator/index.tsx` (use `CampaignCard`)
- Edit: `resources/js/pages/entries/creator/index.tsx` (use `EntryCard`)

## Verification

- `npm run types:check` — pass.
- `npm run lint:check` — one real issue found and fixed (missing blank
  line before a `return` in the extracted `EntryStatusBadge`); no other
  errors in touched/new files.
- `npm run build` — pass.
- **Not done:** a live browser check. This was a structural extraction —
  every className/prop/conditional was moved as-is into the new
  components, nothing was rewritten — so type-check + lint + build cover
  it well, but an authenticated creator session with seeded campaigns/
  entries would be needed to visually confirm pixel parity.

## Status: 🟢 Complete (pending optional browser check)
