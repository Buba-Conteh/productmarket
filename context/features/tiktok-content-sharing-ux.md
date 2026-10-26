# TikTok Content Sharing — Required UX Implementation

**Status:** 🟡 Implemented — awaiting browser verification and TikTok re-review
**Branch:** `feature/tiktok-content-sharing-ux`
**Date:** 2026-10-26
**Extends:** Direct posting to TikTok (`PublishToTikTokJob`, `TikTokPublishController`)

## Overview

The "Post to TikTok" card on the creator entry page (`/entries/{entry}`) now
follows the Required UX Implementation in TikTok's Content Sharing Guidelines,
which TikTok checks during Content Posting API app audit.

> **Caveat:** the requirements below were applied from knowledge of the
> guidelines, not re-read from the live page during implementation. Compare this
> list against
> https://developers.tiktok.com/docs/en/content-sharing-guidelines before
> submitting for audit.

| Requirement | Implementation |
|---|---|
| Query creator info before showing the post UI | `GET /entries/{entry}/publish/tiktok/creator-info` → `TikTokPostingService::queryCreatorInfo()`. The form is driven by the result. |
| Show which TikTok account is being posted to | Avatar, nickname and `@username` at the top of the form |
| Respect max video duration | Warning shown and Post disabled when `video_duration_sec` exceeds `max_video_post_duration_sec`; also enforced server-side |
| Title is editable | Textarea, max 2200, pre-filled with the creator's own entry caption |
| Privacy: no default, options from the API | Dropdown starts empty ("Select who can view this video"); only `privacy_level_options` are listed; Post stays disabled until chosen; server requires it and validates against the creator's options |
| Comment / Duet / Stitch are opt-in | Three unchecked checkboxes; greyed out when disabled in the creator's TikTok settings (server also forces them off) |
| Commercial content disclosure | "Disclose video content" switch (off by default) → "Your brand" / "Branded content". At least one is required once on. Shows the `Promotional content` / `Paid partnership` label. Sent as `brand_organic_toggle` / `brand_content_toggle` |
| Branded content cannot be private | "Only me" option disabled when Branded content is selected (with explanation); server rejects `SELF_ONLY` + branded |
| Compliance declaration | "By posting, you agree to TikTok's Music Usage Confirmation" — or "Branded Content Policy and Music Usage Confirmation" when branded content is selected. Server requires `music_consent` |
| Preview the video before posting | Video player inside the form |
| Tell users processing can take time | Pending/processing copy now says it may take a few minutes |
| No posting without explicit action | Unchanged — nothing posts until the creator clicks Post to TikTok |

## Backend

- `TikTokPostingService::queryCreatorInfo()` — calls
  `/v2/post/publish/creator_info/query/`; stub mode returns realistic data;
  maps `spam_risk_too_many_posts` / `reached_active_user_cap` to a "posting
  limit reached" message.
- `initializeUpload()` — `privacy_level` no longer defaults to public;
  `disable_*` default to `true`; sends `brand_content_toggle` and
  `brand_organic_toggle`.
- `TikTokPublishController` — new `creatorInfo()`; shared preconditions
  extracted to `resolvePostingContext()`; `store()` now validates
  `privacy_level` (required, in creator options), `music_consent` (accepted),
  branded + private, and max duration.
- Route `entries.creator.tiktok-creator-info`.

## Frontend

Extracted from `pages/entries/creator/show.tsx` into components/hooks:

- `components/entries/tiktok/tiktok-posting-card.tsx` — state machine
  (re-connect / form / processing / published / failed)
- `components/entries/tiktok/tiktok-post-form.tsx` — the form
- `components/entries/tiktok/tiktok-commercial-disclosure.tsx`
- `components/entries/tiktok/tiktok-icon.tsx`
- `components/ui/switch.tsx` — small accessible switch (no new dependency)
- `hooks/use-tiktok-creator-info.ts`, `hooks/use-tiktok-publish.ts`
- Types `TikTokCreatorInfo`, `TikTokPostPayload`, `TikTokPrivacyLevel` in `types/entry.ts`

## Compatibility notes

- No migrations. Existing publish state (`publish_status`, `tiktok_publish_id`)
  is untouched, so in-flight and published entries are unaffected.
- The `store` request shape is a superset of the old one, but it now **requires**
  `privacy_level` and `music_consent`. The only client is the bundled page.

## Tests

`tests/Feature/Entry/TikTokPublishUxTest.php` — creator-info response and
ownership, required privacy level, creator-offered options only, music consent,
branded + private, over-length video, and a fully valid post.

## Verification still needed

- [ ] Real TikTok sandbox account: confirm `creator_info/query` response and that
      `brand_content_toggle` / `brand_organic_toggle` are accepted.
- [ ] Browser walk-through in light and dark mode.
- [ ] Re-record the audit demo video showing the new form.
- [ ] Unaudited TikTok clients can only post `SELF_ONLY`; privacy options come
      from the API, so the dropdown will reflect that until the app is audited.
