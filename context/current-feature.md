# Phase 10 — Growth Features

**Status:** In Progress
**Branch:** feature/phase-10-growth
**Started:** 2026-04-21

---

## Features

| # | Feature | Status |
|---|---|---|
| 10.1 | Referral system — creators | 🟡 In Progress |
| 10.2 | Referral system — brands | 🟡 In Progress |
| 10.3 | Co-brand campaigns | 🟡 In Progress |
| 10.4 | Agency white-label mode | 🟡 In Progress |

---

## Overview

Final phase. Referral codes for both user types, co-sponsored campaigns (two brands), and agency team management under a parent brand account.

---

## Implementation Plan

### 10.1 & 10.2 — Referral System
- `Referral` model already exists with referral_code, type (creator/brand), status (pending/qualified/rewarded)
- `ReferralService` — generate code on registration, track referred signups, pay bonus via ProcessPayoutJob
- Referral code shown in profile settings, shareable link
- On registration: check referral_code query param, create Referral record
- Qualified trigger: creator = first entry submitted; brand = first campaign published
- Reward: creator bonus from platform_settings.referral_creator_bonus; brand credit applied as Cashier balance

### 10.3 — Co-Brand Campaigns
- `CampaignCoBrand` model already exists
- Brand can invite another brand to co-sponsor during campaign creation
- Invited brand accepts/declines; contribution locked in escrow
- Both brands can review entries; payout split proportionally

### 10.4 — Agency White-Label Mode
- `AgencyMember` model already exists
- Scale-plan brands can enable agency mode and invite team members
- Team member roles: owner, manager, viewer
- Shared campaign dashboard across all team members

---

## History

- 2026-04-21: Phase 10 documented, implementation started
