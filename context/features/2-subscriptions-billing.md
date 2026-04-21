# Phase 2 — Subscriptions & Billing

**Status:** Complete  
**Implemented:** 2026-04-16

---

## Overview

Phase 2 wires Laravel Cashier (Stripe) into the platform so brands can subscribe to a plan and creators can optionally upgrade to Creator Pro. It covers the full subscription lifecycle: checkout, plan changes, cancellation/resumption, webhooks, billing dashboards, and enforcement middleware.

---

## Features Implemented

| # | Feature | Status |
|---|---|---|
| 2.1 | Brand subscription plans (Starter / Growth / Scale) | ✅ Complete |
| 2.2 | Creator subscription plans (Free / Creator Pro) | ✅ Complete |
| 2.3 | Subscription enforcement middleware | ✅ Complete |
| 2.4 | Free creator entry cap enforcement | ✅ Complete |
| 2.5 | Brand billing dashboard | ✅ Complete |
| 2.6 | Creator billing dashboard | ✅ Complete |
| 2.7 | Stripe webhook handling | ✅ Complete |
| 2.8 | Plan upgrade/downgrade flow | ✅ Complete |

---

## Architecture

### Package
`laravel/cashier` v16.5.1 installed. Cashier migrations create:
- `customer` columns on `users` (stripe_id, pm_type, pm_last_four, trial_ends_at)
- `subscriptions` table
- `subscription_items` table

### User Model (`app/Models/User.php`)
Added the `Billable` trait. Subscriptions are keyed by name:
- `'brand'` — brand subscription (Starter / Growth / Scale)
- `'creator'` — creator subscription (Free is the default, paid = Creator Pro)

### Config (`config/billing.php`)
Centralises plan definitions for both brand and creator tiers:
- Plan names, pricing in cents (monthly & annual)
- Stripe Price IDs read from env vars (`STRIPE_BRAND_STARTER_MONTHLY`, etc.)
- Campaign limits per brand plan (3 / 10 / null for unlimited)
- Entry limits per creator plan (2 / null for unlimited)

### BillingService (`app/Services/BillingService.php`)
Single responsibility service providing:
- `brandPlanKey(User)` — resolves active brand plan slug from Stripe Price ID
- `creatorPlanKey(User)` — resolves active creator plan (defaults to `'free'`)
- `brandCampaignLimit(User)` — returns the campaign cap (or null for unlimited)
- `creatorMonthlyEntryLimit(User)` — returns monthly entry cap (or null for unlimited)
- `brandCanCreateCampaign(User)` / `creatorCanSubmitEntry(User)` — boolean checks
- `invoices(User)` — returns formatted invoice list for the dashboard
- `isAnnual(Subscription)` — checks billing interval

### BillingController (`app/Http/Controllers/Billing/BillingController.php`)
Handles all billing interactions:
- `brandIndex` / `creatorIndex` — billing settings dashboards
- `brandCheckout` / `creatorCheckout` — Stripe Checkout redirect (new subscriptions) or `swap()` (plan changes)
- `portal` — Stripe Billing Portal redirect for payment method management
- `brandCancel` / `creatorCancel` — cancel at period end
- `brandResume` / `creatorResume` — resume during grace period
- `brandSuccess` / `creatorSuccess` — post-checkout success redirect
- `onboardingBrandCheckout` — checkout from onboarding flow (skips `EnsureOnboardingComplete` guard)

### WebhookController (`app/Http/Controllers/Billing/WebhookController.php`)
Extends Cashier's base webhook controller. Handles:
- `customer.subscription.created` / `updated` / `deleted` — delegated to Cashier defaults
- `invoice.payment_failed` — logs to warning channel after 2 failures

### Middleware
Three new middleware classes registered in `bootstrap/app.php`:

| Alias | Class | Behaviour |
|---|---|---|
| `brand.subscribed` | `EnsureBrandSubscription` | Blocks non-subscribed brands |
| `brand.campaign_limit` | `EnsureBrandCampaignLimit` | Blocks when plan limit reached |
| `creator.entry_limit` | `EnsureCreatorEntryLimit` | Blocks free tier after 2 entries/month |

Apply `brand.subscribed` and `brand.campaign_limit` to Phase 3 campaign creation routes.  
Apply `creator.entry_limit` to Phase 4 entry submission routes.

---

## Routes (`routes/billing.php`)

```
POST  /stripe/webhook                         (Cashier webhook — no auth)
POST  /billing/portal                         (auth, verified, onboarded)

GET   /settings/billing/brand                 (auth, brand)
POST  /billing/brand/checkout                 (auth, brand)
GET   /billing/brand/success                  (auth, brand)
POST  /billing/brand/cancel                   (auth, brand)
POST  /billing/brand/resume                   (auth, brand)

GET   /settings/billing/creator               (auth, creator)
POST  /billing/creator/checkout               (auth, creator)
GET   /billing/creator/success                (auth, creator)
POST  /billing/creator/cancel                 (auth, creator)
POST  /billing/creator/resume                 (auth, creator)

POST  /billing/onboarding/brand/checkout      (auth, brand — no onboarding gate)
```

---

## Frontend

### Onboarding — Brand (`resources/js/pages/onboarding/brand/billing.tsx`)
- Plan selector (Starter / Growth / Scale) with monthly/annual toggle
- Shows savings badge for annual billing
- "Subscribe & Continue" → POST to `/billing/onboarding/brand/checkout` → Stripe Checkout
- "Skip for now" → POST to `/onboarding/brand/billing` → proceeds to tour without subscription

### Onboarding — Creator (`resources/js/pages/onboarding/creator/payout.tsx`)
- Feature highlights (Win contests, Ripple, Pitch, Payouts)
- Side-by-side Free vs Creator Pro comparison with pricing
- "Start Creator Pro" → POST to `/billing/creator/checkout` → Stripe Checkout
- "Continue with free plan" → POST to `/onboarding/creator/complete`

### Settings — Brand Billing (`resources/js/pages/settings/billing/brand.tsx`)
- Current plan card with status badge
- Plan grid with monthly/annual toggle; current plan highlighted
- Inline upgrade/downgrade buttons (calls `/billing/brand/checkout`)
- "Manage payment method" → Stripe Portal
- Invoice history with PDF download links

### Settings — Creator Billing (`resources/js/pages/settings/billing/creator.tsx`)
- Current plan card (Free or Pro with status)
- Creator Pro upgrade card (hidden when already subscribed)
- Cancel / Resume controls
- Invoice history

### Settings Nav (`resources/js/layouts/settings/layout.tsx`)
Billing nav item is injected dynamically:
- Brand users → `/settings/billing/brand`
- Creator users → `/settings/billing/creator`

---

## Shared Props (`app/Http/Middleware/HandleInertiaRequests.php`)

`auth.billing` is now shared on every page:
```ts
auth.billing = {
    plan: 'growth' | 'free' | 'pro' | null,
    subscribed: boolean
}
```

`flash.success` and `flash.error` are also shared for one-time messages.

---

## Environment Variables Required

Add these to `.env` (Stripe test mode Price IDs):

```env
STRIPE_KEY=pk_test_...
STRIPE_SECRET=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

STRIPE_BRAND_STARTER_MONTHLY=price_...
STRIPE_BRAND_STARTER_ANNUAL=price_...
STRIPE_BRAND_GROWTH_MONTHLY=price_...
STRIPE_BRAND_GROWTH_ANNUAL=price_...
STRIPE_BRAND_SCALE_MONTHLY=price_...
STRIPE_BRAND_SCALE_ANNUAL=price_...

STRIPE_CREATOR_PRO_MONTHLY=price_...
STRIPE_CREATOR_PRO_ANNUAL=price_...
```

---

## Upgrade / Downgrade Flow

- **Upgrade mid-cycle** → `subscription->swap($newPriceId)` — Cashier prorates immediately
- **Downgrade** → same `swap()` call; Cashier handles at period end by default
- **Cancel** → `subscription->cancel()` — stays active until `ends_at`, then `canceled`
- **Resume** → `subscription->resume()` — available while `onGracePeriod()` is true

---

## Next: Phase 3 — Campaign System

Apply enforcement middleware to campaign creation routes:
```php
Route::post('/campaigns', ...)->middleware(['brand.subscribed', 'brand.campaign_limit']);
```
