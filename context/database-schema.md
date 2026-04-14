# Database Schema Plan

## Campaign Types

| Type | Name | Description |
|---|---|---|
| Contest | **Contest** | Brand posts a brief, creators submit privately, brand picks a winner who then posts publicly |
| CPM | **Ripple** | Brand pays creators an upfront fee + milestone payouts as views accumulate |
| Deal | **Pitch** | Brand lists a product, creators pitch themselves with a bid, brand accepts or rejects |

---

## Design Decisions

- **ULIDs** over auto-increment integers — safe to expose in URLs, sorts chronologically, better for distributed systems. Laravel 13 supports `HasUlids` natively.
- **Encrypted columns** — `oauth_token` and `oauth_refresh_token` use Laravel's `encrypted` cast. Never stored in plain text.
- **Denormalized earnings** — `total_earned` and `pending_earnings` on `creator_profiles` are updated by the payout job to avoid expensive aggregation queries on the earnings dashboard.
- **Type-specific detail tables** — instead of one wide `campaigns` table full of nullable columns, each campaign type gets its own child table. Keeps the base table clean and queries fast.
- **Lookup tables over enums** — values that could grow, need labels, need ordering, or an admin might manage are extracted into their own tables. Enums are only used for true state machine fields tied to application logic.
- **Pivot tables over JSON arrays** — platform selections, niche tags, and content types are proper relationships, not JSON columns. Cleaner queries, proper foreign keys, easier Meilisearch indexing.
- **Spatie Media Library** — avatars, logos, and product images are managed by Media Library collections.
- **Meilisearch indexes** — `creator_profiles` and `campaigns` get the `Searchable` trait. Everything else queries PostgreSQL directly.

---

## Enum vs Lookup Table Decisions

| Column | Decision | Reason |
|---|---|---|
| `campaigns.type` | **Keep enum** | Fixed business logic, tied to code |
| `campaigns.status` | **Keep enum** | State machine, tied to code |
| `entries.status` | **Keep enum** | State machine |
| `payouts.payout_type` | **Keep enum** | Fixed business logic |
| `payouts.status` | **Keep enum** | State machine |
| `escrow_transactions.status` | **Keep enum** | State machine |
| `users.status` | **Keep enum** | State machine |
| `stripe_connect_status` | **Keep enum** | Mirrors Stripe's own states |
| `agency_members.role` | **Keep enum** | Handled by Spatie Permission |
| `referrals.type` | **Keep enum** | Fixed, tied to user role logic |
| `referrals.status` | **Keep enum** | State machine |
| `social_accounts.platform` | **Lookup table** | New platforms will be added |
| `creator_profiles.niches` | **Lookup + pivot** | Needs labels, ordering, icons |
| `brand_profiles.industry` | **Lookup table** | Admin should manage this list |
| `entries.content_type` | **Lookup table** | Will grow, needs display labels |
| `entries.platforms` | **Pivot table** | Links to platforms lookup |
| `campaigns.allowed_platforms` | **Pivot table** | Links to platforms lookup |
| `campaigns.content_types` | **Pivot table** | Links to content types lookup |
| `view_sync_logs.platform` | **FK to platforms** | Consistency with rest of schema |

---

## Table Groups

---

### 1. Lookup Tables

#### `platforms`

| column | type | notes |
|---|---|---|
| id | ulid PK | |
| name | string unique | e.g. TikTok |
| slug | string unique | e.g. tiktok |
| icon_url | string nullable | |
| is_active | boolean | default true — admin can disable |
| sort_order | integer | default 0 |
| timestamps | | |

---

#### `niches`

| column | type | notes |
|---|---|---|
| id | ulid PK | |
| name | string unique | e.g. Fitness |
| slug | string unique | e.g. fitness |
| icon_url | string nullable | |
| is_active | boolean | default true |
| sort_order | integer | default 0 |
| timestamps | | |

---

#### `industries`

| column | type | notes |
|---|---|---|
| id | ulid PK | |
| name | string unique | e.g. Health & Wellness |
| slug | string unique | |
| is_active | boolean | default true |
| sort_order | integer | default 0 |
| timestamps | | |

---

#### `content_types`

| column | type | notes |
|---|---|---|
| id | ulid PK | |
| name | string unique | e.g. Get Ready With Me |
| slug | string unique | e.g. grwm |
| description | string nullable | |
| is_active | boolean | default true |
| sort_order | integer | default 0 |
| timestamps | | |

---

### 2. Users & Profiles

#### `users`
Laravel's standard users table, extended.

| column | type | notes |
|---|---|---|
| id | ulid PK | |
| name | string | |
| email | string unique | |
| password | hashed string | |
| avatar | string nullable | R2 path via Media Library |
| country | string nullable | |
| status | enum | active, suspended, banned |
| email_verified_at | timestamp nullable | |
| last_active_at | timestamp nullable | |
| timestamps | | |

> Spatie Permission assigns roles (`brand`, `creator`, `admin`) on this model. No role column needed in the table itself. Role switching exists in the schema but is locked at the app layer until released.

---

#### `brand_profiles`
One-to-one with users who have the brand role.

| column | type | notes |
|---|---|---|
| id | ulid PK | |
| user_id | ulid FK | |
| company_name | string | |
| website | string nullable | |
| industry_id | ulid FK | references industries |
| description | text nullable | |
| logo | string nullable | R2 path |
| stripe_customer_id | string nullable | Cashier |
| is_agency | boolean | default false |
| timestamps | | |

---

#### `creator_profiles`
One-to-one with users who have the creator role.

| column | type | notes |
|---|---|---|
| id | ulid PK | |
| user_id | ulid FK | |
| display_name | string | |
| bio | text nullable | |
| stripe_connect_id | string nullable | Stripe Express account |
| stripe_connect_status | enum | pending, active, restricted |
| total_earned | decimal 10,2 | denormalized for speed |
| pending_earnings | decimal 10,2 | denormalized for speed |
| timestamps | | |

---

#### `creator_niches`
Replaces the `niches` json column on `creator_profiles`.

| column | type | notes |
|---|---|---|
| creator_profile_id | ulid FK | |
| niche_id | ulid FK | |

> Primary key on `(creator_profile_id, niche_id)`.

---

#### `social_accounts`
A creator can connect multiple platforms.

| column | type | notes |
|---|---|---|
| id | ulid PK | |
| user_id | ulid FK | |
| platform_id | ulid FK | references platforms |
| handle | string | |
| platform_user_id | string | from OAuth response |
| oauth_token | text encrypted | |
| oauth_refresh_token | text encrypted nullable | |
| token_expires_at | timestamp nullable | |
| follower_count | integer | synced periodically |
| avg_views | integer nullable | rolling average |
| engagement_rate | decimal 5,2 nullable | |
| verified | boolean | default false |
| last_synced_at | timestamp nullable | |
| timestamps | | |

> Unique constraint on `(user_id, platform_id)` — one account per platform per user.

---

#### `agency_members`
Team members under an agency brand account.

| column | type | notes |
|---|---|---|
| id | ulid PK | |
| agency_brand_profile_id | ulid FK | references brand_profiles |
| user_id | ulid FK | the invited user |
| role | enum | owner, manager, viewer |
| invited_at | timestamp | |
| accepted_at | timestamp nullable | |
| timestamps | | |

---

### 3. Campaigns

#### `campaigns`
Base table shared by all three campaign types.

| column | type | notes |
|---|---|---|
| id | ulid PK | |
| brand_profile_id | ulid FK | |
| type | enum | contest, ripple, pitch |
| title | string | |
| brief | longtext | rich text HTML |
| requirements | json | array of requirement strings |
| required_hashtags | json | array of strings |
| target_regions | json | array of country codes, null = global |
| inspiration_links | json | array of URLs |
| platform_fee_pct | decimal 5,2 | snapshot of fee at creation time |
| status | enum | draft, pending_escrow, active, closed, completed, cancelled |
| published_at | timestamp nullable | |
| deadline | timestamp nullable | |
| max_creators | integer nullable | cap on approved creators |
| ai_brief_used | boolean | default false |
| timestamps | | |

---

#### `campaign_platforms`
Replaces the `allowed_platforms` json column on `campaigns`.

| column | type | notes |
|---|---|---|
| campaign_id | ulid FK | |
| platform_id | ulid FK | |

> Primary key on `(campaign_id, platform_id)`.

---

#### `campaign_content_types`
Replaces the `content_types` json column on `campaigns`.

| column | type | notes |
|---|---|---|
| campaign_id | ulid FK | |
| content_type_id | ulid FK | |

> Primary key on `(campaign_id, content_type_id)`.

---

#### `campaign_contest_details`
One-to-one with Contest campaigns.

| column | type | notes |
|---|---|---|
| id | ulid PK | |
| campaign_id | ulid FK unique | |
| prize_amount | decimal 10,2 | what the winner receives |
| runner_up_prize | decimal 10,2 nullable | optional second place prize |
| winner_entry_id | ulid FK nullable | set when brand picks winner |
| winner_selected_at | timestamp nullable | |
| selection_notes | text nullable | brand's internal notes |

> Entries stay in `pending_review` until brand picks a winner. Winning entry moves to `won`. All others move to `not_selected`. No public posting until winner is selected.

---

#### `campaign_ripple_details`
One-to-one with Ripple campaigns.

| column | type | notes |
|---|---|---|
| id | ulid PK | |
| campaign_id | ulid FK unique | |
| initial_fee | decimal 10,2 | flat fee paid to each approved creator upfront |
| rpm_rate | decimal 8,2 | earnings per 1,000 verified views |
| milestone_interval | integer | views per milestone e.g. 100000 |
| max_payout_per_creator | decimal 10,2 nullable | cap on total one creator can earn |
| total_budget | decimal 10,2 | total amount committed to escrow |
| budget_spent | decimal 10,2 | default 0, updated as payouts fire |

> On approval, initial fee pays immediately. Every time `SyncViewCountJob` runs and a creator crosses a milestone, a payout is queued automatically. Continues until deadline or budget exhausted.

---

#### `campaign_pitch_details`
One-to-one with Pitch campaigns.

| column | type | notes |
|---|---|---|
| id | ulid PK | |
| campaign_id | ulid FK unique | |
| product_name | string | |
| product_description | text nullable | |
| product_url | string nullable | |
| product_images | json nullable | array of R2 paths |
| budget_cap | decimal 10,2 nullable | max brand will spend across all pitches |
| min_bid | decimal 10,2 nullable | floor price brand will accept |
| max_bid | decimal 10,2 nullable | ceiling price brand will accept |

> Creators browse pitch campaigns, propose a bid, brand accepts or rejects. Accepted bid locks in escrow. Creator posts, brand confirms, payment releases.

---

#### `campaign_co_brands`
For co-sponsored campaigns (Phase 7).

| column | type | notes |
|---|---|---|
| id | ulid PK | |
| campaign_id | ulid FK | |
| brand_profile_id | ulid FK | the co-sponsoring brand |
| contribution_amount | decimal 10,2 | |
| contribution_pct | decimal 5,2 | calculated share of prize pool |
| status | enum | invited, accepted, declined |
| timestamps | | |

---

#### `campaign_applications`
For Pitch campaigns where creators apply before submitting an entry.

| column | type | notes |
|---|---|---|
| id | ulid PK | |
| campaign_id | ulid FK | |
| creator_profile_id | ulid FK | |
| pitch | text nullable | why they want the deal |
| status | enum | pending, approved, rejected |
| timestamps | | |

> Unique constraint on `(campaign_id, creator_profile_id)`.

---

### 4. Entries

#### `entries`
Core table for all creator submissions across all campaign types.

| column | type | notes |
|---|---|---|
| id | ulid PK | |
| campaign_id | ulid FK | |
| creator_profile_id | ulid FK | |
| content_type_id | ulid FK | references content_types |
| type | enum | contest, ripple, pitch — mirrors campaign type |
| video_url | string nullable | R2 path |
| video_duration_sec | integer nullable | |
| caption | text nullable | |
| tags | json | array of strings |
| requirements_acknowledged | boolean | default false |
| status | enum | draft, pending_review, approved, rejected, live, won, not_selected, disqualified |
| rejection_reason | string nullable | |
| approved_at | timestamp nullable | |
| live_at | timestamp nullable | when creator actually posts publicly |
| submitted_at | timestamp nullable | |
| timestamps | | |

> Unique constraint on `(campaign_id, creator_profile_id)` — one entry per creator per campaign.

---

#### `entry_platforms`
Replaces the `platforms` json column, `posted_urls`, `verified_view_count`, and `last_synced_at` on `entries`. Tracks per-platform posting and view counts.

| column | type | notes |
|---|---|---|
| entry_id | ulid FK | |
| platform_id | ulid FK | references platforms |
| posted_url | string nullable | actual live post URL on this platform |
| verified_view_count | bigint | default 0 |
| last_synced_at | timestamp nullable | |

> Primary key on `(entry_id, platform_id)`.

---

#### `entry_pitch_details`
Extra fields only Pitch entries need.

| column | type | notes |
|---|---|---|
| id | ulid PK | |
| entry_id | ulid FK unique | |
| proposed_bid | decimal 10,2 | what the creator asked for |
| accepted_bid | decimal 10,2 nullable | what brand agreed to |
| pitch | text nullable | creator's pitch to the brand |
| bid_accepted_at | timestamp nullable | |

---

#### `entry_ripple_earnings`
Tracks every earning event per Ripple entry.

| column | type | notes |
|---|---|---|
| id | ulid PK | |
| entry_id | ulid FK | |
| campaign_ripple_details_id | ulid FK | |
| milestone_number | integer | 1st, 2nd, 3rd milestone etc |
| views_at_milestone | bigint | view count when milestone was hit |
| amount | decimal 10,2 | RPM calculated payout for this milestone |
| type | enum | initial_fee, milestone |
| triggered_at | timestamp | when the job detected the milestone |
| payout_id | ulid FK nullable | links to payouts table once processed |

> Full audit trail of every earning event per creator per Ripple campaign.

---

#### `entry_edit_requests`
Tracks back-and-forth on entries the brand wants revised.

| column | type | notes |
|---|---|---|
| id | ulid PK | |
| entry_id | ulid FK | |
| requested_by_user_id | ulid FK | |
| notes | text | |
| status | enum | pending, addressed, dismissed |
| addressed_at | timestamp nullable | |
| timestamps | | |

---

#### `view_sync_logs`
Audit trail for every API sync job run.

| column | type | notes |
|---|---|---|
| id | ulid PK | |
| entry_id | ulid FK | |
| platform_id | ulid FK | references platforms |
| view_count | bigint | count at time of sync |
| synced_at | timestamp | |
| success | boolean | |
| error_message | string nullable | |

---

### 5. Payments

#### `escrow_transactions`

| column | type | notes |
|---|---|---|
| id | ulid PK | |
| campaign_id | ulid FK | |
| brand_profile_id | ulid FK | |
| total_held | decimal 10,2 | full amount deposited |
| total_released | decimal 10,2 | default 0, increases as payouts fire |
| total_refunded | decimal 10,2 | default 0, returned if budget unspent |
| stripe_payment_intent_id | string | |
| status | enum | pending, held, partially_released, fully_released, refunded |
| held_at | timestamp nullable | |
| fully_released_at | timestamp nullable | |
| timestamps | | |

> For Ripple campaigns, `total_released` increments with every milestone payout. If the campaign ends with budget remaining, the difference is refunded to the brand.

---

#### `payouts`

| column | type | notes |
|---|---|---|
| id | ulid PK | |
| entry_id | ulid FK | |
| creator_profile_id | ulid FK | |
| campaign_id | ulid FK | |
| gross_amount | decimal 10,2 | before platform fee |
| platform_fee | decimal 10,2 | |
| net_amount | decimal 10,2 | what creator receives |
| payout_type | enum | contest_prize, contest_runner_up, ripple_initial_fee, ripple_milestone, pitch_payment |
| stripe_transfer_id | string nullable | |
| status | enum | pending, processing, paid, failed |
| failure_reason | string nullable | |
| retry_count | tinyint | default 0 |
| paid_at | timestamp nullable | |
| timestamps | | |

---

#### `platform_settings`
Single-row config table managed by admin.

| column | type | notes |
|---|---|---|
| id | integer PK | always 1 |
| platform_fee_pct | decimal 5,2 | e.g. 15.00 |
| contest_split_first | decimal 5,2 | e.g. 50.00 |
| contest_split_second | decimal 5,2 | e.g. 25.00 |
| contest_split_third | decimal 5,2 | e.g. 15.00 |
| contest_split_pool | decimal 5,2 | e.g. 10.00 shared by all who hit threshold |
| min_creator_payout | decimal 10,2 | minimum balance before transfer triggers |
| referral_creator_bonus | decimal 10,2 | |
| referral_brand_credit | decimal 10,2 | |
| updated_at | timestamp | |

---

### 6. Messaging & Notifications

#### `message_threads`
One thread per entry.

| column | type | notes |
|---|---|---|
| id | ulid PK | |
| entry_id | ulid FK unique | |
| last_message_at | timestamp nullable | |
| timestamps | | |

---

#### `messages`

| column | type | notes |
|---|---|---|
| id | ulid PK | |
| thread_id | ulid FK | |
| sender_user_id | ulid FK | |
| body | text | |
| read_at | timestamp nullable | |
| timestamps | | |

---

#### `notifications`
Laravel's standard notifications table. Generated by the framework — no changes needed.

---

### 7. Growth

#### `referrals`

| column | type | notes |
|---|---|---|
| id | ulid PK | |
| referrer_user_id | ulid FK | |
| referred_user_id | ulid FK | |
| referral_code | string unique | |
| type | enum | creator, brand |
| status | enum | pending, qualified, rewarded |
| qualified_at | timestamp nullable | when referred user hit the trigger action |
| rewarded_at | timestamp nullable | |
| timestamps | | |

---

### 8. Analytics

#### `campaign_analytics`
Daily snapshots — not raw events.

| column | type | notes |
|---|---|---|
| id | ulid PK | |
| campaign_id | ulid FK | |
| date | date | |
| total_entries | integer | |
| total_live | integer | |
| total_views | bigint | |
| total_paid_out | decimal 10,2 | |
| top_entry_id | ulid nullable | |

> Unique constraint on `(campaign_id, date)`.

---

#### `creator_analytics`
Weekly snapshots per creator.

| column | type | notes |
|---|---|---|
| id | ulid PK | |
| creator_profile_id | ulid FK | |
| week_start | date | |
| total_views | bigint | |
| total_earned | decimal 10,2 | |
| entries_count | integer | |
| avg_engagement_rate | decimal 5,2 | |

---

## Campaign Flow Summary

```
CONTEST
campaigns → campaign_contest_details
  └── campaign_platforms (which platforms allowed)
  └── campaign_content_types (which content types allowed)
entries (status: pending_review — submitted privately, not posted)
  └── entry_platforms (tracks where creator intends to post)
  └── brand picks winner → winner_entry_id set on campaign_contest_details
      → entry status: won → all others: not_selected
      → winner posts publicly → entry status: live
      → payout_type: contest_prize released from escrow

RIPPLE
campaigns → campaign_ripple_details
  └── campaign_platforms
  └── campaign_content_types
entries (approved → creator posts immediately)
  └── entry_platforms (per-platform view tracking)
  └── entry_ripple_earnings row: type=initial_fee (fires on approval)
  └── SyncViewCountJob runs every 6h
      → milestone crossed → entry_ripple_earnings row: type=milestone
      → payout queued automatically
      → continues until deadline or budget exhausted
      → remaining budget refunded to brand via escrow_transactions

PITCH
campaigns → campaign_pitch_details
  └── campaign_platforms
  └── campaign_content_types
campaign_applications (creator applies first)
  └── brand approves application → creator can now submit entry
entries → entry_pitch_details (bid + pitch text)
  └── entry_platforms
  └── brand accepts bid → accepted_bid set on entry_pitch_details
      → creator posts → entry status: live
      → brand confirms post → payout_type: pitch_payment released
```

---

## Full Relationship Map

```
users
  ├── brand_profiles (1:1)
  │     ├── industry_id → industries
  │     ├── campaigns (1:many)
  │     │     ├── campaign_platforms → platforms (many:many)
  │     │     ├── campaign_content_types → content_types (many:many)
  │     │     ├── campaign_contest_details (1:1)
  │     │     ├── campaign_ripple_details (1:1)
  │     │     ├── campaign_pitch_details (1:1)
  │     │     ├── campaign_co_brands (1:many)
  │     │     ├── campaign_applications (1:many)
  │     │     ├── escrow_transactions (1:1)
  │     │     └── entries (1:many)
  │     └── agency_members (1:many)
  │
  ├── creator_profiles (1:1)
  │     ├── creator_niches → niches (many:many)
  │     ├── social_accounts (1:many)
  │     │     └── platform_id → platforms
  │     ├── entries (1:many)
  │     │     ├── content_type_id → content_types
  │     │     ├── entry_platforms → platforms (many:many)
  │     │     │     └── view_sync_logs (1:many)
  │     │     ├── entry_pitch_details (1:1)
  │     │     ├── entry_ripple_earnings (1:many)
  │     │     ├── entry_edit_requests (1:many)
  │     │     ├── payouts (1:many)
  │     │     └── message_threads (1:1)
  │     │           └── messages (1:many)
  │     └── creator_analytics (1:many)
  │
  └── referrals (1:many as referrer)
```
