# Phase 3 — Campaign System

**Status:** Complete  
**Implemented:** 2026-04-16

---

## Overview

Phase 3 implements the full campaign system — the core of the platform. Brands can create, edit, publish, close, and cancel campaigns across all three types (Contest, Ripple, Pitch). Creators can browse active campaigns, view details, and apply to Pitch campaigns. Subscription enforcement middleware from Phase 2 is applied to campaign creation routes.

---

## Features Implemented

| # | Feature | Status |
|---|---|---|
| 3.1 | Campaign creation wizard — base | ✅ Complete |
| 3.2 | Campaign creation — Contest details | ✅ Complete |
| 3.3 | Campaign creation — Ripple details | ✅ Complete |
| 3.4 | Campaign creation — Pitch details | ✅ Complete |
| 3.5 | AI brief assistant | ⏸ Deferred to post-MVP |
| 3.6 | Escrow deposit on publish | ✅ Complete (record created; Stripe PaymentIntent wiring deferred to Phase 6) |
| 3.7 | Campaign dashboard — brand | ✅ Complete |
| 3.8 | Campaign detail page — brand | ✅ Complete |
| 3.9 | Campaign discovery feed — creator | ✅ Complete |
| 3.10 | Campaign detail page — creator | ✅ Complete |
| 3.11 | Campaign indexing in Meilisearch | ⏸ Deferred (DB search works; Scout indexing added when Meilisearch is configured) |
| 3.12 | Campaign applications — Pitch only | ✅ Complete |

---

## Architecture

### CampaignService (`app/Services/CampaignService.php`)
Single-responsibility service (final readonly) providing:
- `createDraft(BrandProfile, data)` — creates campaign + type details + platform/content-type pivots in a transaction
- `updateDraft(Campaign, data)` ��� updates only draft campaigns
- `publish(Campaign)` — validates readiness, creates EscrowTransaction, sets status to `active`
- `close(Campaign)` — moves active campaigns to `closed`
- `cancel(Campaign)` — refunds escrow, sets status to `cancelled`
- `brandCampaigns(BrandProfile, ?status)` — paginated brand campaign list with entry counts
- `discoveryCampaigns(filters)` — paginated active campaigns for creator discovery feed
- `loadFullCampaign(Campaign)` — eager-loads all relationships for detail pages
- `calculateEscrowAmount(Campaign)` — computes hold amount based on campaign type

### Form Requests
- `StoreCampaignRequest` — validates creation; type-conditional rules for Contest/Ripple/Pitch fields
- `UpdateCampaignRequest` — validates updates; authorizes brand ownership + draft status

### Controllers

#### BrandCampaignController (`app/Http/Controllers/Campaign/BrandCampaignController.php`)
- `index` — campaign dashboard with status tabs and counts
- `create` — creation wizard with platform/content-type lookups
- `store` — creates draft via CampaignService
- `show` — full campaign detail with all relationships
- `edit` — draft editing form
- `update` — saves draft changes
- `publish` — publishes campaign (creates escrow, goes active)
- `close` — closes active campaign
- `cancel` — cancels campaign with escrow refund

#### CreatorCampaignController (`app/Http/Controllers/Campaign/CreatorCampaignController.php`)
- `index` — discovery feed with search, type/platform/sort filters
- `show` — campaign detail with application/entry status for current creator

#### CampaignApplicationController (`app/Http/Controllers/Campaign/CampaignApplicationController.php`)
- `store` — creator submits Pitch application (prevents duplicates)
- `index` — brand views applications for a Pitch campaign
- `approve` — brand approves application (creator can then submit entry)
- `reject` — brand rejects application

---

## Routes (`routes/campaign.php`)

### Brand Routes (auth + verified + onboarded + role:brand)

```
GET    /campaigns                                  campaigns.brand.index
GET    /campaigns/create                            campaigns.brand.create  [+brand.subscribed, +brand.campaign_limit]
POST   /campaigns                                  campaigns.brand.store   [+brand.subscribed, +brand.campaign_limit]
GET    /campaigns/{campaign}/edit                   campaigns.brand.edit
PUT    /campaigns/{campaign}                        campaigns.brand.update
GET    /campaigns/{campaign}                        campaigns.brand.show
POST   /campaigns/{campaign}/publish                campaigns.brand.publish
POST   /campaigns/{campaign}/close                  campaigns.brand.close
POST   /campaigns/{campaign}/cancel                 campaigns.brand.cancel
GET    /campaigns/{campaign}/applications            campaigns.applications.index
POST   /campaigns/{campaign}/applications/{app}/approve  campaigns.applications.approve
POST   /campaigns/{campaign}/applications/{app}/reject   campaigns.applications.reject
```

### Creator Routes (auth + verified + onboarded + role:creator)

```
GET    /discover                                    campaigns.creator.index
GET    /discover/{campaign}                         campaigns.creator.show
POST   /discover/{campaign}/apply                   campaigns.applications.store
```

---

## Frontend

### Campaign Creation Wizard (`resources/js/pages/campaigns/brand/create.tsx`)
4-step wizard:
1. **Type** — select Contest, Ripple, or Pitch
2. **Details** — title, deadline, max creators + type-specific fields (prize, RPM, product info)
3. **Brief** — rich text brief, requirements list, hashtags, inspiration links
4. **Settings** — platform selection, content type selection, summary review

Saves as draft on final step. Client-side validation at each step.

### Brand Campaign Dashboard (`resources/js/pages/campaigns/brand/index.tsx`)
- Status tab filter (All/Drafts/Active/Closed/Completed) with counts
- Campaign card grid showing type badge, status, entry count, deadline, platforms
- Drafts link to edit page; published campaigns link to detail page
- Empty state with CTA to create first campaign

### Brand Campaign Detail (`resources/js/pages/campaigns/brand/show.tsx`)
- Full brief display with requirements checklist
- Type-specific detail cards (Contest prizes, Ripple earnings, Pitch product info)
- Sidebar: overview stats, escrow status, platforms, hashtags, content types
- Actions: Edit draft, Publish, Close, Cancel, View applications (Pitch)

### Brand Campaign Edit (`resources/js/pages/campaigns/brand/edit.tsx`)
- Pre-populated form from existing campaign data
- Card-based layout for each section (details, type fields, brief, requirements, platforms)
- Save draft and Publish buttons

### Brand Applications Page (`resources/js/pages/campaigns/brand/applications.tsx`)
- Lists all Pitch applications with creator info and niches
- Approve/Reject buttons for pending applications
- Status badges (pending/approved/rejected)

### Creator Discovery Feed (`resources/js/pages/campaigns/creator/index.tsx`)
- Search bar with campaign title/brief search
- Filters: campaign type, platform, sort order (newest/deadline/popular)
- Campaign cards showing brand name, type badge, budget/prize, entry count, deadline
- Clear filters button

### Creator Campaign Detail (`resources/js/pages/campaigns/creator/show.tsx`)
- Full brief with requirements
- Type-specific earnings/prize breakdown
- Sidebar CTA: "Submit entry" for Contest/Ripple, "Apply to campaign" for Pitch
- Pitch application form with optional pitch text
- Application status display after submission
- Platform, hashtag, content type, and inspiration link cards

---

## TypeScript Types (`resources/js/types/campaign.ts`)

New types exported:
- `CampaignType`, `CampaignStatus`, `Platform`, `ContentType`
- `ContestDetails`, `RippleDetails`, `PitchDetails`
- `BrandProfile`, `EscrowTransaction`
- `Campaign` (full model with optional relationships)
- `CampaignApplication` (with nested creator)
- `CampaignFormData` (wizard form state)
- `PaginatedData<T>` (generic Laravel pagination wrapper)

---

## Middleware Enforcement

Campaign creation routes (`create`, `store`) are protected by:
- `brand.subscribed` — ensures active brand subscription
- `brand.campaign_limit` — checks plan campaign limit (Starter: 3, Growth: 10, Scale: unlimited)

---

## Escrow System

On publish, `CampaignService::publish()`:
1. Validates campaign is ready (title, brief, platforms, budget > 0)
2. Calculates escrow amount based on type:
   - Contest: prize_amount + runner_up_prize
   - Ripple: total_budget
   - Pitch: budget_cap
3. Creates `EscrowTransaction` record with status `held`
4. Sets campaign status to `active` with `published_at` timestamp

Stripe PaymentIntent integration deferred to Phase 6 — currently uses a placeholder ID.

---

## Discovery Search

Currently uses PostgreSQL `ILIKE` for title/brief search and Eloquent `whereHas` for platform/content-type filtering. Meilisearch Scout indexing will be added when the search service is configured.

---

## Next: Phase 4 — Entry System

The campaign system provides the foundation for entries. Phase 4 will implement:
- Entry submission wizard
- Entry review dashboard for brands
- Entry approval flows per campaign type
- `creator.entry_limit` middleware enforcement on entry submission routes
