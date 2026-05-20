# Campaign UX Improvements

**Status:** In Progress
**Branch:** feature/campaign-ux-improvements
**Started:** 2026-05-03

---

## Features

| # | Feature | Status |
|---|---|---|
| CUX-1 | Real video file upload for all entry types | 🟢 Complete |
| CUX-2 | Inline video playback on platform (creator + brand views) | 🟢 Complete |
| CUX-3 | Campaign card thumbnails (creator discover + brand list) | 🟢 Complete |
| CUX-4 | "Already applied" indicator on discovery cards | 🟢 Complete |

---

## Overview

Four UX improvements to make the platform production-ready:

1. **Video upload** — Replace the URL-paste placeholder in the entry wizard with a real file-upload drop zone. Videos are stored on the local disk (same pattern as campaign thumbnails). The backend stores the path in `video_url` and exposes a full `video_full_url` accessor.

2. **On-platform video playback** — Wherever an entry is shown (creator entry detail, brand entry review), render an inline `<video controls>` player using `video_full_url`. Critically for Pitch entries, the brand watches the video pitch before deciding to accept or reject the bid.

3. **Campaign card thumbnails** — Every campaign already stores a `thumbnail_url` but it was never shown on cards. Add a 160px image area at the top of every campaign card on the creator Discover page and the brand Campaigns list. Use a gradient placeholder when no thumbnail exists.

4. **Applied indicator on discover cards** — The "you already submitted" notice only appeared on the campaign detail page. Now the discovery grid shows a green "Applied ✓" badge (or "Pending" for unapproved Pitch applications) overlaid on the card thumbnail so creators can see their status at a glance.

---

## Implementation

### Backend

- `StoreEntryRequest` — Changed `video_url` (string) to `video` (file, mimes:mp4,mov,avi,webm, max 200 MB). `video_url` stays in DB but is set by the controller, not sent from the form.
- `Entry` model — Added `video_full_url` appended attribute via `FileUploader::url($this->video_url)`.
- `EntryService::saveDraft()` — Only updates `video_url` when a new path is explicitly provided (prevents overwrite on resubmit without a new video).
- `CreatorEntryController::store()` / `resubmit()` — Handles file upload before delegating to service.
- `CreatorCampaignController::index()` — Passes `entered_campaign_ids` and `application_statuses` for the authenticated creator.

### Frontend

- `submit.tsx` — File drop zone replaces URL input. Uses `FormData` + `router.post` with `forceFormData`. Shows `<video>` preview on selection. Step validation checks `videoFile !== null || !!entry?.video_full_url`.
- `entries/creator/show.tsx` — Inline `<video controls>` player.
- `entries/brand/show.tsx` — Inline `<video controls>` player above the text content.
- `campaigns/creator/index.tsx` — Thumbnail image area on cards + applied/pending badge.
- `campaigns/brand/index.tsx` — Thumbnail image area on cards.
- `types/entry.ts` — Added `video_full_url: string | null` to `Entry`; removed `video_url` from `EntryFormData`.

---

## History

- 2026-05-03: Feature documented and fully implemented. TypeScript types pass, build passes, PHP Pint passes.

---

# Video Posting, Metrics & Content Rights

**Status:** In Progress
**Branch:** feature/video-posting-metrics
**Started:** 2026-05-20

---

## Features

| # | Feature | Status |
|---|---|---|
| VPM-1 | Auto-release payout when creator marks entry live (Pitch) | 🟢 Complete |
| VPM-2 | Creator provides TikTok video URL when posting | 🟢 Complete |
| VPM-3 | Brand sees video metrics (views + comments) on entry detail | 🟢 Complete |
| VPM-4 | Content rights section on brand entry detail for live entries | 🟢 Complete |
| VPM-5 | Creator social metrics (handle + followers) on brand entry sidebar | 🟢 Complete |

---

## Overview

When a creator marks an entry as live (posts on social media), the platform should:
1. **Auto-release funds** — For Pitch entries, payout fires automatically when creator submits the posted URL (removing the manual brand "confirm post" step).
2. **Track comments** — Add `comment_count` to `entry_platforms`, sync from TikTok API alongside views.
3. **Brand video metrics** — Show verified views and comments prominently on the brand entry detail page.
4. **Content rights** — Show a "Brand owns this content" rights acknowledgement card on live entries.
5. **Creator social metrics** — Under the Creator sidebar on brand entry view, show each platform handle and follower count.

---

## Implementation

### Backend
- New migration: `add_comment_count_to_entry_platforms_table`
- `Entry` model: add `comment_count` to `withPivot()`
- `TikTokProvider`: fetch `comment_count` in same API call as `view_count`; expose via `getLastCommentCount()`
- `ViewSyncService`: store `comment_count` after view sync for TikTok entries
- `EntryService::markLive()`: for `pitch` entries, auto-trigger payout (replaces brand's `confirmPitchLive()`)
- `EntryService::loadFullEntry()`: load `creator.socialAccounts.platform`

### Frontend
- `types/entry.ts`: add `comment_count` to `EntryPlatform.pivot`; add `social_accounts` to `CreatorProfile`
- `entries/creator/show.tsx`: clearer TikTok URL input label/placeholder
- `entries/brand/show.tsx`: comment_count display + content rights card + creator social metrics sidebar

---

## History

- 2026-05-20: Feature fully implemented. TypeScript clean, build passes, PHP lint passes.

---

# Performance Quick Wins

**Status:** Not Started
**Branch:** fix/performance-quick-wins

---

## Features

| # | Feature | Status |
|---|---|---|
| PQW-1 | Replace 5-6 COUNT queries per dashboard tab with single GROUP BY aggregate | 🔴 Not started |
| PQW-2 | Fix N+1 in `ViewSyncService::syncEntry` — platform + social account pre-fetch | 🔴 Not started |
| PQW-3 | Cache `unreadNotifications()->count()` per-user (60s TTL) in `HandleInertiaRequests` | 🔴 Not started |
| PQW-4 | Cache subscription status per-request in `HandleInertiaRequests` | 🔴 Not started |

---

## Overview

Low-risk performance fixes identified by codebase audit. No functional changes — same data, fewer queries.

### PQW-1 — Dashboard tab COUNT queries

`BrandCampaignController::index`, `BrandEntryController::index`, and `CreatorEntryController::index` each fire 5–6 separate `COUNT(*)` queries to build status tab counts. Replace with a single `GROUP BY status` aggregate.

**Files:** [app/Http/Controllers/Campaign/BrandCampaignController.php](app/Http/Controllers/Campaign/BrandCampaignController.php), [app/Http/Controllers/Entry/BrandEntryController.php](app/Http/Controllers/Entry/BrandEntryController.php), [app/Http/Controllers/Entry/CreatorEntryController.php](app/Http/Controllers/Entry/CreatorEntryController.php)

```php
$counts = $brand->campaigns()
    ->selectRaw('status, count(*) as count')
    ->groupBy('status')
    ->pluck('count', 'status')
    ->toArray();
$counts['all'] = array_sum($counts);
```

### PQW-2 — N+1 in ViewSyncService

`syncEntry()` fetches `$entry->platforms()->get()` then inside the loop calls `$entry->platforms()->where(...)->first()` again for each platform (1+N queries), and `SocialAccount::where(...)->first()` per platform (another N queries).

**File:** [app/Services/Social/ViewSyncService.php](app/Services/Social/ViewSyncService.php)

Fix: load platforms with pivot once before the loop; index social accounts by platform_id before the loop.

### PQW-3 — unreadNotifications count on every request

`HandleInertiaRequests` calls `unreadNotifications()->count()` on every authenticated page load. Cache per-user with a 60-second TTL.

**File:** [app/Http/Middleware/HandleInertiaRequests.php](app/Http/Middleware/HandleInertiaRequests.php)

### PQW-4 — Subscription status re-queried every request

`subscriptionStatuses()` queries `subscription_statuses` on every page load. Cache per-user per-request using `cache()->remember()` with a short TTL.

**File:** [app/Http/Middleware/HandleInertiaRequests.php](app/Http/Middleware/HandleInertiaRequests.php)
