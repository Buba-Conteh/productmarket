# Phase 9 — Analytics

**Status:** In Progress
**Branch:** feature/phase-9-analytics
**Started:** 2026-04-21

---

## Features

| # | Feature | Status |
|---|---|---|
| 9.1 | Campaign analytics snapshots job | 🟡 In Progress |
| 9.2 | Creator analytics snapshots job | 🟡 In Progress |
| 9.3 | Brand analytics dashboard | 🟡 In Progress |
| 9.4 | Creator analytics dashboard | 🟡 In Progress |
| 9.5 | Admin analytics dashboard | 🟡 In Progress |

---

## Overview

Daily/weekly aggregation jobs populate `campaign_analytics` and `creator_analytics` tables. Three dashboards consume this data: brand (campaign ROI), creator (earnings & views), admin (platform GMV). Charts via Recharts.

---

## Implementation Plan

### Backend

1. **Jobs**
   - `AggregateCampaignAnalyticsJob` — daily, per active campaign: entries, live count, total views, total paid out, top entry
   - `AggregateCreatorAnalyticsJob` — weekly, per creator: total views, total earned, entries count, avg engagement rate

2. **Schedule** — register both jobs in `routes/console.php`

3. **Controllers**
   - `BrandAnalyticsController` — campaign-level stats for brand's campaigns
   - `CreatorAnalyticsController` — earnings + view trends for creator
   - `AdminAnalyticsController` — platform-wide GMV, take rate, top campaigns, user acquisition

### Frontend

- Install `recharts`
- Brand: views over time, cost-per-view, top creators table, platform breakdown pie
- Creator: views per entry, earnings per campaign, engagement trend line
- Admin: GMV bar chart, take rate, top campaigns, user growth

---

## History

- 2026-04-21: Phase 9 documented, implementation started
