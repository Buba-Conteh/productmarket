# Current Feature — Direct-to-bucket entry video upload

**Status:** 🟢 Complete — see context/features/4.13-direct-video-upload.md
**Branch:** `feature/direct-video-upload`

## Symptom

Creators submitting an entry with a video hit a fatal error in production:

```
Symfony\Component\ErrorHandler\Error\FatalError:
Allowed memory size of 268435456 bytes exhausted (tried to allocate 132120608 bytes)
at vendor/symfony/http-foundation/Request.php:1589
```

## Root cause

`StoreEntryRequest` allowed videos up to 200 MB (`max:204800`). A multipart POST is buffered by PHP
before Laravel sees it, so a large video exhausted `memory_limit` during request parsing — the crash
happens in `Request.php`, before any application code runs. The rule was also unreachable in the
first place: `upload_max_filesize` is 25 MB locally and `post_max_size` 100 MB in the container.

## Fix

Videos now upload straight from the browser to the storage bucket via a presigned `PUT`, so the
bytes never pass through PHP. The cap becomes a real 500 MB. Hosts with no bucket attached (local
dev on the `local` disk) fall back to a multipart POST capped at 20 MB, which is what PHP can
actually handle.

The client-supplied bucket path is verified with an HMAC bound to the creator, and the object's
existence and size are re-checked server-side before it is attached to the entry.

## Follow-up

⚠️ The Laravel Cloud bucket needs CORS (`PUT` + `Content-Type` from the app origin) before the
direct path works in production. The browser → bucket leg could not be verified locally because
local dev has no bucket.
