# Viral Content Marketing Platform — Project Plan

## Stack

| Layer | Technology |
|---|---|
| Backend framework | Laravel 13 |
| Frontend | React 19 + TypeScript |
| SPA bridge | Inertia.js v2 |
| Styling | Tailwind CSS v4 |
| UI components | shadcn/ui |
| Auth | Laravel Sanctum |
| Billing | Laravel Cashier (Stripe) |
| Search | Laravel Scout + Meilisearch |
| Queues | Laravel Horizon + Redis |
| WebSockets | Laravel Reverb |
| File storage | Spatie Media Library + Cloudflare R2 |
| Roles & permissions | Spatie Laravel Permission |
| Email | Resend |
| Charts | Recharts |
| Upload UX | React Dropzone |
| Client state | Zustand (UI only) |
| Database | PostgreSQL |
| Cache | Redis |

---

## Phase 1 — Foundation

### 1. Authentication & User Roles

Two user types: **Brand** and **Creator**, plus an **Admin** role. Separate registration flows for each. Brands provide company name and industry. Creators provide display name and primary niche.

Sanctum handles session auth for the Inertia SPA. Spatie Permission manages roles throughout. Social login via Google and LinkedIn for brands, Google and TikTok for creators.

Inertia shared data makes the authenticated user available on every page via `usePage()`. Route groups in `web.php` are protected by role middleware.

---

### 2. Brand Onboarding

3-step flow after registration:
- Company profile (name, logo, website, industry)
- Billing setup (Stripe customer created, payment method attached via Cashier)
- Guided dashboard tour

Logo upload handled by Spatie Media Library directly to R2.

---

### 3. Creator Onboarding

4-step flow after registration:
- Personal profile (bio, avatar, country)
- Niche selection (multi-select from predefined taxonomy)
- Social account connection via OAuth (TikTok Display API, Instagram Basic Display API)
- Payout setup (Stripe Express onboarding — bank account or debit card)

At least one verified social account is required before a creator can submit to campaigns. On OAuth success, follower count, handle, and a verified flag are stored in a `social_accounts` table. This is the foundation of the verified metrics advantage over Posted.

---

### 4. Admin Panel

Separate Inertia route group (`/admin`) protected by admin role. Covers user management, campaign moderation, dispute resolution, payout oversight, and platform configuration. Built with the same shadcn/ui components as the main app.

---

## Phase 2 — Campaign System

### 5. Campaign Creation (Brand Side)

Brands create campaigns of two types:

**Contest** — open entry, creators compete for views. Brand sets prize pool, deadline, minimum view threshold, and payout split (e.g. 50/25/15/10 across top performers). Keeps more creators engaged than winner-takes-all.

**Deal** — brand opens to applicants or targets specific creators. Creator proposes a bid. Brand accepts, rejects, or requests edits.

Both types share: title, rich-text brief, content requirements checklist, allowed platforms, required hashtags, content type (GRWM, demo, unboxing, lifestyle), target creator regions, and inspiration links.

Campaigns save as drafts. Publishing requires escrow funds to be deposited first.

---

### 6. AI Brief Assistant

When writing a campaign brief, brands can activate the AI assistant. They describe their product in plain text and it generates a structured brief — hook ideas, do/don't list, hashtag suggestions, and example angles. Output drops directly into the brief editor for the brand to refine.

Powered by the Anthropic or OpenAI API via a `BriefGeneratorService`. Response is streamed so it feels fast. Entirely optional — brands can still write briefs manually.

---

### 7. Escrow System

Publishing a campaign requires the brand to deposit the prize pool or deal budget upfront. Cashier holds funds via Stripe. Funds are not released until the brand triggers a payout or the campaign resolves automatically at deadline.

A `Wallet` model tracks held, released, and refunded amounts. Platform fee is a configurable percentage deducted from each payout before transfer.

---

### 8. Campaign Discovery (Creator Side)

Creators browse live campaigns through a searchable, filterable feed powered by Meilisearch via Laravel Scout.

Filters: campaign type, niche/industry, payout range, deadline, allowed platforms, region eligibility.

Each campaign card shows: prize pool or deal budget, deadline countdown, submission count, required platforms, and brief summary. Creators click through to a full detail page before submitting.

---

## Phase 3 — Submission System

### 9. Submission Wizard (Creator Side)

A 4-step wizard:

1. **Brief review** — campaign requirements as an acknowledgement checklist
2. **Content upload** — video uploaded directly to R2 via presigned URL (bypasses Laravel server), caption, content type, tags
3. **Publishing details** — platform toggles, social handle pre-filled from verified accounts, bid amount for deal campaigns
4. **Review and submit** — full summary before final submission

Submissions save as drafts at each step so creators can leave and return.

---

### 10. Submission Review (Brand Side)

Brands see all submissions in a dashboard per campaign. Each submission shows: video, caption, creator profile summary, verified follower counts, and past performance stats.

**For deals:** approve (triggers creator to post and starts view tracking), reject with reason, or request edits (returns to creator with notes).

**For contests:** submissions go live automatically once the creator posts. Brands can flag brief violations.

---

### 11. View Count Tracking

Once a submission is live, a scheduled Laravel job (`SyncViewCountJob`) runs every 6 hours pulling verified view counts via TikTok and Instagram APIs using stored OAuth tokens. Counts are written back to the submission record.

At contest deadline, a final sync runs, ranks submissions by view count, and calculates payout amounts per the brand's split configuration.

No self-reporting. No screenshots. This is the core trust advantage.

---

## Phase 4 — Payments & Payouts

### 12. Payout System

Stripe Connect pays out creators globally. Creators onboard with Stripe Express during profile setup — KYC is handled entirely by Stripe.

When a contest closes or a deal is approved, payouts are queued as a Laravel job. Tiered contest payouts are calculated automatically. Platform fee is deducted before transfer. Failed payouts retry automatically and alert admin if they fail twice.

---

### 13. Creator Earnings Dashboard

Shows: total earned, pending (submitted but not yet paid), and full transaction history broken down by campaign. Creators manage their payout method (update bank account/card). A configurable minimum threshold must be reached before payout triggers.

---

## Phase 5 — Discovery & Profiles

### 14. Creator Search (Brand Side)

Brands search and browse all creators before launching a campaign — useful for validating that enough relevant creators exist before committing a budget.

Meilisearch indexes: niches, platforms, follower counts, engagement rate, location, past campaign categories, submission count, win rate. Brands filter and sort in real time. Results show a creator card with key stats and a link to their full profile.

---

### 15. Creator Public Profile & Media Kit

Each creator has a public profile: bio, niches, verified social stats, and a portfolio of past submissions with view counts.

A shareable media kit link generates a clean, print-friendly version brands can download or share internally. Auto-generated from existing platform data — no manual work for the creator.

---

### 16. Brand Public Profile

Brands have a profile page showing active campaigns, past campaigns, and aggregate stats (total campaigns, total views generated, total creator payouts). Builds credibility with creators evaluating whether to submit.

---

## Phase 6 — Communication & Real-time

### 17. Notifications

Laravel Reverb powers real-time in-app notifications.

**Brand events:** new submission received, submission went live, campaign deadline approaching, payout processed.

**Creator events:** submission approved/rejected, edit requested, deadline approaching, payout received.

Email notifications via Resend for all the same events. User-level preferences to opt out of each type.

---

### 18. Messaging

Thread-based messaging scoped to a specific submission — not a general inbox. Brands send edit requests with notes, creators ask clarifying questions. Real-time delivery via Reverb. Unread count shown in the nav.

---

## Phase 7 — Growth Features

### 19. Agency White-Label Mode

Brands on a higher plan can invite team members and manage multiple brand profiles under one agency account. Accessible via a custom subdomain with the agency's branding applied.

Spatie Permission handles team member roles: owner, manager, viewer. Campaign creation and review is shared across the team.

---

### 20. Co-Brand Campaigns

Two brands co-sponsor a single contest, each contributing to the prize pool. Both brands review submissions and must both approve deal submissions. Prize pool is attributed proportionally. Useful for complementary brands running joint campaigns.

---

### 21. Referral System

Creators earn a bonus when they refer another creator who completes their first submission. Brands earn credits when they refer another brand that runs their first campaign. Tracked via unique referral codes. Payouts use the same Stripe Connect flow.

---

### 22. Analytics Dashboard

**Brand:** views per campaign, cost per view, top performing creators, content type breakdown, platform breakdown.

**Creator:** views per submission, earnings per campaign, engagement rate trend, best-performing niches.

**Admin:** platform GMV, take rate, creator acquisition, brand retention, top campaigns by views.

Charts via Recharts on the React side. Data aggregated by scheduled jobs and cached in Redis.

---

## UI
- refer to the design bellow for inspiration in the design
1. light mode: @context/screenshot.png
2. Dark mode @context/screenshot1.png


## Package Summary

| Layer | Package | Purpose |
|---|---|---|
| Laravel | Sanctum | SPA session auth |
| Laravel | Cashier | Stripe billing + escrow |
| Laravel | Scout | Meilisearch integration |
| Laravel | Horizon | Queue monitoring |
| Laravel | Reverb | WebSockets / real-time |
| Laravel | Spatie Media Library | File + video handling |
| Laravel | Spatie Permission | Roles + permissions |
| Laravel | Resend | Transactional email |
| React | Inertia.js v2 | Laravel ↔ React SPA bridge |
| React | shadcn/ui | Component library |
| React | Tailwind v4 | Styling |
| React | Zustand | UI state (modals, wizards) |
| React | Recharts | Analytics charts |
| React | React Dropzone | Video upload UX |

---

## Phased Delivery Summary

| Phase | Features | Outcome |
|---|---|---|
| 1 | Auth, onboarding, admin | Working user system |
| 2 | Campaigns, AI brief, escrow | Brands can launch campaigns |
| 3 | Submission wizard, review, view tracking | Creators can submit and compete |
| 4 | Payouts, earnings dashboard | End-to-end money flow |
| 5 | Creator search, profiles, media kit | Discovery and trust layer |
| 6 | Notifications, messaging | Real-time communication |
| 7 | Agency mode, co-brand, referrals, analytics | Growth and retention |

Phases 1–3 deliver a working MVP that already beats Posted on trust (verified view counts) and creator retention (tiered payouts). Phases 4–7 build the moat.
