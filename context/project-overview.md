# Project Overview

**Last updated:** April 19, 2026
**Version:** 1.0

---

## Progress Summary

| Metric | Count |
|---|---|
| Total features | 84 |
| 🟢 Complete | 52 |
| 🟡 In progress | 0 |
| 🔴 Not started | 29 |
| ⏸ Deferred | 3 |
| **Overall completion** | **62%** |

### Progress by Phase

| Phase | Features | 🟢 Done | 🟡 In Progress | 🔴 Not Started | ⏸ Deferred | % Done |
|---|---|---|---|---|---|---|
| 1 — Foundation | 15 | 15 | 0 | 0 | 0 | 100% |
| 2 — Subscriptions | 8 | 8 | 0 | 0 | 0 | 100% |
| 3 — Campaigns | 12 | 10 | 0 | 0 | 2 | 83% |
| 4 — Entries | 12 | 11 | 0 | 0 | 1 | 92% |
| 5 — View Tracking | 8 | 8 | 0 | 0 | 0 | 100% |
| 6 — Payouts | 10 | 0 | 0 | 10 | 0 | 0% |
| 7 — Profiles & Discovery | 5 | 0 | 0 | 5 | 0 | 0% |
| 8 — Messaging | 5 | 0 | 0 | 5 | 0 | 0% |
| 9 — Analytics | 5 | 0 | 0 | 5 | 0 | 0% |
| 10 — Growth | 4 | 0 | 0 | 4 | 0 | 0% |
| **Total** | **84** | **52** | **0** | **29** | **3** | **62%** |

### Deferred Features

| # | Feature | Deferred To | Reason |
|---|---|---|---|
| 3.5 | AI brief assistant | Post-MVP | Requires Anthropic/OpenAI API integration |
| 3.11 | Campaign indexing in Meilisearch | Post-MVP | Requires Meilisearch setup; using SQL search for now |
| 4.12 | Entry status notifications | Phase 8 | Will be built with the full notifications system |

---

## Platform Summary

A viral content marketing platform connecting brands with creators through three campaign types — **Contest**, **Ripple**, and **Pitch**. Brands fund campaigns, creators produce and post content, the platform takes a subscription fee from both sides plus a percentage cut on all payouts.

Built with **Laravel 13 + Inertia.js + React 19 + Tailwind v4 + shadcn/ui**.

---

## Monetization Model

### Brand Plans

| Plan | Price | Campaigns | Features |
|---|---|---|---|
| **Starter** | $49 / month | Up to 3 active | All campaign types, basic analytics, standard support |
| **Growth** | $149 / month | Up to 10 active | All campaign types, advanced analytics, priority support, agency invite (up to 3 members) |
| **Scale** | $399 / month | Unlimited | Everything in Growth, white-label mode, co-brand campaigns, dedicated account manager, full team access |

> Annual billing available at 20% discount.

---

### Creator Plans

| Plan | Price | Features |
|---|---|---|
| **Free** | $0 | Browse campaigns, submit up to 2 entries per month, basic profile |
| **Creator Pro** | $9 / month | Unlimited entries, media kit, priority discovery in search, verified badge, advanced earnings dashboard |

---

### Platform Fee

Flat 15% deducted from every payout regardless of subscription plan.

| Fee Type | Rate | Applied To |
|---|---|---|
| **Contest prize cut** | 15% | Deducted from prize before creator receives it |
| **Ripple earnings cut** | 15% | Deducted from initial fee + every milestone payout |
| **Pitch payment cut** | 15% | Deducted from accepted bid before creator receives it |

> Brand pays full amount into escrow. Creator receives 85%. Platform fee is snapshotted at campaign creation — rate changes never affect live campaigns.

---

### Revenue Example

| Campaign | Brand Pays | Platform Earns | Creator Receives |
|---|---|---|---|
| Contest — $1,000 prize | $1,000 + subscription | $150 | $850 |
| Ripple — $500 initial fee | $500 + milestones + subscription | $75 on initial | $425 + 85% of milestones |
| Pitch — $300 bid | $300 + subscription | $45 | $255 |

---

## MVP Definition

Phases 1–6 are the MVP. Phases 7–10 ship post-launch.

| Phase | Estimated Effort |
|---|---|
| 1 — Foundation | 2–3 weeks |
| 2 — Subscriptions | 1 week |
| 3 — Campaigns | 2 weeks |
| 4 — Entries | 2 weeks |
| 5 — View Tracking | 1–2 weeks |
| 6 — Payouts | 1–2 weeks |
| **Total MVP** | **9–12 weeks** |

---

## Status Legend

| Symbol | Meaning |
|---|---|
| 🔴 | Not started |
| 🟡 | In progress |
| 🟢 | Complete |
| ⏸ | Blocked — waiting on dependency |

---

## Phase 1 — Foundation

| # | Feature | Status | Notes |
|---|---|---|---|
| 1.1 | Laravel 13 project setup | 🟢 Complete | Sanctum, Horizon, Reverb, Scout, Cashier, Spatie packages |
| 1.2 | React + Inertia.js + Vite setup | 🟢 Complete | TypeScript, Tailwind v4, shadcn/ui |
| 1.3 | Database migrations — lookup tables | 🟢 Complete | platforms, niches, industries, content_types |
| 1.4 | Database migrations — users & profiles | 🟢 Complete | users, brand_profiles, creator_profiles, social_accounts |
| 1.5 | Database migrations — campaigns | 🟢 Complete | campaigns + all detail tables + pivot tables |
| 1.6 | Database migrations — entries | 🟢 Complete | entries + all detail tables + pivot tables |
| 1.7 | Database migrations — payments | 🟢 Complete | escrow_transactions, payouts, platform_settings |
| 1.8 | Database migrations — messaging, growth, analytics | 🟢 Complete | All remaining tables |
| 1.9 | Seeders — lookup tables | 🟢 Complete | Seed platforms, niches, industries, content_types |
| 1.10 | User authentication | 🟢 Complete | Register, login, logout, email verification, 2FA |
| 1.11 | Social login | 🟢 Complete | Google + LinkedIn (brands), Google + TikTok (creators) |
| 1.12 | Role assignment on registration | 🟢 Complete | Spatie Permission — brand, creator, admin roles |
| 1.13 | Brand onboarding flow | 🟢 Complete | Company profile, billing setup, dashboard tour |
| 1.14 | Creator onboarding flow | 🟢 Complete | Personal profile, niche selection, social OAuth, Stripe Express |
| 1.15 | Admin panel scaffold | 🟢 Complete | Protected route group, user management, platform settings |

---

## Phase 2 — Subscriptions & Billing

| # | Feature | Status | Notes |
|---|---|---|---|
| 2.1 | Brand subscription plans | 🟢 Complete | Starter / Growth / Scale via Stripe Cashier |
| 2.2 | Creator subscription plans | 🟢 Complete | Free / Creator Pro via Stripe Cashier |
| 2.3 | Subscription enforcement middleware | 🟢 Complete | Block campaign creation if plan limit reached |
| 2.4 | Free creator entry cap enforcement | 🟢 Complete | Max 2 entries/month for free tier |
| 2.5 | Billing dashboard — brands | 🟢 Complete | Current plan, invoices, upgrade/downgrade, cancel |
| 2.6 | Billing dashboard — creators | 🟢 Complete | Current plan, invoices, upgrade/downgrade, cancel |
| 2.7 | Stripe webhook handling | 🟢 Complete | subscription.created, payment_failed, subscription.cancelled |
| 2.8 | Plan upgrade/downgrade flow | 🟢 Complete | Prorate on upgrade, end-of-period on downgrade |

---

## Phase 3 — Campaign System

| # | Feature | Status | Notes |
|---|---|---|---|
| 3.1 | Campaign creation wizard — base | 🟢 Complete | Shared fields for all campaign types |
| 3.2 | Campaign creation — Contest details | 🟢 Complete | Prize amount, runner-up prize |
| 3.3 | Campaign creation — Ripple details | 🟢 Complete | Initial fee, RPM rate, milestone interval, budget |
| 3.4 | Campaign creation — Pitch details | 🟢 Complete | Product info, budget cap, bid range |
| 3.5 | AI brief assistant | ⏸ Deferred | Post-MVP — requires Anthropic/OpenAI API integration |
| 3.6 | Escrow deposit on publish | 🟢 Complete | Stripe PaymentIntent holds funds before campaign goes live |
| 3.7 | Campaign dashboard — brand | 🟢 Complete | List of all campaigns with status, entries count, budget spent |
| 3.8 | Campaign detail page — brand | 🟢 Complete | Full campaign view, edit draft, close campaign |
| 3.9 | Campaign discovery feed — creator | 🟢 Complete | Searchable, filterable feed via Meilisearch |
| 3.10 | Campaign detail page — creator | 🟢 Complete | Full brief, requirements, prize/rate info, apply/enter CTA |
| 3.11 | Campaign indexing in Meilisearch | ⏸ Deferred | Post-MVP — requires Meilisearch setup; using SQL search for now |
| 3.12 | Campaign applications — Pitch only | 🟢 Complete | Creator applies, brand approves/rejects before entry |

---

## Phase 4 — Entry System

| # | Feature | Status | Notes |
|---|---|---|---|
| 4.1 | Entry wizard — step 1 brief acknowledgement | 🟢 Complete | Requirements checklist + acknowledgement checkbox |
| 4.2 | Entry wizard — step 2 video upload | 🟢 Complete | Video URL input, caption, content type, tags |
| 4.3 | Entry wizard — step 3 publishing details | 🟢 Complete | Platform selection, Pitch bid amount |
| 4.4 | Entry wizard — step 4 review and submit | 🟢 Complete | Full summary before submission |
| 4.5 | Draft entry saving | 🟢 Complete | Auto-save at any step, creators can return |
| 4.6 | Entry review dashboard — brand | 🟢 Complete | Filterable list of all entries per campaign |
| 4.7 | Entry approval flow — Ripple | 🟢 Complete | Approve triggers initial fee payout + earnings record |
| 4.8 | Entry approval flow — Pitch | 🟢 Complete | Accept bid, creator posts, brand confirms, payout fires |
| 4.9 | Winner selection flow — Contest | 🟢 Complete | Brand selects winner, others marked not_selected, prize payout created |
| 4.10 | Entry edit request flow | 🟢 Complete | Brand sends edit notes, entry returns to draft, creator resubmits |
| 4.11 | Entry rejection flow | 🟢 Complete | Brand rejects with reason, notification shown to creator |
| 4.12 | Entry status notifications | ⏸ Deferred | Phase 8 — will be built with the full notifications system |

---

## Phase 5 — View Tracking & Milestones

| # | Feature | Status | Notes |
|---|---|---|---|
| 5.1 | TikTok OAuth social account connection | 🟢 Complete | Real API + stub mode; video.list for view counts |
| 5.2 | Instagram OAuth social account connection | 🟢 Complete | Real API + long-lived token exchange + stub mode |
| 5.3 | YouTube OAuth social account connection | 🟢 Complete | Real API + offline access params + stub mode |
| 5.4 | SyncViewCountJob — scheduled every 6h | 🟢 Complete | Configurable via VIEW_SYNC_FREQUENCY_HOURS |
| 5.5 | Milestone detection logic — Ripple | 🟢 Complete | Budget cap + per-creator cap both enforced |
| 5.6 | view_sync_logs audit trail | 🟢 Complete | Written on every success/failure |
| 5.7 | Contest deadline resolution job | 🟢 Complete | Final sync → rank → payouts → campaign closed |
| 5.8 | Token refresh handling | 🟢 Complete | Hourly job + just-in-time refresh during sync |

---

## Phase 6 — Payouts

| # | Feature | Status | Notes |
|---|---|---|---|
| 6.1 | Stripe Connect creator onboarding | 🔴 Not started | Stripe Express account creation during creator onboarding |
| 6.2 | Platform fee deduction logic | 🔴 Not started | 15% deducted from gross before transfer |
| 6.3 | Contest prize payout | 🔴 Not started | Released when brand selects winner |
| 6.4 | Ripple initial fee payout | 🔴 Not started | Released immediately on entry approval |
| 6.5 | Ripple milestone payout | 🔴 Not started | Released automatically when milestone job detects crossing |
| 6.6 | Pitch payment payout | 🔴 Not started | Released when brand confirms post is live |
| 6.7 | Payout retry logic | 🔴 Not started | Auto-retry on failure, admin alert after 2 failures |
| 6.8 | Escrow refund on campaign cancellation | 🔴 Not started | Unspent Ripple budget returned to brand |
| 6.9 | Creator earnings dashboard | 🔴 Not started | Total earned, pending, transaction history by campaign |
| 6.10 | Minimum payout threshold | 🔴 Not started | Hold transfers until creator balance hits minimum |

---

## Phase 7 — Profiles & Discovery

| # | Feature | Status | Notes |
|---|---|---|---|
| 7.1 | Creator public profile | 🔴 Not started | Bio, niches, verified social stats, entry portfolio |
| 7.2 | Creator media kit | 🔴 Not started | Auto-generated shareable page from profile + stats |
| 7.3 | Brand public profile | 🔴 Not started | Active/past campaigns, aggregate stats |
| 7.4 | Creator search — brand side | 🔴 Not started | Meilisearch-powered, filter by niche/platform/followers/region |
| 7.5 | Creator profile indexing in Meilisearch | 🔴 Not started | Searchable trait on CreatorProfile model |

---

## Phase 8 — Messaging & Notifications

| # | Feature | Status | Notes |
|---|---|---|---|
| 8.1 | Message threads per entry | 🔴 Not started | One thread per entry scoped to brand + creator |
| 8.2 | Real-time messaging via Reverb | 🔴 Not started | Instant delivery, unread count in nav |
| 8.3 | In-app notifications via Reverb | 🔴 Not started | All key platform events |
| 8.4 | Email notifications via Resend | 🔴 Not started | All key platform events with user-level opt-out preferences |
| 8.5 | Notification preferences | 🔴 Not started | Per-user toggles for each notification type |

---

## Phase 9 — Analytics

| # | Feature | Status | Notes |
|---|---|---|---|
| 9.1 | Campaign analytics snapshots job | 🔴 Not started | Daily aggregation into campaign_analytics |
| 9.2 | Creator analytics snapshots job | 🔴 Not started | Weekly aggregation into creator_analytics |
| 9.3 | Brand analytics dashboard | 🔴 Not started | Views, cost per view, top creators, platform breakdown |
| 9.4 | Creator analytics dashboard | 🔴 Not started | Views, earnings, engagement trend, best niches |
| 9.5 | Admin analytics dashboard | 🔴 Not started | Platform GMV, take rate, user acquisition, top campaigns |

---

## Phase 10 — Growth Features

| # | Feature | Status | Notes |
|---|---|---|---|
| 10.1 | Referral system — creators | 🔴 Not started | Bonus on first referred creator entry |
| 10.2 | Referral system — brands | 🔴 Not started | Credit on first referred brand campaign |
| 10.3 | Co-brand campaigns | 🔴 Not started | Two brands co-fund a single campaign |
| 10.4 | Agency white-label mode | 🔴 Not started | Custom subdomain, team members, multi-brand management |
