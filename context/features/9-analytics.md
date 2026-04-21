# Phase 9 — Analytics

**Status:** Complete
**Branch:** feature/phase-9-analytics
**Completed:** 2026-04-21

---

## Features Shipped

| # | Feature | Status |
|---|---|---|
| 9.1 | Campaign analytics snapshots job | ✅ Complete |
| 9.2 | Creator analytics snapshots job | ✅ Complete |
| 9.3 | Brand analytics dashboard | ✅ Complete |
| 9.4 | Creator analytics dashboard | ✅ Complete |
| 9.5 | Admin analytics dashboard | ✅ Complete |

---

## Implementation

### Jobs
- `AggregateCampaignAnalyticsJob` — daily at 02:00, snapshots views/entries/paid_out per active campaign into `campaign_analytics`
- `AggregateCreatorAnalyticsJob` — weekly Monday at 03:00, snapshots views/earnings/entries per creator into `creator_analytics`
- Both registered in `routes/console.php` scheduler

### Controllers (`app/Http/Controllers/Analytics/`)
- `BrandAnalyticsController` — views over 30 days, campaign table, platform breakdown, top creators, CPM summary
- `CreatorAnalyticsController` — weekly snapshots, top entries by views, earnings per campaign
- `AdminAnalyticsController` — GMV/revenue by month (PostgreSQL DATE_TRUNC), user growth, top campaigns, take rate

### Frontend (`resources/js/pages/analytics/`)
- `brand.tsx` — BarChart (views+spend), PieChart (platform breakdown), top creators list, campaign table
- `creator.tsx` — LineChart (views trend), horizontal BarChart (earnings per campaign), top entries list, weekly earnings BarChart
- `admin.tsx` — BarChart (GMV+revenue), LineChart (user growth), top campaigns list

All charts via **Recharts**. Empty states shown when no data exists.

### Routes (`routes/analytics.php`)
- `GET /analytics` — brand (role:brand)
- `GET /creator/analytics` — creator (role:creator)
- `GET /admin/analytics` — admin (role:admin)

Creator analytics link added to sidebar Earnings section.
