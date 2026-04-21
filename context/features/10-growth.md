# Phase 10 — Growth Features

**Status:** Complete
**Branch:** feature/phase-10-growth
**Completed:** 2026-04-21

---

## Features Shipped

| # | Feature | Status |
|---|---|---|
| 10.1 | Referral system — creators | ✅ Complete |
| 10.2 | Referral system — brands | ✅ Complete |
| 10.3 | Co-brand campaigns | ✅ Complete |
| 10.4 | Agency white-label mode | ✅ Complete |

---

## Implementation

### Referral System (10.1 & 10.2)
- `referral_code` column added to `users` (unique, generated on registration via `ReferralService::generateCode`)
- `ReferralService` — `attachReferral()` links referred user to referrer on signup; `qualify()` marks pending → rewarded when trigger fires
- Creator trigger: first entry submitted (`EntryService::submit`)
- Brand trigger: first campaign published (`CampaignService::publish`)
- Reward: creator gets `pending_earnings` incremented; brand gets Cashier balance credit
- Registration accepts `?ref=CODE` query param — `CreateNewUser` action passes it to `ReferralService`
- `/referrals` page shows code, shareable link, and table of all referrals with status

### Co-Brand Campaigns (10.3)
- `CoBrandController` — invite by brand email, accept/decline endpoints
- `/campaigns/{id}/co-brands` — invite form + co-sponsor status list
- Contribution amount and percentage stored on `campaign_co_brands`

### Agency White-Label Mode (10.4)
- `AgencyController` — invite/accept/remove team members, enableAgency (Scale plan gate)
- `/agency` — member list with role + acceptance status, invite form
- Role options: manager, viewer
- `is_agency` flag toggled on `brand_profiles` via `POST /agency/enable`

### Routes (`routes/growth.php`)
- `GET /referrals`
- `GET|POST /campaigns/{campaign}/co-brands` + accept/decline
- `GET|POST|DELETE /agency` + members management + enable

### Frontend (`resources/js/pages/growth/`)
- `referrals.tsx` — copy link button, referral code display, referral table with status badges
- `co-brands.tsx` — invite form + co-sponsor list
- `agency.tsx` — team member invite form with role select, member list with remove action

Referrals link added to both brand and creator sidebars.
