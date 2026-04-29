# Feature: Subscription Status Table

## Overview

A denormalized `subscription_statuses` table that caches each user's current plan key
and Stripe subscription status. Avoids hitting the `subscriptions` table + config
matching on every request, and gives a single fast lookup for plan/status anywhere
in the app.

## Status: In Progress

## Why

Previously, knowing a brand's plan required:
1. Query `subscriptions` table for the user's active subscription
2. Loop through `config/billing.php` to match `stripe_price` → plan key

This ran on **every request** via `HandleInertiaRequests`. It also meant there was no
simple way to query "all growth brands" or "all active creator pro users" in SQL.

## Table Schema

| column | type | notes |
|---|---|---|
| `id` | ulid PK | |
| `user_id` | ulid FK | cascade delete |
| `role` | string | `brand` or `creator` |
| `plan_key` | string nullable | `starter` / `growth` / `scale` / `free` / `pro` |
| `stripe_status` | string nullable | mirrors Stripe: `active` / `trialing` / `past_due` / `cancelled` |
| `synced_at` | timestamp nullable | when this row was last written |
| timestamps | | |

Unique constraint on `(user_id, role)` — one row per role per user.

## Sync Points

The `BillingService::syncStatus(User, string $role)` method upserts the row.
It is called from:

- `WebhookController` — after `subscription.created`, `subscription.updated`, `subscription.deleted`
- `BillingController` — after `brandSuccess`, `creatorSuccess`, `brandCancel`, `creatorCancel`, `brandResume`, `creatorResume`
- `TestUserSeeder` — seeds a row for every test user

## Impact on Existing Code

- `HandleInertiaRequests` — reads from `subscription_statuses` instead of calling
  `BillingService::brandPlanKey()` + `$user->subscribed()` on every request
- `BillingService::brandPlanKey()` / `creatorPlanKey()` — unchanged (still source of
  truth for writing the status; used by security middleware)
- `EnsureBrandSubscription` / `EnsureBrandCampaignLimit` — unchanged (still use
  Cashier for security-critical checks)
