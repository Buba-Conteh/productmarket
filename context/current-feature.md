# Current Feature — Entries UX overhaul + creator directory & campaign invites

**Status:** 🟢 Complete — see context/features/ui-5-entries-ux-creator-directory.md
**Branch:** `feature/entries-ux-creator-directory`

## Goals

1. **Raise the UI bar on the entry surfaces** (brand review list, brand entry
   detail, creator my-entries, creator entry detail) to the standard the
   dashboard / wallet / analytics pages already set.
2. **Give brands a real creator directory** — aggregate social presence
   (followers, likes, comments) across all three connected platforms, plus a
   per-platform breakdown.
3. **Let brands invite a creator to enter a specific campaign**, with the
   invitation surfaced to the creator and acceptable/declinable.

## Problems being fixed

### UI
- `STATUS_STYLES` / `STATUS_LABELS` for entry status are **hand-copied into 7
  files** and every copy uses light-only colours (`bg-yellow-100
  text-yellow-700`). In dark mode these render as near-white chips with
  low-contrast text.
- The same is true of pagination (9 copies), flash banners (10 copies) and
  status filter tabs (2 copies) — each a slightly different hand-rolled block.
- The brand entry review list is a flat row of text: no creator avatar, no
  social proof, no video thumbnail, no view counts, no search, no sort. A brand
  reviewing 40 entries has nothing to triage on.
- Creator "My Entries" has no summary of how the portfolio is doing.
- **"Find Creators" is not in the brand sidebar at all** — the page exists at
  `/creators` but is unreachable from the nav.

### Creator discovery
- `CreatorSearchController` returns only per-account followers/avg-views. No
  totals, no likes, no comments, no sorting, no engagement summary.
- Comments are not available at account level from any of the three provider
  APIs under current OAuth scopes (TikTok `user/info` exposes `likes_count` and
  `video_count` only). Verified comment counts **are** already tracked
  per-post on `entry_platforms.comment_count`, so the directory aggregates
  those — comments earned on campaign content, which is the verified number
  the platform can actually stand behind.

### Invites
- No invitation concept exists anywhere. Brands can only wait for creators to
  find a campaign.

## Plan

### Shared frontend primitives (new)
| File | Purpose |
|---|---|
| `lib/entry-status.ts` | One source of truth for entry status label + dark-mode-safe tone classes |
| `components/entries/entry-status-badge.tsx` | Shared status chip |
| `components/ui/filter-tabs.tsx` | Segmented pill filter with counts |
| `components/ui/pagination-nav.tsx` | Shared paginator |
| `components/ui/empty-state.tsx` | Shared empty state |
| `components/ui/flash-alert.tsx` | Shared flash success/error banner |
| `components/creators/creator-card.tsx` | Directory tile with aggregate + per-platform social presence |
| `components/creators/creator-social-summary.tsx` | Followers / likes / comments totals row |

### Backend
- Migration + `CampaignInvitation` model (`campaign_invitations`).
- `CampaignInvitationController` — brand `store`, creator `index`/`accept`/`decline`.
- `CampaignInvitationSent` notification (in-app + mail, respecting prefs).
- `CreatorSearchController` — aggregate social totals, comment aggregation,
  sort options, and the brand's invitable campaigns for the invite dialog.
- `EntryService::campaignEntries` — accept search + sort; eager-load what the
  richer review row needs.

### Pages touched
`entries/brand/index`, `entries/brand/show`, `entries/creator/index`,
`entries/creator/show`, `brand/creators/index`, `campaigns/brand/{index,show,applications}`,
`components/entries/entry-card`, `components/app-sidebar`.

## Out of scope
- Meilisearch indexing of creators (7.5) — still SQL.
- Account-level comment sync (no provider support under current scopes).
