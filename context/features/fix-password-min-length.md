# Fix — Password minimum length to 8

**Status:** 🟡 Implemented — awaiting staging verification
**Branch:** `fix/password-min-length`

## Overview

The minimum password length was 10 characters (12 under the production
defaults). It is now **8 characters**
everywhere. Complexity rules are unchanged: letters, mixed case, numbers and a
symbol are still required (and `uncompromised()` still applies to the
production defaults).

## Changes

| File | Change |
|---|---|
| `app/Concerns/PasswordValidationRules.php` | `Password::min(10)` → `Password::min(8)` — used by registration, password reset, and password update |
| `app/Providers/AppServiceProvider.php` | Production `Password::defaults()` `min(12)` → `min(8)` |

No frontend changes — the UI never displayed a length hint. No migration; existing
passwords are unaffected.

## Verification

- [x] `Abcde1!x` (8 chars) passes, `Abc1!xy` (7 chars) fails
- [x] Pint clean
- [x] Auth/Settings tests: same 12 failures before and after this change (failures pre-date it)
- [ ] Register on staging with an 8-character password
