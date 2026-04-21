# Phase 7 — Profiles & Discovery

## Status: Complete (7.1–7.4) | Deferred (7.5)

## Overview

Adds public profiles for creators and brands, a creator media kit, and a brand-side creator search page.

## Features

### 7.1 Creator Public Profile
- Route: `GET /creators/{creatorProfile}` → `profiles.creator.show`
- Controller: `App\Http\Controllers\Profiles\CreatorProfileController@show`
- Page: `resources/js/pages/profiles/creator/show.tsx`
- Shows: avatar, display name, country, bio, niches, verified social accounts (handle/followers/avg views/engagement), entry portfolio (live entries with per-platform view counts), aggregate stats (total verified views, live campaign count, total earned)
- Media Kit button links to 7.2

### 7.2 Creator Media Kit
- Route: `GET /creators/{creatorProfile}/media-kit` → `profiles.creator.media-kit`
- Controller: `App\Http\Controllers\Profiles\CreatorProfileController@mediaKit`
- Page: `resources/js/pages/profiles/creator/media-kit.tsx`
- Print-friendly layout (browser print/PDF via `window.print()`)
- Shows: all profile data + top 6 recent live entries
- Footer: "All view counts are platform-verified"

### 7.3 Brand Public Profile
- Route: `GET /brands/{brandProfile}` → `profiles.brand.show`
- Controller: `App\Http\Controllers\Profiles\BrandProfileController@show`
- Page: `resources/js/pages/profiles/brand/show.tsx`
- Shows: logo, company name, industry, description, website link, aggregate stats (total/active/completed campaigns, total entries), active campaigns grid (links to discover page), past campaigns grid

### 7.4 Creator Search (Brand Side)
- Route: `GET /creators` → `brand.creators.index` (brand role only)
- Controller: `App\Http\Controllers\Brand\CreatorSearchController@index`
- Page: `resources/js/pages/brand/creators/index.tsx`
- SQL-based search (Meilisearch deferred as 7.5)
- Filters: text search (name/bio), niche, platform (verified accounts only), country, min/max followers
- Results paginated 18/page, ordered by total_earned desc
- Creator cards show avatar, name, country, bio snippet, niche badges, top social account

### 7.5 Creator Profile Indexing in Meilisearch
- **Deferred** — Meilisearch not running locally
- Same deferral pattern as 3.11 (campaign search)
- 7.4 uses SQL queries in the meantime

## Files Created

### Backend
- `app/Http/Controllers/Profiles/CreatorProfileController.php`
- `app/Http/Controllers/Profiles/BrandProfileController.php`
- `app/Http/Controllers/Brand/CreatorSearchController.php`
- `routes/profiles.php`

### Frontend
- `resources/js/types/profile.ts` (CreatorPublicProfile, BrandPublicProfile, CreatorSearchResult, etc.)
- `resources/js/pages/profiles/creator/show.tsx`
- `resources/js/pages/profiles/creator/media-kit.tsx`
- `resources/js/pages/profiles/brand/show.tsx`
- `resources/js/pages/brand/creators/index.tsx`

## Notes
- Total views calculated via raw DB query on `entry_platforms` pivot table (not `withSum`) to avoid pivot column aggregation issues
- Creator search filters `platform_id` against verified social accounts only
- Brand search route protected by `role:brand` middleware
