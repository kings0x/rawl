# Rawl — Changelog

All changes to `CONTEXT.md`, `API_SPEC.md`, and `SCHEMA.md` must be logged here.

## Format

```
## [YYYY-MM-DD] — <File changed>
**What changed:** <exact change>
**Why:** <exact reason>
**Consequence if not made:** <what would have broken or been wrong>
```

---

## [2026-05-20] — SCHEMA.md
**What changed:** Rewrote the schema reference from Prisma syntax into Drizzle-style `pgTable` and `pgEnum` definitions while preserving the same tables, enums, defaults, keys, and uniqueness rules.
**Why:** Phase 1 uses Drizzle ORM, so the previous Prisma-formatted schema conflicted with the documented backend stack and would not map cleanly to the implementation.
**Consequence if not made:** The schema source of truth would not match the ORM in use, making migrations and future database features error-prone from the first implementation phase.

## [2026-05-20] — API_SPEC.md
**What changed:** Clarified that only application routes live under `/api/v1` and added the top-level `GET /metrics` infrastructure endpoint alongside `GET /health`.
**Why:** Monitoring and load-balancer endpoints are part of the real backend surface and need to be documented accurately once implemented.
**Consequence if not made:** Future work would assume the wrong prefixing model and miss the metrics scrape endpoint needed for observability and staging verification.

## [2026-05-20] — CONTEXT.md
**What changed:** Removed the outdated SCHEMA ORM notice reference from the companion file list and moved GitHub Actions workflows to the repo-root `.github/workflows/` location in the documented folder structure.
**Why:** The ORM mismatch has now been resolved, and GitHub Actions only runs workflows from the repository root.
**Consequence if not made:** The project context would continue pointing to stale documentation and could cause CI/CD files to be created in a location GitHub never executes.
