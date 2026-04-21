# Phase 4 — Entry System

**Status:** Complete
**Date:** 2026-04-17

---

## Overview

The Entry System allows creators to submit content entries to campaigns and brands to review, approve, reject, or request edits on those entries. It implements three distinct approval flows based on campaign type (Contest, Ripple, Pitch) and integrates with the existing payout/escrow infrastructure.

---

## Features Implemented

| # | Feature | Status | Notes |
|---|---|---|---|
| 4.1 | Entry wizard — step 1 brief acknowledgement | Complete | Requirements checklist + acknowledgement checkbox |
| 4.2 | Entry wizard — step 2 video upload | Complete | Video URL input, caption, content type, tags |
| 4.3 | Entry wizard — step 3 publishing details | Complete | Platform selection, Pitch bid amount |
| 4.4 | Entry wizard — step 4 review and submit | Complete | Full summary before submission |
| 4.5 | Draft entry saving | Complete | Auto-save at any step, creators can return |
| 4.6 | Entry review dashboard — brand | Complete | Filterable list of all entries per campaign |
| 4.7 | Entry approval flow — Ripple | Complete | Approve triggers initial fee payout + earnings record |
| 4.8 | Entry approval flow — Pitch | Complete | Accept bid, creator posts, brand confirms, payout fires |
| 4.9 | Winner selection flow — Contest | Complete | Brand selects winner, others marked not_selected, prize payout created |
| 4.10 | Entry edit request flow | Complete | Brand sends edit notes, entry returns to draft, creator resubmits |
| 4.11 | Entry rejection flow | Complete | Brand rejects with reason, notification shown to creator |
| 4.12 | Entry status notifications | Deferred | Will be implemented in Phase 8 (Messaging & Notifications) |

---

## Architecture

### Backend

| File | Purpose |
|---|---|
| `app/Services/EntryService.php` | Core business logic — draft saving, submission, approval flows, winner selection, rejection, edit requests |
| `app/Http/Controllers/Entry/CreatorEntryController.php` | Creator-side: my entries list, submission wizard, mark as live, resubmit |
| `app/Http/Controllers/Entry/BrandEntryController.php` | Brand-side: review dashboard, entry detail, approve/reject/edit request/winner selection |
| `app/Http/Requests/Entry/StoreEntryRequest.php` | Validation for entry creation/update, conditional rules for draft vs submit |
| `routes/entry.php` | All entry routes, registered in `web.php` |

### Frontend

| File | Purpose |
|---|---|
| `resources/js/pages/entries/creator/submit.tsx` | 4-step submission wizard (requirements, video, publishing, review) |
| `resources/js/pages/entries/creator/index.tsx` | Creator's "My Entries" list with status filter tabs |
| `resources/js/pages/entries/creator/show.tsx` | Entry detail for creator — mark as live, view edit requests, payouts |
| `resources/js/pages/entries/brand/index.tsx` | Brand entry review dashboard per campaign |
| `resources/js/pages/entries/brand/show.tsx` | Brand entry detail — approve, reject, request edit, select winner |
| `resources/js/types/entry.ts` | TypeScript types for Entry, EntryStatus, EntryPitchDetail, etc. |

### Routes

**Creator routes:**
- `GET /entries` — My entries list
- `GET /entries/{entry}` — Entry detail
- `POST /entries/{entry}/live` — Mark entry as live
- `GET /discover/{campaign}/entry` — Submission wizard
- `POST /discover/{campaign}/entry` — Submit/save draft
- `POST /discover/{campaign}/entry/resubmit` — Resubmit after edit request

**Brand routes:**
- `GET /campaigns/{campaign}/entries` — Entry review dashboard
- `GET /campaigns/{campaign}/entries/{entry}` — Entry detail
- `POST /campaigns/{campaign}/entries/{entry}/approve-ripple` — Approve Ripple entry
- `POST /campaigns/{campaign}/entries/{entry}/approve-pitch` — Approve Pitch entry
- `POST /campaigns/{campaign}/entries/{entry}/confirm-live` — Confirm Pitch post is live
- `POST /campaigns/{campaign}/entries/{entry}/select-winner` — Select Contest winner
- `POST /campaigns/{campaign}/entries/{entry}/reject` — Reject entry
- `POST /campaigns/{campaign}/entries/{entry}/request-edit` — Request edits

---

## Campaign Type Flows

### Contest
1. Creator submits entry privately (status: `pending_review`)
2. Brand reviews all entries
3. Brand selects winner (status: `won`, others become `not_selected`)
4. Winner posts publicly, marks as live
5. Prize payout is created (+ optional runner-up payout)
6. Campaign status moves to `completed`

### Ripple
1. Creator submits entry (status: `pending_review`)
2. Brand approves (status: `approved`)
3. Initial fee payout fires immediately, `entry_ripple_earnings` record created
4. Creator posts and marks as live (status: `live`)
5. View tracking (Phase 5) will trigger milestone payouts

### Pitch
1. Creator applies to campaign (Phase 3)
2. Brand approves application
3. Creator submits entry with bid (status: `pending_review`)
4. Brand accepts bid (status: `approved`, `accepted_bid` set)
5. Creator posts and marks as live (status: `live`)
6. Brand confirms post is live, payout fires

---

## Middleware

- `EnsureCreatorEntryLimit` — Applied to entry creation routes; blocks free-tier creators past 2 entries/month
- `EnsureOnboardingComplete` — Applied to all entry routes
- `role:creator` / `role:brand` — Applied via route middleware groups

---

## Sidebar Navigation

Updated `app-sidebar.tsx` to be role-aware:
- **Brand:** Dashboard, Campaigns
- **Creator:** Dashboard, Discover, My Entries
- Campaign brand show page now has a "View entries" button
- Creator campaign show page "Submit entry" button now links to the wizard

---

## Dependencies

- Builds on Phase 1 (models, migrations, auth) and Phase 3 (campaign system)
- Payout records are created but actual Stripe transfers are deferred to Phase 6
- Entry status notifications deferred to Phase 8
