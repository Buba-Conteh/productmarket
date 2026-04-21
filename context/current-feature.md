# Campaign Media Enhancements

**Status:** In Progress
**Branch:** feature/campaign-media
**Started:** 2026-04-21

---

## Features

| # | Feature | Status |
|---|---|---|
| CM-1 | Campaign thumbnail image upload | 🟢 Complete |
| CM-2 | Campaign resources upload (files for creators) | 🟢 Complete |
| CM-3 | Inspiration links — video thumbnail previews | 🟢 Complete |

---

## Overview

Three enhancements to the campaign creation/edit flow:

1. **Thumbnail** — Brands upload a cover image for the campaign. Displayed on campaign cards and the detail page.
2. **Resources** — Brands upload supporting files (brand guidelines, logos, product shots, scripts) that creators can download when making their content.
3. **Inspiration link thumbnails** — When a YouTube/Vimeo/TikTok URL is added as an inspiration link, a video thumbnail preview is shown inline.

---

## Implementation Plan

### CM-1 — Campaign Thumbnail
- Spatie Media Library `thumbnail` single-file collection on Campaign model
- File input in campaign creation wizard (Step 2 — Brief)
- Controller handles `addMediaFromRequest('thumbnail')->toMediaCollection('thumbnail')`
- TypeScript: `thumbnail_url: string | null` added to Campaign type
- Shown on campaign cards and detail page header

### CM-2 — Campaign Resources
- Spatie Media Library `resources` multi-file collection on Campaign model
- File input (multi-select) in campaign creation wizard (Step 2 — Brief)
- Campaign show page (creator view) renders a download list
- TypeScript: `resources: { id, file_name, size, mime_type, url }[]` on Campaign type

### CM-3 — Inspiration Link Thumbnails
- Pure client-side extraction — no backend required
- YouTube: extract video ID from URL, render `https://img.youtube.com/vi/{id}/hqdefault.jpg`
- Other URLs: show generic link icon with domain name
- Displayed in the inspiration links list inside the creation/edit wizard

---

## History

- 2026-04-21: Feature documented and fully implemented. Build passing.
