# UI Polish 4 — Shared Campaign/Entry Cards

**Status:** 🟢 Complete
**Branch:** feature/shared-campaign-entry-cards (merged, deleted)

## Overview

Last of four creator-facing UI/process improvements. The campaign
discovery grid and the my-entries grid each hand-built a near-identical
tile (image-or-gradient thumbnail, letter fallback, type + status badges
overlaid on top, metadata row, platform badges) and each independently
defined the same `TYPE_GRADIENTS` map. Extracted the shared pieces into
reusable components so the two grids can't drift out of sync and future
card-based lists (e.g. a brand-side equivalent) have something to build on.

## New files

| File | Purpose |
|---|---|
| [lib/campaign-type.ts](../../resources/js/lib/campaign-type.ts) | Single source of truth for `CAMPAIGN_TYPE_LABELS` / `CAMPAIGN_TYPE_GRADIENTS`, plus `campaignTypeGradient()`/`campaignTypeLabel()` helpers with a gray fallback for unknown types |
| [components/campaigns/campaign-thumbnail.tsx](../../resources/js/components/campaigns/campaign-thumbnail.tsx) | `CampaignThumbnail` — image-or-gradient-fallback thumbnail with `topOverlay`/`bottomOverlay` slots for badges |
| [components/campaigns/campaign-card.tsx](../../resources/js/components/campaigns/campaign-card.tsx) | `CampaignCard` — full discovery grid tile (thumbnail, type/entry-status badges, budget/entry-count/deadline row, platform badges) |
| [components/entries/entry-card.tsx](../../resources/js/components/entries/entry-card.tsx) | `EntryCard` — full my-entries grid tile (thumbnail, type/status badges, view count, bid info, platform badges, rejection reason) |

## Changed files

- [pages/campaigns/creator/index.tsx](../../resources/js/pages/campaigns/creator/index.tsx) — now renders `<CampaignCard>` per campaign instead of ~90 lines of inline JSX; local `TYPE_LABELS`/`TYPE_GRADIENTS`/`budgetDisplay`/`formatDate`/`EntryStatusBadge` removed.
- [pages/entries/creator/index.tsx](../../resources/js/pages/entries/creator/index.tsx) — now renders `<EntryCard>` per entry instead of ~110 lines of inline JSX; local `TYPE_GRADIENTS`/`STATUS_STYLES`/`STATUS_LABELS`/`formatDate` removed.

## Decisions

- Kept `CampaignCard` and `EntryCard` as two separate components rather
  than one parameterized card — their bodies (budget row vs. bid row,
  entry-count vs. view-count, application-status badge vs. plain status
  badge) differ enough that a single component would need more branching
  than the shared thumbnail already saves.
- `CampaignThumbnail`'s fallback-letter size is a prop (`initialClassName`)
  rather than hardcoded, since the discovery card's thumbnail is shorter
  (`h-40`, `text-2xl`) than the entry card's (`h-48`, `text-5xl`).

## Follow-ups (out of scope for this pass)

The same `TYPE_GRADIENTS`/`STATUS_STYLES`/`STATUS_LABELS` pattern is
duplicated on the brand side (`campaigns/brand/index.tsx`,
`campaigns/brand/show.tsx`, `entries/brand/index.tsx`,
`entries/brand/show.tsx`, `campaigns/brand/applications.tsx`) and in
`entries/creator/show.tsx`. None of these were in the agreed scope for
this pass (creator-side grid/card pages specifically) and weren't touched.
`campaign-type.ts`'s label/gradient maps are already reusable for a future
pass on those files.

## Verification

- `npm run types:check` — pass.
- `npm run lint:check` — one issue found and fixed in the new
  `campaign-card.tsx` (missing blank line before a `return`); no other
  errors in touched/new files.
- `npm run build` — pass.
- No live browser check was done — this was a structural extraction (every
  className/prop/conditional moved as-is), so type-check + lint + build
  cover correctness well, but visual parity wasn't confirmed with a real
  authenticated session.
