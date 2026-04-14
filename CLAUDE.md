# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ProductMarket is a viral content marketing platform connecting brands with creators via three campaign types: **Contest** (brands pick winners), **Ripple** (CPM-based pay-per-view), and **Pitch** (creator-initiated brand deals). The core differentiator is verified view-count tracking rather than creator self-reporting.

Stack: **Laravel 13** backend + **React 19 + Inertia.js v3** frontend, bridged as an SPA (no separate REST API). TypeScript strict mode throughout. See `context/` for detailed specs.

## Commands

### PHP / Backend

```bash
composer setup          # Full setup: install deps, migrate, seed
composer dev            # Run dev stack concurrently (serve + queue + npm dev)
composer lint           # PHP Pint (auto-fix)
composer lint:check     # PHP Pint (check only)
composer test           # Clear config cache, run Pint, then Pest
composer ci:check       # Full CI: npm lint:check + format:check + types:check + test
```

### Node / Frontend

```bash
npm run dev             # Vite dev server
npm run build           # Production asset build
npm run build:ssr       # SSR build
npm run lint            # ESLint (auto-fix)
npm run lint:check      # ESLint (check only)
npm run format          # Prettier (auto-fix)
npm run format:check    # Prettier (check only)
npm run types:check     # TypeScript (no emit)
```

### Running a Single Test

```bash
php artisan test --filter TestClassName
./vendor/bin/pest tests/Feature/SomeTest.php
./vendor/bin/pest --filter "it does something"
```

## Architecture

### Laravel ↔ React via Inertia

There is **no REST API**. Laravel controllers return `Inertia::render('PageName', $props)`, which mounts the corresponding React page component in `resources/js/pages/`. Shared props (auth user, flash messages, permissions) are injected once in `config/inertia.php` and available to every page.

### Frontend Structure (`resources/js/`)
- The frontend must be on coponent based.
- **`app.tsx`** — Inertia app entry point; resolves page components and wraps them in layouts
- **`pages/`** — One component per route; receives typed props directly from Laravel controllers
- **`layouts/`** — `AppLayout` (authenticated shell with sidebar), `AuthLayout`, `SettingsLayout`
- **`components/`** — Reusable UI built on shadcn/ui + Tailwind v4
- **`actions/` / `routes/` / `wayfinder/`** — **Auto-generated** by the Wayfinder package from Laravel routes; do not edit manually
- **`types/`** — TypeScript interfaces; `@/` path alias maps to `resources/js/`

### Backend Structure (`app/`)

- **`Actions/`** — Single-responsibility classes wired to Laravel Fortify (auth flows)
- **`Http/Controllers/`** — Thin controllers; delegate to Actions or Services
- **`Models/`** — Eloquent with ULIDs (never auto-increment integers), Spatie Permission roles
- **`Providers/FortifyServiceProvider`** — Registers all auth action bindings

### Database Design Decisions

- **ULIDs** on all primary keys (chronologically sortable, safe for public URLs)
- **Encrypted columns** for OAuth tokens
- **Type-specific detail tables** (`campaign_contest_details`, `campaign_ripple_details`, `campaign_pitch_details`) instead of nullable polymorphic columns
- **Pivot tables** (not JSON) for many-to-many relations (platforms, niches, content types)
- **Denormalized `total_earnings`** on `creator_profiles` for fast dashboard reads
- See `context/database-schema.md` for full 60+ table schema spec

### Authentication

Laravel Fortify handles registration, login, password reset, email verification, and 2FA. Roles (`brand`, `creator`, `admin`) are managed via Spatie Permission. Session auth via Laravel Sanctum.

### Key Third-Party Services

| Service | Purpose |
|---|---|
| Stripe Cashier | Brand subscriptions |
| Stripe Connect | Creator payouts |
| Cloudflare R2 + Spatie Media Library | Video/image uploads |
| Meilisearch + Laravel Scout | Campaign and creator discovery |
| Laravel Reverb | WebSocket messaging and notifications |
| Laravel Horizon + Redis | Async job processing |
| Resend | Transactional email |

## Code Style
- Model, View, Controler
- **PHP**: Laravel Pint with the `laravel` preset (`pint.json`)
- **JS/TS**: ESLint v9 flat config + Prettier (4-space indent, single quotes, 80-char width, Tailwind class sorting)
- CI enforces all linting before merges to `develop`/`main`
- Follow this rules in the @context/laravel-rules.md

 # React
 - Functional components only (no class compnents)
 - Keep componets focused - One jobe per component
 - Extract reusable logic into custom hooks
 - Use hooks for reusable side effects
 
## Context Documentation
Read the following to get the full context of the project:

- @context/project-overview.md 
- @context/detailed-project.md 
- @context/database-schema.md 

## Project Roadmap

The `context/` directory contains authoritative specs:
- `context/project-overview.md` — 84-feature roadmap across 10 phases with completion status
- `context/project-detail.md` — Tech stack rationale and per-phase feature descriptions
- `context/database-schema.md` — Full schema design with relationship decisions

Currently implemented: authentication scaffolding (Fortify), user settings pages, app shell with sidebar. Core campaign/entry/payout system is unbuilt.
