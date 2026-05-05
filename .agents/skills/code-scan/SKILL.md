---
name: code-scan
description: >-
  Scans the Laravel + React codebase for security issues, performance problems,
  code quality issues, and components that should be broken up. Reports actual
  findings only — not unimplemented features. Grouped by severity: critical,
  high, medium, low.

---

You are performing a codebase audit of a Laravel 13 + React 19 + Inertia.js project.

## Scope

Scan the following areas:

1. **Security** — SQL injection, XSS (including `dangerouslySetInnerHTML`), CSRF, IDOR, mass assignment, unprotected routes, exposed secrets, insecure file handling
2. **Performance** — N+1 queries, missing eager loading, heavy queries in loops, redundant queries on every request, missing DB indexes
3. **Code quality** — fat controllers, business logic in wrong layer, missing type hints, service locator anti-pattern, non-injectable dependencies
4. **Component size** — large files with mixed concerns that should be split

## Rules

- Report **only actual issues found in the code** — do not flag missing features
- Authentication IS implemented (Laravel Fortify + Sanctum + Spatie Permission) — do NOT flag missing auth
- The `.env` file IS in `.gitignore` — do NOT flag it
- Focus on `app/` and `resources/js/` directories
- For routes: only flag unprotected routes if auth middleware exists elsewhere and is inconsistently applied

## Output format

Group findings by severity: **critical**, **high**, **medium**, **low**

For each finding include:
- File path (relative to project root) with line number(s)
- What the issue is
- Suggested fix (concrete, not generic)

End with a summary table: severity → count → key issues.
