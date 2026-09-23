# UI 5 — Entries UX overhaul + creator directory & campaign invites

**Status:** 🟢 Complete
**Branch:** `feature/entries-ux-creator-directory`
**Date:** 2026-09-23

## Overview

Three things in one pass:

1. A UI/UX lift on the entry surfaces (brand review list, creator my-entries) up
   to the standard the dashboard / wallet / analytics pages already set.
2. A real **creator directory** for brands — aggregate social presence across
   every connected platform plus a per-platform breakdown.
3. **Campaign invitations** — a brand can invite a specific creator to enter one
   of its live campaigns; the creator accepts or declines.

It also fixes a dark-mode defect that ran through most of the app.

---

## The dark-mode defect

`STATUS_STYLES` / `STATUS_LABELS` had been hand-copied into **7 files**, and
every copy used light-only Tailwind pairs:

```ts
pending_review: 'bg-yellow-100 text-yellow-700',
live: 'bg-green-100 text-green-700',
```

In dark mode `bg-yellow-100` stays a near-white chip, so these rendered as bright
blocks with low-contrast text on every dark surface. The same applied to the
campaign status maps (`bg-green-100`…) and the hand-rolled flash banners
(`bg-green-50 text-green-700`).

Replaced with a `/10` tint + ring + explicit dark text colour, defined once:

```ts
live: 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-400',
```

---

## New files

### Shared primitives
| File | Purpose |
|---|---|
| [lib/entry-status.ts](../../resources/js/lib/entry-status.ts) | Single source of truth for entry status labels + dark-safe tones; `REVIEW_STATUS_STYLES` covers the pending/approved/rejected family shared by applications and invitations |
| [components/entries/entry-status-badge.tsx](../../resources/js/components/entries/entry-status-badge.tsx) | The one status chip every entry surface renders |
| [components/shared/filter-tabs.tsx](../../resources/js/components/shared/filter-tabs.tsx) | Segmented status filter with count chips, replacing the row of outline buttons |
| [components/shared/pagination-nav.tsx](../../resources/js/components/shared/pagination-nav.tsx) | Paginator + "showing 1–15 of 40" range, replacing 9 copies of the same `links.map` |
| [components/shared/empty-state.tsx](../../resources/js/components/shared/empty-state.tsx) | Shared empty state with an action slot |
| [components/shared/flash-alert.tsx](../../resources/js/components/shared/flash-alert.tsx) | Reads the flash bag off page props directly, replacing 10 hand-rolled banners |

> These live in `components/shared/`, **not** `components/ui/` — `eslint.config.js`
> ignores `resources/js/components/ui/*` as generated shadcn code, so hand-written
> components placed there would silently skip linting.

### Creator directory
| File | Purpose |
|---|---|
| [components/creators/creator-directory-card.tsx](../../resources/js/components/creators/creator-directory-card.tsx) | Directory tile: combined followers/likes/comments, niches, per-platform rows, track record, invite action |
| [components/creators/platform-reach-row.tsx](../../resources/js/components/creators/platform-reach-row.tsx) | One platform's verified reach, brand-tinted per platform |
| [components/creators/invite-creator-dialog.tsx](../../resources/js/components/creators/invite-creator-dialog.tsx) | Campaign picker + optional message |

### Invitations
| File | Purpose |
|---|---|
| `database/migrations/2026_09_23_100000_create_campaign_invitations_table.php` | `campaign_invitations`, unique on `(campaign_id, creator_profile_id)` |
| [app/Models/CampaignInvitation.php](../../app/Models/CampaignInvitation.php) | Model |
| [app/Http/Controllers/Campaign/CampaignInvitationController.php](../../app/Http/Controllers/Campaign/CampaignInvitationController.php) | Brand `store`; creator `accept` / `decline` |
| [app/Notifications/CampaignInvitationSent.php](../../app/Notifications/CampaignInvitationSent.php) | In-app + mail, respecting notification preferences |
| [components/entries/campaign-invitation-card.tsx](../../resources/js/components/entries/campaign-invitation-card.tsx) | Creator-side accept/decline card |

---

## Changed

### Brand entry review — [entries/brand/index.tsx](../../resources/js/pages/entries/brand/index.tsx)
Was a flat text row per entry with no triage signal. Now:
- Campaign reach strip: entries / verified views / comments / paid out.
- Per-entry: creator avatar, **combined follower count**, verified views on that
  entry, submitted date, niches, content type, platform badges, bid (showing the
  accepted bid once agreed), and a pending-edit-request flag.
- **Search by creator** and **sort** (newest / oldest / most views / highest bid).
- Filters, pagination, flash and empty state now use the shared primitives.

### Creator my-entries — [entries/creator/index.tsx](../../resources/js/pages/entries/creator/index.tsx)
- Portfolio summary: verified views, comments, total earned, pending.
- Pending brand invitations listed above the grid with accept/decline.
- Shared filter tabs, pagination, empty state.

### Creator directory — [brand/creators/index.tsx](../../resources/js/pages/brand/creators/index.tsx)
- Aggregate followers / likes / comments headline per creator.
- Per-platform rows for each connected platform (handle, verified check,
  followers, likes, posts).
- Sort: most followers / most campaign views / highest engagement / top earning /
  recently joined. Filters moved into a collapsible panel with an active count.
- **Invite** button per card.

### Backend
- `CreatorSearchController` — rewritten. Aggregate totals via correlated
  subqueries (`total_followers`, `total_likes`, `total_posts`), engagement totals
  batched in one grouped query for the page, sort options, and the brand's live
  campaigns for the invite dialog.
  - **Follower filters now match the creator's combined audience**, not a single
    account. Previously a creator with three 10k accounts passed a "min 25k"
    filter, because `whereHas` matched per-account.
- `EntryService::campaignEntries()` — accepts `search` and `sort`; eager-loads
  `creator.user.socialAccounts.platform` for the follower counts.
- `BrandEntryController::index()` — passes search/sort through and computes the
  reach summary.
- `CreatorEntryController::index()` — portfolio summary + pending invitations.
- `NotificationPreferenceController` — registers `campaign_invitation`.
- **"Find Creators" added to the brand sidebar** — the page existed at `/creators`
  but had no nav entry, so it was effectively unreachable.

### Swapped onto shared primitives
`entries/brand/show`, `entries/creator/show`, `components/entries/entry-card`,
`campaigns/brand/{index,show,applications}` — all local status maps deleted.

---

## Decisions

**Comments are campaign comments, not account comments.** The request was for
followers, likes and comments across the three platforms. Followers and likes are
account-level metrics already synced onto `social_accounts`. **Comments are not** —
no provider exposes an account-level comment total under the OAuth scopes in use
(TikTok's `user/info` returns `likes_count` and `video_count`; IG and YouTube
return followers and post count). Comment counts *are* already tracked per-post on
`entry_platforms.comment_count` by `ViewSyncService`, so the directory aggregates
those: comments earned on campaign content. That is a verified number the platform
can stand behind, rather than an invented one.

**Re-inviting updates rather than stacks.** `updateOrCreate` on the unique
`(campaign_id, creator_profile_id)` pair, resetting status to pending — so a brand
following up doesn't create a second row or a second notification thread.

**Invites are gated to live campaigns.** Inviting to a draft returns 422; a
campaign the brand doesn't own 404s; a creator who already entered gets a flash
error rather than a silent no-op.

**Two card components, not one.** `CreatorDirectoryCard` is separate from the
existing `EntryCard` / `CampaignCard` for the reasons set out in
[ui-4](ui-4-shared-campaign-entry-cards.md) — the bodies differ more than a
parameterised card would save.

---

## Verification

- `npm run types:check` — pass.
- `npm run build` — pass.
- `npx prettier --check` on all new/changed TS — pass.
- `npx eslint` on all new/changed files — clean.
- `./vendor/bin/pint --dirty` — pass.
- `./vendor/bin/pest` — **117 passed**, up from 106 before this branch. The 12
  failures are identical before and after (verified by stashing the branch and
  re-running); they are pre-existing on `main`, in Settings/Security and unrelated
  suites.
- New tests: `tests/Feature/Campaign/CampaignInvitationTest.php` (8) and
  `tests/Feature/Entry/EntryDashboardTest.php` (3) — cover the invite happy path,
  re-invite dedupe, cross-brand 404, non-live 422, accept/decline, the
  wrong-creator 403, directory totals, invitable-campaign filtering, and that the
  rebuilt entry dashboards render with their new props and every sort executes.

### Not verified
No authenticated browser walkthrough was done. The Inertia tests cover the
controller → props path and the build covers compilation, but **the visual result
was not viewed in a real session** — worth a look in both light and dark mode
before merging, particularly the new status chip tones.

---

## Known pre-existing issues (not touched)

- `main` already fails `npm run lint:check` with 30 errors, mostly
  `entries/creator/submit.tsx` and `analytics/admin.tsx`. Left alone to keep this
  diff focused; `npm run lint` (with `--fix`) resolves nearly all of them.
- 12 pre-existing test failures, as above.

## Follow-ups

- `entries/creator/submit.tsx` (the 987-line 4-step wizard) was not restyled in
  this pass — it is the largest remaining entry surface and would benefit from the
  same treatment plus a breakup into step components.
- A brand-side view of invitations sent (who was invited, who accepted) has no UI
  yet; the data is there.
- Meilisearch creator indexing (roadmap 7.5) remains open — this directory is SQL.
