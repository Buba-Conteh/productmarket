# Searchable Country Dropdown

**Status:** 🟢 Implemented, awaiting staging test
**Branch:** `feature/country-select`

## Overview

Country was a free-text box where users had to type a 2-letter code (`US`, `NG`). It is now a searchable dropdown listing all 249 ISO 3166-1 countries. You can search by name or code ("nigeria" or "ng"), and optional fields can be cleared.

Used in:
- Creator onboarding, profile step (`pages/onboarding/creator/profile.tsx`)
- Brand-side creator directory filter (`pages/brand/creators/index.tsx`)

## Implementation

- `components/shared/country-select.tsx` — reusable `CountrySelect` (value = ISO alpha-2 code, `onChange(code)`).
- `lib/countries.ts` — ISO code list; names come from the browser/Node `Intl.DisplayNames`, so there is no large data file. `countryName(code)` returns a display name for a stored code.
- `components/ui/popover.tsx`, `components/ui/command.tsx` — shadcn-style primitives.
- New packages: `cmdk`, `@radix-ui/react-popover` (additions only).

## Backward compatibility

- No backend, database or migration changes. The stored value is still the 2-letter code, and the `country` filter and `size:2` validation work as before.
- Existing saved codes show as country names. An unknown legacy value is shown as-is.
- The `target_regions` campaign field has no UI yet and is untouched.
