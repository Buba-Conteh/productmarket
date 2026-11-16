# Product Shipping and Purchase Reimbursement

**Status:** Planned — specification only; application changes are not implemented.  
**Updated:** 2026-11-16  
**Branch:** `feature/product-shipping-and-reimbursement`  
**Source reviewed:** `main` at `5c50507a4f89adc146ed69003386876e6d0022aa`

## Goal

Allow brands to supply physical products to creators before content production, either by shipping the product directly or authorizing the creator to purchase it locally or online with their own funds and receive reimbursement.

The agreed model follows the product delivery and reimbursement experience described by JoinBrands, adapted to this application's existing campaign, entry, wallet, and Stripe Connect implementation.

**Brand approval of submitted content completes the product job. Publication or an entry becoming `live` is not required to release product reimbursement.** This is the final agreed completion rule and supersedes the earlier proposal to use `markLive()` as the trigger.

Product fulfillment is an optional capability for Contest, Ripple, and Pitch campaigns. It does not introduce a fourth campaign type.

## Current Implementation and Constraints

The source code, rather than older feature documentation, is the baseline for implementation:

| Area | Current behavior | Required integration |
|---|---|---|
| Product information | Pitch details store product name, description, URL, and images. | Preserve these fields and provide shared product information for opted-in campaigns. |
| Joining a campaign | Pitch requires an approved application. Contest and Ripple generally allow direct entry submission. | Introduce a product request/hiring step before spending or shipping. Existing Pitch application approval remains required. |
| Entries | Final submission requires a video; drafts can exist without one. | Product arrangements must exist before an entry and link to it later. |
| Ripple payments | Approval creates the initial-fee payout; later milestones have separate payouts. | Add reimbursement without duplicating the initial fee or changing milestone calculations. |
| Pitch payments | `markLive()` creates the service payout; `confirmPitchLive()` can also create it. | Prevent duplicate service payments and scope approval-based payment to new product-enabled jobs. |
| Contest payments | Winner selection creates prize payouts and marks other entries `not_selected`. | Accept product-job content independently of selecting a winner. |
| Wallet | Balances are derived from payout records; there is no separate spendable wallet ledger. | Credit reimbursement through a dedicated payout type and expose a separate breakdown. |
| Transfers | Payouts use Stripe Connect, currently with USD transfers. | Retain Stripe Connect and use USD for the initial release. |
| Campaign funding | Existing escrow covers campaign prizes/service payments. | Fund product reimbursements separately. |
| Discovery | Creator campaign details require an active campaign. | Product workspaces must remain accessible after closure/cancellation. |

Relevant source files:

- `app/Services/CampaignService.php`
- `app/Services/EntryService.php`
- `app/Services/PayoutService.php`
- `app/Services/CreatorWalletService.php`
- `app/Http/Controllers/Campaign/CampaignApplicationController.php`
- `app/Http/Controllers/Entry/CreatorEntryController.php`
- `app/Http/Controllers/Entry/BrandEntryController.php`
- `app/Models/Campaign.php`, `Entry.php`, `Payout.php`, and `EscrowTransaction.php`
- `resources/js/pages/campaigns/brand/create.tsx` and `edit.tsx`
- `resources/js/pages/campaigns/creator/show.tsx`
- `resources/js/pages/entries/brand/show.tsx` and `creator/show.tsx`
- `resources/js/types/campaign.ts` and `entry.ts`

## Agreed Product Rules

### Campaign configuration

Add an optional Product fulfillment section with these methods:

1. No product required — the default when no product policy exists.
2. Brand ships the product.
3. Creator purchases the product.
4. Creator may choose either shipping or purchase.

Brands configure product identity, URL, images, required variant/quantity, eligible locations, permitted online marketplaces or local-store instructions, and purchase/content deadlines. A local purchase must not require a courier tracking number.

Purchase settings include the product-price allowance, tax allowance, whether delivery costs are covered, maximum total reimbursement per creator, and funded creator capacity. Show these terms before the creator accepts or spends money.

Snapshot the selected method, product details, approved amounts, currency, deadlines, payment policy, and creator acceptance on each arrangement. Accepted commitments are immutable; campaign edits cannot silently reduce an existing creator's entitlement. Initially enable product policies on new/draft campaigns only.

### Approval and hiring before production

A creator requests product access and the brand approves the arrangement before a purchase or shipment. Invitation acceptance alone is not hiring or purchase authorization.

For Pitch, reuse the approved application as an eligibility prerequisite; the product arrangement records the actual fulfillment commitment. For Contest/Ripple with a product policy, introduce a product-specific request without changing the application requirements of campaigns without a policy.

At hiring, agree the creator's deliverables and any applicable service fee. For product-enabled Pitch jobs, snapshot the agreed fee before purchasing and carry it into the entry's accepted bid without asking the creator to renegotiate after spending.

Reserve a funded product slot/cap atomically before issuing purchase authorization. Also ensure any fixed service-payment commitment is covered by the existing service budget. Do not rely on `max_creators` alone: approved product requests can exist before entries are counted.

### Direct brand shipment

1. Brand approves the creator's product arrangement.
2. Creator supplies and confirms a private delivery address.
3. Brand ships the product and enters carrier/tracking details.
4. Creator confirms physical receipt; a brand can report shipment/tracking but cannot unilaterally claim receipt for the creator.
5. The agreed content-submission deadline starts from confirmed receipt.
6. Creator submits content through the entry flow.
7. Brand approves the content and completes the product job.

Brand shipping does not create a purchase reimbursement. The brand pays its own product/carrier costs. Support reporting a delayed, lost, damaged, or incorrect product, pausing/adjusting the deadline through a recorded resolution rather than silently completing the job.

### Creator purchase and reimbursement

1. Brand authorizes a funded purchase with a disclosed maximum reimbursement.
2. Creator purchases the specified product locally or online using their own funds.
3. Creator submits marketplace/store, order ID where applicable, itemized receipt, purchase date, product subtotal, tax, delivery cost, and currency. For online orders, record available tracking information separately.
4. Brand reviews the expense and approves an eligible amount or requests corrections with a reason.
5. Creator confirms physical delivery/collection; this starts the content-submission deadline.
6. Creator submits content.
7. Brand approves the content, completing the service.
8. Once both expense approval and content approval exist, credit the approved reimbursement exactly once through the payout system.

Expense review and content approval may occur in either order. The last missing approval triggers the eligibility check. Expense approval alone, order placement, parcel receipt, entry submission, or TikTok publication must not release reimbursement.

### Reimbursement calculation and tax

Reimburse the approved actual eligible product cost plus actual sales tax and any explicitly covered delivery costs, up to the accepted cap. Show any creator-paid excess before purchase authorization. Request approval for a higher cap before spending beyond it.

Use configurable tax allowances to reserve sufficient funding. JoinBrands' published percentage allowances are examples of its policy, not universal actual tax rates to hardcode into this application. An order ID or tracking number alone is insufficient proof of the amount or tax paid.

Use decimal strings/BCMath or integer minor units for new money calculations. For the first release, require USD authorization and USD claims; do not silently interpret another currency as USD. Currency conversion is outside this release.

**Product reimbursement has zero platform commission.** Existing commission still applies to applicable content/service payments. Receipt adjustments and approval amounts must be recorded with reviewer and timestamps.

## Completion and Payment Behavior

Create a product-specific content acceptance record with `content_approved_at`, approver, and the reviewed submission/version. This is separate from shipping, expense review, and `entries.status`.

| Campaign | Existing campaigns without a product policy | New product-enabled jobs |
|---|---|---|
| Pitch | Keep current service payout timing. | Brand content approval completes the job and makes the agreed service fee payable. Approved reimbursement is payable at the same point, or later if expense approval is outstanding. |
| Ripple | Keep initial-fee approval and milestone rules. | Use content approval for the existing initial fee and product-job acceptance; add eligible reimbursement separately. Keep view-milestone payments unchanged. |
| Contest | Keep winner/runner-up selection and prize timing. | Provide an independent Accept content action for authorized product participants. Approved work qualifies for reimbursement regardless of winning; prize selection/payment remains separate. |

For new product-enabled Pitch jobs, this is an explicit, snapshotted approval-based payment policy. `markLive()` and `confirmPitchLive()` must not create another service payment after approval. Publication may still be a campaign requirement with its own tracking, but it is not a second payment trigger for this policy.

For Contest, do not automatically accept all submitted entries or pay a service fee to every contestant. Reimburse only hired/authorized participants whose agreed content is accepted and expense approved. A prize is not the same as an agreed content fee.

Show content earnings and product reimbursement as separate wallet/history items, even if credited together. They can use separate payout rows and transfers. Retain existing payout-account holds, minimum-payment rules, retries, and Stripe Connect; do not introduce PayPal or promise immediate bank receipt.

Credit through payout records, not by directly changing `creator_profiles` balances. Add reimbursement and service-earnings breakdowns; exclude expense reimbursement from performance earnings, engagement rankings, and milestone/budget calculations that represent content compensation. Preserve existing response keys for compatibility.

## Funding, Cancellation, and Duplicate Prevention

- Keep product funding separate from ordinary campaign escrow so purchases do not reduce promised service fees or prizes.
- Charge/confirm product funding before purchase authorization. Test/stub funding must remain clearly separated from real payment confirmation.
- Reserve the authorized cap until the claim is resolved. A pending/processing payment, missing payout account, or failed-but-still-owed transfer retains its outstanding liability.
- On approved lower actual cost, release only the unused allowance; keep the approved amount reserved until transfer succeeds.
- Bind each reimbursement payout to its funding source. New reimbursements debit product funding; old payout types retain ordinary escrow routing.
- Use a unique claim-to-payout link, row locks, and stable payment-provider idempotency keys. Queue transfers after the database transaction commits. Reconcile ambiguous provider responses before retrying.
- Content edits, repeated approvals, repeated delivery confirmation, worker retries, and multiple entry/publication endpoints must not create duplicate reimbursements or service payments.
- Cancellation stops new commitments and authorizations. It must not automatically erase approved purchases, accepted work, pending payouts, or audit records.
- If cancellation occurs after authorized spending, retain the relevant reserve and resolve reimbursement/return obligations explicitly. Do not silently deny reimbursement because a job can no longer be completed.
- Refund only uncommitted funds, accounting for prior refunds and released amounts. Record a refund as successful only after provider confirmation.
- A republished campaign must not detach old obligations or spend a different funding record by accident.

The existing cancellation calculation uses ordinary escrow held minus released, and does not model product reservations. Do not copy that calculation into product refunds. The existing duplicate Pitch payment paths must not be reused without a payout uniqueness guard.

## Proposed Additive Data Model

Names below are implementation proposals; use ULIDs and preserve existing tables/data.

| Table/change | Main responsibilities |
|---|---|
| `campaign_product_policies` | Optional unique campaign policy; allowed methods, product information, locations/channels, cap/currency, cost coverage, deadlines, and payment-policy version. |
| `product_fulfillments` | Unique campaign/creator arrangement; nullable unique entry link; chosen method; accepted terms/product/service-fee snapshot; approvals; physical receipt and content deadline; content acceptance/version. |
| Private shipment/address records | Restricted encrypted address and contact details, carrier/tracking, shipment/receipt/problem history. |
| `product_purchase_claims` | Claim and receipt references, actual cost breakdown, currency, review/correction history, approved amount, and nullable unique payout link. |
| `product_fundings` | Confirmed brand funding, source payment, outstanding reservations, released/refunded amounts, currency, and operation keys; support separate top-ups. |
| `payouts` additions | New `product_reimbursement` enum value through a new migration; nullable product funding link. Keep old type values and null behavior unchanged. |

Provide one arrangement and one settled purchase reimbursement per campaign/creator in the initial release. Claim corrections reuse the same obligation rather than generating another payable reimbursement.

Keep fulfillment, expense review, content acceptance, and payment states independent. Suggested transitions:

- Arrangement: requested → approved/awaiting creator acceptance → active; or rejected/cancelled.
- Brand shipment: address required → ready to ship → shipped → received; problems are tracked separately.
- Purchase: authorized → purchased/awaiting delivery → received; purchase/receipt timestamps do not imply delivery.
- Expense: not submitted → submitted → approved; or corrections requested/rejected.
- Service: awaiting product → creating content → submitted → changes requested/resubmitted → approved.
- Reimbursement: not eligible → eligible/credited → existing pending/processing/paid/failed payout states.

Persist `received_at` and derive the submission deadline once. Replayed confirmations or tracking updates cannot reset it. Any extension requires a recorded reason. Approved purchase liabilities must not expire merely because a timer runs out.

## UI, Access, and Notifications

- Extract shared product settings/components for brand create/edit rather than duplicating the large existing forms.
- Show method, purchase cap/currency, cost coverage, eligibility, deadlines, payment timing, and request CTA on campaign discovery/details.
- Provide a brand fulfillment workspace for hiring, shipment/tracking, receipt review, and content acceptance.
- Provide a creator workspace for terms acceptance, private address, purchase authorization, order/receipt upload, delivery confirmation, deadline, and reimbursement progress.
- Link the arrangement from entry pages. Show expense approval separately from content approval and publication status.
- Keep owner-scoped workspaces accessible after campaign closure/cancellation, including outstanding purchases and payments.
- Notify relevant users about request approval, purchase authorization, shipping, receipt/corrections, confirmed delivery/deadline, content changes/approval, and reimbursement status using existing notification patterns.
- Store receipts in private storage and authorize every access; use expiring access where needed. Do not reuse public video/asset URLs for receipts.
- Restrict addresses, order IDs, receipts, and tracking to the assigned brand/creator and authorized admins. Avoid exposing them through public profiles, campaign serialization, logs, or broadcast payloads.

## Backward Compatibility and Rollout

1. No product policy means the current campaign, application, entry, and payout flow.
2. Existing Pitch product metadata does not automatically enable fulfillment or reimbursement. Keep legacy fields readable and define an explicit display fallback.
3. Add new tables, nullable links, and optional response properties. Do not rewrite old migrations, rename campaign types, or overload existing entry statuses.
4. Snapshot the new completion/payment policy only for newly accepted product jobs. Do not backfill old campaigns into it or move existing payment triggers globally.
5. Route only `product_reimbursement` to the new funding/fee rules. Historical payout records remain valid.
6. Keep current application/subscription/entry-limit enforcement. Count product authorizations separately to avoid overcommitting creator slots or budgets.
7. Allow new product requests only while the campaign accepts work; existing hired creators retain access for fulfillment and agreed completion. Explicitly handle work still outstanding when a campaign closes or a Contest winner is selected.
8. Introduce behind a disabled-by-default feature flag and pilot with selected brands before general rollout.

Existing entry guards require specific handling for hired product jobs: `validateCanSubmit()` blocks a first entry after campaign closure, and winner selection marks Contest non-winners `not_selected`. Add narrow, authorized product-job paths for completing prior commitments and accepting those submissions. Do not relax submission/approval guards globally or reopen cancelled jobs without resolving their commitments.

Initial scope excludes automatic carrier tracking, marketplace purchasing APIs, automated receipt OCR, foreign-currency conversion, a new withdrawal wallet, and a new payout provider. Manual data entry and review support the requested workflow.

## Implementation Sequence and Progress

- [x] Review current campaign, entry, payout, and wallet source.
- [x] Agree brand content approval as the product-job completion trigger.
- [x] Document this specification.
- [ ] Add migrations, models, scoped policies, and immutable agreement snapshots.
- [ ] Add campaign settings and pre-entry request/hiring/acceptance flow.
- [ ] Implement confirmed funding and reservations before enabling purchase authorization.
- [ ] Add private addresses, manual tracking, delivery confirmation, and content deadlines.
- [ ] Add local/online receipt submission and expense review.
- [ ] Add product-specific content acceptance and idempotent reimbursement release.
- [ ] Apply approval-based service payment to new product-enabled Pitch jobs, preserving legacy behavior.
- [ ] Add wallet breakdowns, notifications, cancellation/resolution, and admin visibility.
- [ ] Run regression/financial tests, lint/type/build checks, and browser verification.
- [ ] Pilot behind the feature flag and update this file with implementation status.

When implementation starts, record it in `context/current-feature.md` without losing the existing feature/history. This documentation-only task does not mark the application feature complete.

## Acceptance and Regression Checks

- Existing campaigns without a product policy can still create/edit/publish, accept entries, select winners, approve Ripple/Pitch entries, and pay with the same rules and amounts.
- Existing Pitch fields, approved applications, invitation behavior, and older serialized responses remain usable.
- A product request can be approved before a video/entry exists and links to the correct entry later.
- A creator hired before campaign closure can submit their first product-job entry afterward; ordinary unapproved creators still cannot join closed campaigns. Authorized Contest submissions remain reviewable for product acceptance after becoming `not_selected`.
- A creator cannot buy under an unfunded, rejected, unaccepted, or unauthorized arrangement.
- Concurrent approvals cannot allocate the same last funded slot or exceed available funds.
- Terms, price/tax coverage, service fee, currency, and deadlines are clear before acceptance and cannot be reduced retroactively.
- Brand shipment requests only the assigned creator's address; local purchase works without order tracking.
- Content deadline starts at confirmed receipt/collection, is stable on repeat confirmation, and supports recorded problem resolution/extensions.
- Claims validate item/variant/quantity, actual cost/tax, cap, and currency; unsupported currency is not interpreted as USD.
- Expense approval before content approval does not pay early; content approval before expense approval pays reimbursement only when expense approval follows.
- Live/publication status without brand content approval does not qualify a product job for reimbursement.
- Brand-approved content can qualify without publication. An authorized Contest non-winner can be reimbursed without triggering a prize or changing winner selection.
- New product-enabled Pitch service payment and reimbursement cannot be duplicated by later `markLive()`, `confirmPitchLive()`, reapproval, or worker retry.
- Reimbursement has no platform commission; service fees keep their applicable commission; view milestones and service budgets exclude purchase costs.
- Wallet summaries/history show accurate separate categories and distinguish credit from completed external transfer.
- Holds, failures, retries, and a crash after provider success preserve exact-once payment and reserved obligations.
- Cancellation/refunds preserve authorized purchases and accepted work, including outstanding obligations after closure/republishing.
- Creator/brand cross-account and cross-campaign access to addresses, receipts, approvals, and payments is rejected.
- Production build, TypeScript, relevant PHP/JS lint checks, meaningful feature tests, and both browser workflows pass before implementation is marked complete.

## References

- [JoinBrands — Delivery Method: Reimbursement](https://help.joinbrands.com/en/articles/6638138-delivery-method-reimbursement)
- [JoinBrands — Creators: When will I get paid?](https://help.joinbrands.com/en/articles/6266935-creators-when-will-i-get-paid)

These references inform the experience. The application's explicit agreement above governs timing, currency, funding, and payout behavior; do not import external platform rules or tax percentages automatically.
