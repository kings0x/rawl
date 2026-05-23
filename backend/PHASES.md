# Rawl — Build Phases

## How This File Works

This file defines the complete sequence for building Rawl from zero to production. Every phase, every feature, every test, every deployment step is defined here. Read this file in full before writing a single line of code.

---

## Agent Rules

- Read `CONTEXT.md`, `API_SPEC.md`, and `SCHEMA.md` before starting any phase
- The current phase is always the lowest-numbered phase whose PR has not been merged to `main`
- Never work on two phases simultaneously
- Never skip a feature to come back to it later
- Never skip a test type that applies to a feature
- If a completion criterion is not met, stop and fix it — do not move on
- If CI fails on a PR, fix it before doing anything else
- If live verification fails on staging, fix it before triggering a production release
- Log any change made to `CONTEXT.md`, `API_SPEC.md`, or `SCHEMA.md` in `CHANGELOG.md`

---

## Test Types

Five test types exist. Each feature section states exactly which ones apply and what they must cover.

**Unit** — tests a single function or module in complete isolation. No database, no network, no Redis. Always applies to every feature.

**Integration** — tests two or more real components working together (e.g. route handler + service + database). Applies from Feature 2 of Phase 1 onwards — any feature where more than one real component is involved.

**E2E** — tests a complete user-facing flow from HTTP request to final database or side-effect state. Applies from Phase 2 onwards — once there are meaningful multi-step flows to verify.

**Regression** — re-runs the full existing test suite to confirm the new feature has not broken anything that previously passed. Always applies to every feature.

**Live Verification** — the agent sends real HTTP requests to the deployed staging environment and asserts on the actual responses received. This is not a test runner — it is the agent manually verifying behaviour on the live system. Always applies after every staging deployment.

---

## Branching Rules

- Branch naming: `feature/phase-N-feature-name`
  - Example: `feature/phase-1-user-registration`
- One branch per feature
- Never commit directly to `main`
- After all features in a phase are complete and all tests pass locally, open a single phase PR to `main`
  - Example PR title: `Phase 1 — Authentication Foundation`
- The phase PR triggers `ci.yml` automatically

---

## CI/CD Flow

```
Developer pushes feature branch
        │
        ▼
Open PR to main
        │
        ▼
ci.yml triggers automatically
  lint → typecheck → unit tests → integration tests → e2e tests → build
        │
        ├── FAIL → fix and push again, CI re-runs
        │
        └── PASS → PR is ready to merge
                │
                ▼
        Merge PR to main
                │
                ▼
        deploy-staging.yml triggers automatically
          Deploys to staging environment
                │
                ▼
        Agent runs Live Verification on staging
                │
                ├── FAIL → fix, open new PR, repeat from top
                │
                └── PASS → agent triggers manual approval gate
                                │
                                ▼
                        release.yml triggers
                          Deploys to production
```

---

## Workflow Files Required

Three GitHub Actions workflow files must exist before any feature is merged:

**`.github/workflows/ci.yml`**
Triggers on: pull request to `main`
Steps: lint, typecheck, unit tests, integration tests, e2e tests, build

**`.github/workflows/deploy-staging.yml`**
Triggers on: push to `main`
Steps: build Docker image, push to registry, deploy to Render staging, run smoke test against `/health`

**`.github/workflows/release.yml`**
Triggers on: manual dispatch (workflow_dispatch)
Steps: build Docker image, push to registry, deploy to Render production
Requires: manual approval via GitHub environment protection rules

These three files must be created in Phase 1, Feature 1. No feature branch is opened until they exist.

---

## Phase Index

| Phase | Name | 
|---|---|
| 1 | Infrastructure & Authentication Foundation |
| 2 | Pain Submission |
| 3 | Engagement — Me Too & Comments |
| 4 | Notifications |
| 5 | Subscriptions & Resolution System |
| 6 | Discovery Layer |
| 7 | Premium & Billing |
| 8 | Messaging |
| 9 | AI Layer |
| 10 | Production Hardening |

---

---

# Phase 1 — Infrastructure & Authentication Foundation

## Goal

Stand up the full project scaffold, wire all CI/CD pipelines, connect all infrastructure, and build a secure authentication system that the rest of the platform builds on.

The system should support:
- project scaffold with all tooling configured
- CI/CD fully wired to GitHub Actions
- Docker + docker-compose for local development
- Monitoring infrastructure connected (Prometheus, Loki, Grafana)
- user registration with Argon2id password hashing
- login with JWT access tokens and refresh tokens stored in Redis
- token refresh
- logout with session invalidation
- Google OAuth registration and login
- session-aware authentication middleware

Future-ready for:
- RBAC
- multi-tenant auth
- MFA

---

## Feature 1 — Project Scaffold & Infrastructure Wiring

### Scope

Stand up the full backend project before writing any business logic. Nothing else can be built until this is done and merged.

### Tasks

- Initialise Node.js + Fastify + TypeScript project
- Configure ESLint, Prettier, and tsconfig
- Set up Drizzle ORM and connect to PostgreSQL
- Set up Redis client and connection
- Set up BullMQ with Redis connection
- Set up Vitest as the test runner with global setup and teardown
- Create `src/app.ts` (Fastify instance) and `src/server.ts` (entry point)
- Create `src/shared/config/env.ts` — validate all environment variables on startup, crash if any are missing
- Create `GET /health` endpoint — returns `{ status: "ok", timestamp }` — no auth required
- Create `.env.example` with all required variables from CONTEXT.md
- Write all three GitHub Actions workflow files: `ci.yml`, `deploy-staging.yml`, `release.yml`
- Write `Dockerfile` and `docker-compose.yml` for local development (includes Postgres, Redis)
- Set up Prometheus metrics endpoint (`/metrics`) using `prom-client`
- Set up Loki log transport using `pino` logger
- Add Grafana dashboard config files (request rate, error rate, latency p50/p95/p99, DB query time, Redis hit rate)
- Set up `nginx/nginx.conf` — SSL termination, gzip, rate limiting stubs (limits filled in per-route in later phases)
- Resolve the ORM mismatch noted in `SCHEMA.md` — rewrite schema in Drizzle syntax, update `SCHEMA.md`, log in `CHANGELOG.md`
- Run initial Drizzle migration to create an empty database

### Decisions

- Drizzle ORM over Prisma — folder structure already reflects this, schema must match
- Pino for logging — ships to Loki via transport
- Vitest for testing — fast, TypeScript-native
- prom-client for Prometheus metrics

### Constraints

- App must not start if any required environment variable is missing
- `/health` must return 200 with no authentication required
- Docker compose must bring up a working local environment with a single command
- All three CI/CD workflow files must be syntactically valid and pass a dry-run check

### Validation

#### Unit
- env validation crashes on missing variables
- env validation passes with all variables present
- `/health` returns correct shape

#### Regression
- not applicable — this is the first feature

#### Live Verification
- `docker compose up` starts without errors
- `GET /health` returns `200 { status: "ok" }`
- Prometheus `/metrics` endpoint returns metric output
- GitHub Actions `ci.yml` workflow runs successfully on a test PR

### Completion Criteria

Complete only if:
- project runs locally with `docker compose up`
- `/health` returns 200
- all three workflow files are valid and committed
- Drizzle schema is in valid Drizzle syntax
- initial migration runs cleanly against a fresh database
- `SCHEMA.md` updated to reflect Drizzle syntax
- `CHANGELOG.md` entry written for ORM resolution

### Non-Goals

This feature does NOT include:
- any auth logic
- any business routes
- Nginx production configuration (stubs only)

---

## Feature 2 — User Registration

### Scope

Allow users to create accounts securely.

### Branch
`feature/phase-1-user-registration`

### Tasks

- Create Drizzle schema for `users` table and `sessions` table
- Run migration
- Create `src/modules/users/users.schema.ts` — Zod validation schema for registration payload
- Create `src/modules/auth/auth.service.ts` — `hashPassword`, `verifyPassword` using Argon2id
- Create `src/modules/auth/auth.routes.ts` — `POST /auth/register`
- Return safe user object (never return `passwordHash`)
- Add duplicate email detection — return 409 with clear error message
- Add rate limiting on `POST /auth/register` via Nginx config (update `nginx.conf`)

### Decisions

- Argon2id for password hashing
- UUIDs for all primary keys
- Zod for request validation — errors returned as structured JSON

### Constraints

- `passwordHash` must never appear in any API response
- Email must be unique — enforced at both DB and application layer
- Registration endpoint must be rate-limited
- Validation logic must live in reusable Zod schemas, not inline in route handlers

### Validation

#### Unit
- `hashPassword` returns a hash that does not equal the input
- `verifyPassword` returns true for correct password, false for wrong
- Zod schema rejects missing email
- Zod schema rejects invalid email format
- Zod schema rejects password under minimum length

#### Integration
- `POST /auth/register` with valid payload inserts a user row in the database
- `POST /auth/register` with duplicate email returns 409
- `POST /auth/register` with invalid payload returns 422 with field errors

#### Regression
- `/health` still returns 200
- all Feature 1 tests still pass

#### Live Verification
- `POST /auth/register` with valid body → 201, user object returned, no `passwordHash` field
- `POST /auth/register` again with same email → 409
- `POST /auth/register` with missing fields → 422

### Completion Criteria

Complete only if:
- registration works end to end
- `passwordHash` is confirmed absent from all response shapes
- duplicate email detection works
- validation errors return structured JSON
- all tests pass
- CI passes
- live verification passes on staging

### Non-Goals

- OAuth registration
- email verification
- MFA
- profile management

---

## Feature 3 — Login & Session Management

### Scope

Allow registered users to authenticate and receive tokens.

### Branch
`feature/phase-1-login`

### Tasks

- Create `POST /auth/login` route
- Verify password hash against stored hash using `verifyPassword`
- Generate JWT access token (short-lived, signed with `JWT_ACCESS_SECRET`)
- Generate JWT refresh token (long-lived, signed with `JWT_REFRESH_SECRET`)
- Store refresh token in Redis with TTL matching `JWT_REFRESH_EXPIRES_IN`
- Insert a `sessions` row in the database linking the user to the refresh token
- Return access token in response body, refresh token as an `httpOnly` cookie

### Decisions

- Access token in response body — consumed by frontend
- Refresh token as `httpOnly` cookie — not accessible to JavaScript
- Redis stores refresh token → userId mapping for fast lookup
- Sessions table stores a record for auditability

### Constraints

- Access tokens must expire (15 minutes)
- Refresh tokens must be revocable (deleting from Redis invalidates them)
- Sessions must survive server restart (Redis persistence must be enabled in docker-compose)
- Never log tokens anywhere

### Validation

#### Unit
- `generateAccessToken` returns a verifiable JWT
- `generateRefreshToken` returns a verifiable JWT
- expired token fails verification
- token signed with wrong secret fails verification

#### Integration
- `POST /auth/login` with correct credentials → 200, access token in body, refresh token cookie set
- `POST /auth/login` with wrong password → 401
- `POST /auth/login` with unknown email → 401 (same message as wrong password — no user enumeration)
- Redis contains refresh token entry after login

#### Regression
- registration flow still works
- `/health` still returns 200

#### Live Verification
- `POST /auth/login` → 200, access token in response, `Set-Cookie` header present with `httpOnly`
- Inspect Redis on staging — refresh token entry present
- Inspect `sessions` table — row inserted

### Completion Criteria

Complete only if:
- login returns access and refresh tokens
- tokens are signed and verified correctly
- Redis session is created
- wrong credentials return 401 with no user enumeration
- all tests pass
- CI passes
- live verification passes on staging

### Non-Goals

- social login
- RBAC
- multi-device session management

---

## Feature 4 — Token Refresh, Logout & Auth Middleware

### Scope

Complete the auth lifecycle: refresh, logout, and protect all authenticated routes.

### Branch
`feature/phase-1-auth-middleware`

### Tasks

- Create `POST /auth/refresh` — reads refresh token from cookie, verifies against Redis, issues new access token, rotates refresh token (delete old, store new)
- Create `POST /auth/logout` — deletes refresh token from Redis, deletes session row, clears cookie
- Create `GET /auth/me` — returns current user object from access token claim
- Create `src/shared/middleware/authenticate.ts` — Fastify preHandler that verifies access token and attaches `request.user`
- Apply `authenticate` middleware to all `[auth]` routes defined in `API_SPEC.md`

### Decisions

- Refresh token rotation on every `/auth/refresh` call — old token is immediately invalidated
- Logout invalidates both Redis entry and cookie
- Middleware attaches `{ id, email, isPremium, premiumTier }` to `request.user`

### Constraints

- A used refresh token must not be reusable
- Logout must clear the cookie and Redis entry atomically (use Redis transaction)
- `authenticate` middleware must return 401 for missing, expired, or malformed tokens — never 500

### Validation

#### Unit
- `authenticate` middleware returns 401 for missing token
- `authenticate` middleware returns 401 for expired token
- `authenticate` middleware returns 401 for malformed token
- `authenticate` middleware attaches correct user object for valid token

#### Integration
- `POST /auth/refresh` with valid cookie → 200, new access token, rotated refresh cookie
- `POST /auth/refresh` with already-used refresh token → 401
- `POST /auth/logout` → 200, Redis entry deleted, cookie cleared
- `GET /auth/me` with valid token → 200, user object
- `GET /auth/me` with no token → 401

#### Regression
- login flow still works
- registration flow still works

#### Live Verification
- Full auth lifecycle on staging: register → login → refresh → logout → attempt refresh (expect 401)
- `GET /auth/me` with valid token returns correct user

### Completion Criteria

Complete only if:
- refresh rotation works and old tokens are invalidated
- logout clears Redis and cookie
- `authenticate` middleware correctly guards all `[auth]` routes
- all tests pass
- CI passes
- live verification passes on staging

### Non-Goals

- Google OAuth (next feature)
- RBAC
- MFA

---

## Feature 5 — Google OAuth

### Scope

Allow users to register and log in with Google.

### Branch
`feature/phase-1-google-oauth`

### Tasks

- Add `@fastify/oauth2` plugin configured for Google
- Create `POST /auth/google` — redirects to Google OAuth consent screen
- Create `GET /auth/google/callback` — handles callback, exchanges code for tokens, fetches user profile from Google
- On callback: if user exists (matched by email) log them in; if not create account with `passwordHash: null`
- Issue access and refresh tokens same as standard login flow
- Handle Google account with no email edge case — return 400

### Decisions

- Email is the join key between Google identity and Rawl account
- Users who registered with password can also link Google (same email → same account)
- No separate OAuth-only account type

### Constraints

- Google credentials (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`) must be added to `.env.example` and `env.ts`
- Callback URL must match exactly what is registered in Google Cloud Console
- Never store Google access tokens — only use them to fetch the profile, then discard

### Validation

#### Unit
- callback handler correctly extracts email and display name from Google profile
- callback handler creates new user when email is not found
- callback handler logs in existing user when email matches

#### Integration
- full OAuth flow against Google's test environment (use a test Google account)
- existing user logs in correctly via OAuth
- new user is created via OAuth with `passwordHash: null`

#### Regression
- standard login still works
- standard registration still works
- auth middleware still works

#### Live Verification
- visit `/auth/google` on staging → redirected to Google consent
- complete OAuth flow → redirected back, tokens issued, user created or logged in

### Completion Criteria

Complete only if:
- Google OAuth flow works end to end on staging
- existing email + Google login merges correctly
- new Google user is created correctly
- all tests pass
- CI passes
- live verification passes on staging

### Non-Goals

- other OAuth providers
- account unlinking

---

## Phase 1 — Phase PR & Completion

After all five features are complete and all tests pass:
1. Open a single PR titled `Phase 1 — Authentication Foundation`
2. `ci.yml` runs automatically — wait for it to pass
3. If it fails, fix and push — do not merge until green
4. Merge PR to `main`
5. `deploy-staging.yml` runs — wait for staging deploy to complete
6. Run full Live Verification on staging covering all five features
7. If anything fails, open a fix PR, repeat from step 2
8. When staging is clean, trigger `release.yml` manually
9. Verify production `/health` returns 200

---

---

# Phase 2 — Pain Submission

## Goal

Build the core pain submission and retrieval system. This is the primary value-generating action on the platform. The submission endpoint must accept the full 6-field structured pain and persist it. Retrieval must support the basic filters available to free users.

---

## Feature 1 — Pain Creation

### Scope

Allow authenticated users to submit a structured pain.

### Branch
`feature/phase-2-pain-creation`

### Tasks

- Create Drizzle schema for `pains` table, run migration
- Create `src/modules/pains/pains.schema.ts` — Zod schema for all six pain fields
- Create `src/modules/pains/pains.service.ts` — `createPain`
- Create `POST /pains` route — auth required
- Set `opportunityScore`, `meTooCount`, `subscriberCount` to 0 on creation
- Validate `wtpEstimate` is optional (user may select "not sure")
- Validate `frequency` against the `Frequency` enum
- Validate `category` against the `Category` enum
- Validate `country` as optional ISO 3166-1 alpha-2 string

### Decisions

- `userId` is always stored — even for anonymous pains
- `isAnonymous` flag controls what is returned publicly, never what is stored

### Constraints

- `POST /pains` requires authentication
- `userId` must never be exposed in responses for anonymous pains
- All six fields of the pain structure must be present (except `wtpEstimate` which is optional)
- Validation errors must return structured JSON

### Validation

#### Unit
- Zod schema rejects missing `rawDescription`
- Zod schema rejects invalid `frequency` enum value
- Zod schema rejects invalid `category` enum value
- `createPain` service function returns correct shape

#### Integration
- `POST /pains` with valid payload → 201, pain created in DB
- `POST /pains` with missing required field → 422
- `POST /pains` with anonymous flag → `userId` absent from response
- `POST /pains` without auth → 401

#### Regression
- all Phase 1 auth tests still pass

#### Live Verification
- `POST /pains` on staging with valid token → 201, inspect DB row
- anonymous pain → verify `userId` not in response body

### Completion Criteria

Complete only if:
- pain creation works end to end
- anonymous flag correctly hides userId in responses
- wtpEstimate is truly optional
- all tests pass
- CI passes
- live verification passes

### Non-Goals

- pain editing or deletion (next feature)
- Me Too or comments
- opportunity score computation

---

## Feature 2 — Pain Retrieval

### Scope

Allow anyone to retrieve pains — single pain and paginated list with basic filters.

### Branch
`feature/phase-2-pain-retrieval`

### Tasks

- Create `GET /pains/:id` — public, returns single pain (hides `userId` if `isAnonymous`)
- Create `GET /pains` — public, paginated, supports query params: `?category=`, `?sort=recent|popular`, `?page=`, `?limit=`
- Enforce maximum `limit` of 50 per page
- Return `meTooCount`, `subscriberCount`, `commentCount` on list and single views

### Constraints

- Anonymous pains must never expose `userId` or user details
- `GET /pains` must be performant — add DB index on `createdAt` and `category`
- Premium-only filters (`country`, `frequency`, `wtpEstimate` range) must not be usable on this endpoint — they belong to Phase 6

### Validation

#### Unit
- list query builds correct SQL for each filter combination
- anonymous pain serialiser strips userId

#### Integration
- `GET /pains` returns paginated list
- `GET /pains?category=WORK` returns only WORK pains
- `GET /pains?sort=popular` returns pains sorted by meTooCount descending
- `GET /pains/:id` returns correct pain
- `GET /pains/:id` for anonymous pain has no userId

#### E2E
- register → login → submit pain → retrieve pain list → verify pain appears → retrieve by id → verify fields match

#### Regression
- pain creation still works
- all Phase 1 tests still pass

#### Live Verification
- `GET /pains` → 200, paginated list
- `GET /pains/:id` → 200, correct fields
- anonymous pain → confirm no userId in response

### Completion Criteria

Complete only if:
- list and single retrieval work
- pagination works correctly
- anonymous pains never expose userId
- all tests pass
- CI passes
- live verification passes

### Non-Goals

- semantic search (Phase 9)
- Pain Map (Phase 6)
- premium filters (Phase 6)

---

## Feature 3 — Pain Update & Delete

### Scope

Allow users to update or delete their own pains.

### Branch
`feature/phase-2-pain-update-delete`

### Tasks

- Create `PATCH /pains/:id` — auth required, user must own the pain
- Create `DELETE /pains/:id` — auth required, user must own the pain, hard delete
- Return 403 if authenticated user does not own the pain
- Return 404 if pain does not exist

### Constraints

- A user can only modify or delete their own pains — never another user's
- 403 and 404 must be distinct responses — do not collapse them

### Validation

#### Unit
- ownership check returns false for non-owner
- ownership check returns true for owner

#### Integration
- `PATCH /pains/:id` by owner → 200, updated fields
- `PATCH /pains/:id` by non-owner → 403
- `PATCH /pains/:id` on non-existent pain → 404
- `DELETE /pains/:id` by owner → 200, row removed from DB
- `DELETE /pains/:id` by non-owner → 403

#### E2E
- register two users → first submits pain → second attempts update → 403 → first updates own pain → 200 → first deletes → 200 → GET returns 404

#### Regression
- pain creation and retrieval still work
- all Phase 1 tests still pass

#### Live Verification
- update own pain on staging → verify DB reflects change
- attempt to update another user's pain → confirm 403

### Completion Criteria

Complete only if:
- update and delete work for owner
- non-owner gets 403
- non-existent pain gets 404
- all tests pass
- CI passes
- live verification passes

### Non-Goals

- soft delete
- pain history or versioning

---

## Phase 2 — Phase PR & Completion

Open PR `Phase 2 — Pain Submission`, wait for CI, merge, deploy staging, live verify, release to production.

---

---

# Phase 3 — Engagement — Me Too & Comments

## Goal

Build the two engagement mechanics on pains: Me Too validation and comments.

---

## Feature 1 — Me Too

### Scope

Allow authenticated users to add or remove a Me Too on a pain. One per user per pain.

### Branch
`feature/phase-3-metoo`

### Tasks

- Create Drizzle schema for `metoos` table, run migration
- `POST /pains/:id/metoo` — add Me Too, auth required
- `DELETE /pains/:id/metoo` — remove Me Too, auth required
- `GET /pains/:id/metoos` — return count + whether current user has Me Too'd (public for count, auth for own status)
- Increment `pains.meTooCount` in the same transaction as inserting the `metoos` row
- Decrement `pains.meTooCount` in the same transaction as deleting the `metoos` row
- Return 409 if user tries to Me Too a pain they already Me Too'd
- Enqueue a notification job (notification queue, BullMQ) — `ME_TOO` type — after a successful Me Too

### Constraints

- One Me Too per user per pain — enforced at DB level (unique constraint) and application layer
- `meTooCount` must stay in sync with actual row count — use DB transaction
- Removing and re-adding a Me Too is permitted
- Notification is enqueued async — it must not block the Me Too response

### Validation

#### Unit
- Me Too service correctly calls notification enqueue after insert
- Me Too service does not enqueue notification on removal

#### Integration
- `POST /pains/:id/metoo` → 201, meTooCount incremented in DB
- `POST /pains/:id/metoo` again → 409
- `DELETE /pains/:id/metoo` → 200, meTooCount decremented
- `GET /pains/:id/metoos` → correct count, correct `hasMeToo` flag for authed user

#### E2E
- register two users → user 2 Me Toos user 1's pain → count is 1 → user 2 removes → count is 0 → user 1 cannot Me Too own pain (business rule: prevent self-MeToo — add this constraint)

#### Regression
- pain submission, retrieval, update, delete all still work
- all Phase 1 tests still pass

#### Live Verification
- Me Too a pain on staging → verify `meTooCount` incremented in DB
- Remove Me Too → verify decremented
- Re-add → verify works

### Completion Criteria

Complete only if:
- Me Too add/remove/count works correctly
- meTooCount stays in sync via transaction
- duplicate Me Too returns 409
- notification job is enqueued (even if notifications not yet built)
- all tests pass
- CI passes
- live verification passes

### Non-Goals

- notification delivery (Phase 4)
- milestone detection (Phase 4)

---

## Feature 2 — Comments

### Scope

Allow authenticated users to leave comments on pains and delete their own.

### Branch
`feature/phase-3-comments`

### Tasks

- Create Drizzle schema for `comments` table, run migration
- `POST /pains/:id/comments` — auth required, create comment
- `GET /pains/:id/comments` — public, paginated list of comments (hide commenter identity if pain is anonymous)
- `DELETE /comments/:id` — auth required, user must own the comment
- Enqueue notification job — `COMMENT` type — after successful comment creation
- Return 403 for deletion by non-owner
- Return 404 for non-existent comment

### Constraints

- Comment body must not be empty
- Comment body maximum length: 1000 characters
- Pagination: maximum 50 comments per page

### Validation

#### Unit
- empty comment body rejected by Zod schema
- comment body over 1000 chars rejected
- ownership check for deletion

#### Integration
- `POST /pains/:id/comments` → 201, comment in DB
- `GET /pains/:id/comments` → paginated list
- `DELETE /comments/:id` by owner → 200, removed from DB
- `DELETE /comments/:id` by non-owner → 403
- comment on non-existent pain → 404

#### E2E
- register → login → submit pain → add comment → list comments → delete comment → list again → confirm removed

#### Regression
- Me Too still works
- all previous phase tests still pass

#### Live Verification
- post comment on staging → appears in list
- delete own comment → gone from list
- attempt delete of another user's comment → 403

### Completion Criteria

Complete only if:
- comments CRUD works correctly
- pagination works
- non-owner delete returns 403
- notification job enqueued
- all tests pass
- CI passes
- live verification passes

### Non-Goals

- comment threading/nesting
- comment editing

---

## Phase 3 — Phase PR & Completion

Open PR `Phase 3 — Engagement`, wait for CI, merge, deploy staging, live verify, release to production.

---

---

# Phase 4 — Notifications

## Goal

Build the full notification system: persistent storage, real-time SSE delivery, milestone detection, and read state management.

---

## Feature 1 — Notification Storage & BullMQ Processors

### Scope

Implement the notification data layer and the workers that consume notification jobs enqueued in Phases 3.

### Branch
`feature/phase-4-notification-storage`

### Tasks

- Create Drizzle schema for `notifications` table, run migration
- Implement `notification.processor.ts` — consumes jobs from the notification queue, writes `Notification` rows to DB
- Implement `send-notification.job.ts` — job payload types for all `NotificationType` values
- Create `src/modules/notifications/notifications.service.ts` — `createNotification`, `getNotifications`, `markRead`, `markAllRead`
- `GET /notifications` — auth required, paginated, sorted by `createdAt` desc
- `PATCH /notifications/:id/read` — auth required, mark single notification as read
- `PATCH /notifications/read-all` — auth required, mark all as read

### Constraints

- Notifications must be written by the worker, not inline in the route handler
- Worker must handle job failures gracefully — failed jobs go to a dead-letter queue, not dropped
- `GET /notifications` must only return notifications belonging to the authenticated user

### Validation

#### Unit
- notification processor writes correct DB row for each notification type
- `getNotifications` only returns rows owned by requesting user

#### Integration
- enqueue a `ME_TOO` job → worker processes it → notification row in DB
- `GET /notifications` returns the notification
- `PATCH /notifications/:id/read` → `isRead` is true in DB
- `PATCH /notifications/read-all` → all user's notifications marked read

#### E2E
- user A submits pain → user B Me Toos → notification row appears for user A

#### Regression
- Me Too and comment flows still enqueue jobs correctly
- all previous phase tests still pass

#### Live Verification
- trigger a Me Too on staging → verify notification row in DB → `GET /notifications` returns it

### Completion Criteria

Complete only if:
- BullMQ worker processes notification jobs and writes to DB
- list, mark read, mark all read work correctly
- failed jobs go to dead-letter queue, not dropped
- all tests pass
- CI passes
- live verification passes

### Non-Goals

- SSE delivery (next feature)
- milestone detection (next feature)

---

## Feature 2 — SSE Real-Time Delivery

### Scope

Stream notifications to connected clients in real time via Server-Sent Events.

### Branch
`feature/phase-4-sse`

### Tasks

- Implement `src/modules/notifications/notifications.sse.ts` — manages SSE connections keyed by userId
- `GET /notifications/stream` — auth required, opens SSE connection, sends `ping` every 30 seconds to keep alive
- After the notification worker writes a DB row, it publishes a Redis pub/sub message containing the notification payload
- SSE handler subscribes to Redis pub/sub and pushes events to the correct connected client
- On client disconnect, clean up Redis subscription

### Decisions

- Redis pub/sub for fan-out between worker and SSE connections
- One SSE connection per user session

### Constraints

- SSE connection must survive Fastify's default response timeout — configure accordingly
- A user with no active SSE connection must still receive notifications (they persist in DB)
- Memory leak prevention: connections must be cleaned up on disconnect

### Validation

#### Unit
- SSE manager correctly maps userId to connection
- SSE manager removes connection on disconnect

#### Integration
- open SSE connection → trigger Me Too → event received over SSE within 2 seconds
- disconnect → re-connect → `GET /notifications` returns missed notifications from DB

#### E2E
- full flow: user A opens SSE stream → user B Me Toos user A's pain → user A receives SSE event in real time

#### Regression
- notification storage and worker still work
- all previous phase tests still pass

#### Live Verification
- open SSE connection on staging using `curl --no-buffer`
- trigger a Me Too from another session
- confirm event arrives on the SSE stream

### Completion Criteria

Complete only if:
- SSE events arrive in real time for connected clients
- missed notifications are available in DB for disconnected clients
- no memory leaks on disconnect
- all tests pass
- CI passes
- live verification passes

---

## Feature 3 — Milestone Detection

### Scope

Fire milestone notifications at 10, 50, 100, and 500 Me Toos. Each threshold fires exactly once per pain.

### Branch
`feature/phase-4-milestones`

### Tasks

- Add `milestonesReached` integer array column to `pains` table, run migration
- After incrementing `meTooCount`, check if the new count crosses a milestone threshold that has not yet been recorded
- If a new milestone is crossed, add it to `milestonesReached` and enqueue a `MILESTONE` notification job for the pain owner
- `MILESTONE` notification payload must include the threshold reached and the contextual copy string

### Milestone copy

```
10  → "10 people share this exact frustration. You're not alone in this."
50  → "50 people feel this. This is a real, widespread problem."
100 → "100 people. Someone is going to build a solution to this."
500 → "This pain is now in Rawl's top problems this week."
```

### Constraints

- Each milestone fires exactly once — once recorded in `milestonesReached`, it must never fire again even if meTooCount is decremented and re-incremented past the threshold
- Milestone check and `milestonesReached` update must happen in the same DB transaction as the meTooCount increment

### Validation

#### Unit
- milestone detection function returns correct threshold for counts 10, 50, 100, 500
- milestone detection returns null for counts that do not cross a new threshold
- milestone detection does not return a threshold already in `milestonesReached`

#### Integration
- increment meTooCount to exactly 10 → MILESTONE notification enqueued for threshold 10
- increment past 10 again → no duplicate MILESTONE notification

#### Regression
- SSE delivery still works
- all previous phase tests still pass

#### Live Verification
- seed a pain with 9 Me Toos on staging → add one more → confirm MILESTONE notification appears for pain owner

### Completion Criteria

Complete only if:
- milestones fire at correct thresholds
- no duplicate milestone notifications
- all tests pass
- CI passes
- live verification passes

---

## Phase 4 — Phase PR & Completion

Open PR `Phase 4 — Notifications`, wait for CI, merge, deploy staging, live verify, release to production.

---

---

# Phase 5 — Subscriptions & Resolution System

## Goal

Build the "Email me when solved" subscription system and the solution linking and rating system. The resolution notification email is the platform's most powerful moment.

---

## Feature 1 — Subscriptions

### Scope

Allow users to subscribe to a pain and be notified when it is resolved.

### Branch
`feature/phase-5-subscriptions`

### Tasks

- Create Drizzle schema for `subscriptions` table, run migration
- `POST /pains/:id/subscribe` — auth required, add subscription
- `DELETE /pains/:id/subscribe` — auth required, remove subscription
- `GET /pains/:id/subscribe` — auth required, return `{ subscribed: boolean }`
- Increment `pains.subscriberCount` on subscribe, decrement on unsubscribe (in transaction)
- Return 409 if user subscribes to a pain they are already subscribed to

### Validation

#### Unit
- subscription service increments and decrements subscriberCount correctly

#### Integration
- subscribe → 201, row in DB, subscriberCount incremented
- subscribe again → 409
- unsubscribe → 200, row removed, subscriberCount decremented
- `GET /pains/:id/subscribe` → correct boolean

#### E2E
- register → login → submit pain → subscribe → check status → unsubscribe → check status

#### Regression
- all previous phase tests still pass

#### Live Verification
- subscribe to a pain on staging → verify DB row and subscriberCount → unsubscribe → verify both removed

### Completion Criteria

Complete only if:
- subscribe/unsubscribe/status all work
- subscriberCount stays in sync
- all tests pass
- CI passes
- live verification passes

---

## Feature 2 — Solution Linking

### Scope

Allow premium users to link a launched product to a pain.

### Branch
`feature/phase-5-solutions`

### Tasks

- Create Drizzle schema for `solutions` and `solution_ratings` tables, run migration
- `POST /pains/:id/solutions` — auth required, premium required
- `GET /pains/:id/solutions` — public, list all solutions linked to a pain
- `GET /solutions/:id` — public, single solution
- After a solution is linked, set `pains.isResolved = true` and enqueue a `SOLUTION_LINKED` notification for the pain owner
- Enqueue `RESOLUTION` email jobs for all subscribers of that pain (email.queue, BullMQ)
- `isSponsored` flag must be present in every solution response

### Constraints

- `isSponsored` must always be included in response — never omit it
- Only premium users can link solutions
- A pain can have multiple solutions linked to it

### Validation

#### Unit
- solution service enqueues SOLUTION_LINKED notification correctly
- solution service enqueues RESOLUTION email for each subscriber
- isSponsored is always present in serialised output

#### Integration
- `POST /pains/:id/solutions` by premium user → 201, solution in DB, pain.isResolved = true
- `POST /pains/:id/solutions` by free user → 403
- `GET /pains/:id/solutions` → list includes isSponsored field

#### E2E
- user A submits pain → user B subscribes → premium user C links solution → pain.isResolved = true → SOLUTION_LINKED notification enqueued for A → RESOLUTION email jobs enqueued for B

#### Regression
- subscriptions still work
- all previous phase tests still pass

#### Live Verification
- link a solution on staging → verify pain.isResolved in DB → verify SOLUTION_LINKED notification → verify email jobs in BullMQ queue

### Completion Criteria

Complete only if:
- solution linking works for premium users
- free users get 403
- isResolved set on pain
- notification and email jobs enqueued
- all tests pass
- CI passes
- live verification passes

---

## Feature 3 — Solution Ratings & Resolution Email

### Scope

Allow subscribed users to rate solutions. Send the resolution email.

### Branch
`feature/phase-5-ratings-email`

### Tasks

- `POST /solutions/:id/rating` — auth required, score must be 1–5, user must have subscribed to the pain before the solution was linked
- Implement `email.processor.ts` — consumes email queue jobs, sends resolution notification email via SMTP
- Resolution email body: `"Someone built a solution to a problem you shared on Rawl. [productName] just launched. [description]. Check it out → [productUrl]"`
- After each rating, recompute `solutions.resolutionQualityAvg` and update `solutions.ratingCount`

### Constraints

- Only subscribers who subscribed before solution was linked can rate
- Score must be an integer 1–5 — reject anything outside this range
- One rating per user per solution — enforced at DB and application layer

### Validation

#### Unit
- rating outside 1–5 rejected
- duplicate rating rejected
- resolutionQualityAvg computed correctly from existing ratings

#### Integration
- subscriber rates solution → rating in DB, avg and count updated
- non-subscriber rates solution → 403
- user rates same solution twice → 409
- email processor sends email with correct content

#### E2E
- submit pain → subscribe → link solution → rate solution → verify avg updated → verify email sent (use test SMTP like Mailtrap)

#### Regression
- solution linking still works
- all previous phase tests still pass

#### Live Verification
- rate a solution on staging → verify DB avg updated
- inspect Mailtrap for resolution email with correct content

### Completion Criteria

Complete only if:
- ratings only accepted from pre-solution subscribers
- avg recomputed correctly
- resolution email sent with correct content
- all tests pass
- CI passes
- live verification passes

---

## Phase 5 — Phase PR & Completion

Open PR `Phase 5 — Subscriptions & Resolution System`, wait for CI, merge, deploy staging, live verify, release to production.

---

---

# Phase 6 — Discovery Layer

## Goal

Build the premium discovery tools: advanced filters, Opportunity Score computation, Pain Map geographic data, and the Trends endpoint.

---

## Feature 1 — Opportunity Score Computation

### Scope

Compute and persist Opportunity Scores for all pains on a scheduled hourly job.

### Branch
`feature/phase-6-opportunity-score`

### Tasks

- Create `src/shared/utils/score.ts` — implements the scoring formula
- Scoring formula: weighted composite of `frequency` (mapped to numeric), `meTooCount`, `wtpEstimate` (nullable — score 0 if null), underserved score (inverse of workaround length as a proxy), 30-day momentum (meTooCount growth in last 30 days)
- Create a scheduled BullMQ job (`opportunity-score` queue) that runs every hour, recomputes all pain scores, and updates `pains.opportunityScore`
- `GET /discovery/opportunity-score/:id` — premium: builder, returns score + breakdown by component

### Decisions

- Score is a float 0–100
- Underserved score proxy: if workaround is short (< 50 chars) score is high (user has no real solution); if long, lower
- Momentum: count of Me Toos added in last 30 days divided by pain age in days, normalised

### Validation

#### Unit
- scoring function returns 0–100 for all input combinations
- scoring function handles null wtpEstimate correctly
- momentum calculation handles brand-new pains correctly (avoid division by zero)

#### Integration
- scheduled job runs and updates opportunityScore in DB for all pains
- `GET /discovery/opportunity-score/:id` by premium user → 200, breakdown
- `GET /discovery/opportunity-score/:id` by free user → 403

#### Regression
- all previous phase tests still pass

#### Live Verification
- trigger score job manually on staging → inspect DB, confirm scores updated
- fetch score breakdown for a pain as premium user

### Completion Criteria

Complete only if:
- scoring formula implemented and tested
- scheduled job updates all scores hourly
- breakdown endpoint works for premium users
- all tests pass
- CI passes
- live verification passes

---

## Feature 2 — Advanced Filters

### Scope

Extend `GET /pains` with premium-only filters.

### Branch
`feature/phase-6-advanced-filters`

### Tasks

- Add premium-gated query params to `GET /pains`: `?country=`, `?frequency=`, `?wtpMin=`, `?wtpMax=`, `?solved=true|false`, `?sortBy=opportunityScore`
- Free users who pass these params receive 403
- Add appropriate DB indexes for new filter columns

### Validation

#### Unit
- filter builder constructs correct SQL for each new param
- premium check correctly gates each new param

#### Integration
- premium user filters by country → correct results
- premium user filters by frequency → correct results
- free user passes country param → 403

#### E2E
- submit multiple pains with different categories and countries → premium user filters → correct subsets returned

#### Regression
- basic free filters still work
- all previous phase tests still pass

#### Live Verification
- filter by country on staging as premium user → correct results

### Completion Criteria

Complete only if:
- all new filters work for premium users
- free users get 403 for premium filters
- all tests pass
- CI passes
- live verification passes

---

## Feature 3 — Pain Map

### Scope

Provide geographic cluster data for the Pain Map visualisation.

### Branch
`feature/phase-6-pain-map`

### Tasks

- `GET /pains/map` — premium: builder
- Returns array of clusters: `{ country, category, painCount, avgOpportunityScore }`
- Groups pains by `country` + `category`, counts them, averages opportunity score
- Only returns groups with at least 2 pains (single pains do not form a cluster)

### Validation

#### Unit
- clustering query groups correctly by country and category
- minimum cluster size of 2 is enforced

#### Integration
- seed pains with known countries → `GET /pains/map` returns correct cluster data
- free user → 403

#### Regression
- advanced filters still work
- all previous phase tests still pass

#### Live Verification
- seed pains with multiple countries on staging → map endpoint returns correct clusters

### Completion Criteria

Complete only if:
- map returns correct geographic clusters
- minimum cluster size enforced
- premium gating works
- all tests pass
- CI passes
- live verification passes

---

## Feature 4 — Trends

### Scope

Return trending pain clusters ranked by week-over-week Me Too growth.

### Branch
`feature/phase-6-trends`

### Tasks

- `GET /pains/trends` — premium: builder
- Returns top 20 pain clusters ranked by `(meToos in last 7 days) / (meToos in prior 7 days)` — growth ratio
- Pains with zero prior-week meToos are ranked by raw last-7-day count
- Response shape: `{ pains: [{ id, rawDescription, category, country, meTooCount, weekGrowthRatio }] }`

### Validation

#### Unit
- growth ratio calculation is correct
- zero prior-week case handled without division by zero

#### Integration
- seed pains with known Me Too timestamps → trends returns correct ordering

#### Regression
- Pain Map still works
- all previous phase tests still pass

#### Live Verification
- inspect trends endpoint on staging with seeded data → correct ordering

### Completion Criteria

Complete only if:
- trends endpoint returns correct growth-ranked list
- zero prior-week case handled
- all tests pass
- CI passes
- live verification passes

---

## Phase 6 — Phase PR & Completion

Open PR `Phase 6 — Discovery Layer`, wait for CI, merge, deploy staging, live verify, release to production.

---

---

# Phase 7 — Premium & Billing

## Goal

Implement Stripe subscription billing, premium tier gating middleware, and all billing management endpoints.

---

## Feature 1 — Premium Gating Middleware

### Scope

Build the middleware that enforces premium access before the Stripe integration is live.

### Branch
`feature/phase-7-gating-middleware`

### Tasks

- Create `src/shared/middleware/requirePremium.ts` — accepts a tier argument (`BUILDER` or `INTELLIGENCE`)
- Middleware reads `request.user.isPremium` and `request.user.premiumTier` (set by `authenticate` middleware)
- Returns 403 with structured error if user does not meet the tier requirement
- Apply `requirePremium('BUILDER')` to all `[premium: builder]` routes
- Apply `requirePremium('INTELLIGENCE')` to all `[premium: intelligence]` routes
- Write tests using a seeded premium user

### Constraints

- Premium gating must live in middleware — never inside service functions
- `INTELLIGENCE` tier users must also pass `BUILDER` checks — Intelligence is a superset of Builder

### Validation

#### Unit
- `requirePremium('BUILDER')` passes for BUILDER user
- `requirePremium('BUILDER')` passes for INTELLIGENCE user
- `requirePremium('INTELLIGENCE')` fails for BUILDER user
- `requirePremium('INTELLIGENCE')` passes for INTELLIGENCE user
- `requirePremium('BUILDER')` fails for free user

#### Integration
- premium route called by free user → 403
- premium route called by correct tier → 200

#### Regression
- all discovery endpoints still gate correctly
- all previous phase tests still pass

#### Live Verification
- call a premium endpoint on staging with a free user token → 403
- call with a premium user token → 200

### Completion Criteria

Complete only if:
- all tier combinations behave correctly
- Intelligence is a superset of Builder
- all tests pass
- CI passes
- live verification passes

---

## Feature 2 — Stripe Subscription Integration

### Scope

Allow users to subscribe to Builder or Intelligence tier via Stripe.

### Branch
`feature/phase-7-stripe`

### Tasks

- `POST /billing/subscribe` — auth required, accepts `{ tier: 'BUILDER' | 'INTELLIGENCE' }`, creates Stripe Checkout session, returns checkout URL
- `POST /billing/cancel` — auth required, cancels active Stripe subscription at period end
- `POST /billing/webhook` — no auth, verify Stripe signature, handle `checkout.session.completed` and `customer.subscription.deleted` events
- On `checkout.session.completed`: set `users.isPremium = true`, `users.premiumTier`, `users.premiumExpiresAt`
- On `customer.subscription.deleted`: set `users.isPremium = false`, clear `premiumTier` and `premiumExpiresAt`
- `GET /billing/status` — auth required, return current tier and expiry

### Constraints

- Stripe webhook must verify signature using `STRIPE_WEBHOOK_SECRET` — reject any request that fails verification
- Never store Stripe payment details in the DB — only store tier and expiry
- Billing webhook handler must be idempotent — receiving the same event twice must not double-apply

### Validation

#### Unit
- webhook handler ignores unknown event types
- webhook handler is idempotent for repeated events
- signature verification rejects invalid signatures

#### Integration
- simulate `checkout.session.completed` webhook → user.isPremium = true in DB
- simulate `customer.subscription.deleted` webhook → user.isPremium = false in DB
- `GET /billing/status` returns correct tier and expiry

#### E2E
- complete Stripe checkout flow in test mode → user upgraded → premium route accessible → cancel subscription → premium route returns 403

#### Regression
- gating middleware still works
- all previous phase tests still pass

#### Live Verification
- complete Stripe test mode checkout on staging → verify DB updated → verify premium routes accessible

### Completion Criteria

Complete only if:
- checkout flow works end to end in Stripe test mode
- webhook correctly upgrades and downgrades users
- webhook is idempotent
- all tests pass
- CI passes
- live verification passes

---

## Phase 7 — Phase PR & Completion

Open PR `Phase 7 — Premium & Billing`, wait for CI, merge, deploy staging, live verify, release to production.

---

---

# Phase 8 — Messaging

## Goal

Build the in-platform messaging system. All builder-to-user contact happens here. User emails are never exposed.

---

## Feature 1 — Send Message

### Scope

Allow premium users to send messages to pain owners who have opted in to contact.

### Branch
`feature/phase-8-messaging-send`

### Tasks

- Create Drizzle schema for `messages` table, run migration
- `POST /messages` — auth required, premium required (BUILDER)
- Payload: `{ recipientId, painId, body }`
- Before sending: verify `recipient.isContactable = true` — return 403 if not
- Verify the pain belongs to the recipient — return 400 if not
- Message body max 2000 characters
- Return 201 with message object on success

### Constraints

- Messages can only be sent to users with `isContactable: true`
- The pain must belong to the recipient — a builder cannot message someone using an unrelated pain as context
- Premium (BUILDER) required to send messages

### Validation

#### Unit
- contactability check returns false for non-contactable user
- pain ownership check returns false when pain does not belong to recipient

#### Integration
- send message to contactable user → 201, message in DB
- send message to non-contactable user → 403
- send message with wrong painId → 400
- free user sends message → 403

#### Regression
- all previous phase tests still pass

#### Live Verification
- set a user's isContactable to true on staging → send message as premium user → verify DB row

### Completion Criteria

Complete only if:
- message sends correctly for eligible recipients
- non-contactable users get 403
- wrong pain gets 400
- free users get 403
- all tests pass
- CI passes
- live verification passes

---

## Feature 2 — Conversations & Read State

### Scope

Allow users to list their conversations, read threads, and mark messages as read.

### Branch
`feature/phase-8-messaging-read`

### Tasks

- `GET /messages` — auth required, list all conversations (grouped by the other user), show last message and unread count
- `GET /messages/:userId` — auth required, full thread with that user, paginated
- `PATCH /messages/:id/read` — auth required, mark single message as read (only recipient can mark their own messages)

### Validation

#### Unit
- conversation grouping query returns correct last message and unread count

#### Integration
- list conversations → correct grouping
- get thread → paginated messages in correct order
- mark read → isRead = true in DB, only recipient can mark

#### E2E
- premium user A sends message to user B → B lists conversations → sees conversation with A → opens thread → marks read → unread count drops to 0

#### Regression
- message sending still works
- all previous phase tests still pass

#### Live Verification
- send messages between two users on staging → list conversations → open thread → mark read → verify counts

### Completion Criteria

Complete only if:
- conversation list, thread view, and mark read all work
- only recipient can mark messages as read
- all tests pass
- CI passes
- live verification passes

---

## Phase 8 — Phase PR & Completion

Open PR `Phase 8 — Messaging`, wait for CI, merge, deploy staging, live verify, release to production.

---

---

# Phase 9 — AI Layer

## Goal

Build the AI embedding pipeline, semantic clustering, semantic search, opportunity brief generation, and trend alerts.

---

## Feature 1 — Embedding Generation

### Scope

Generate and store vector embeddings for every pain, used by all downstream AI features.

### Branch
`feature/phase-9-embeddings`

### Tasks

- Add `embedding vector(1536)` column to `pains` table using `pgvector` extension, run migration
- Update `SCHEMA.md` to reflect the new column, log in `CHANGELOG.md`
- Create `src/modules/ai/embeddings.service.ts` — calls OpenAI `text-embedding-3-small` with `rawDescription + workaround` concatenated
- After a pain is created, enqueue an embedding job (`ai.queue`, BullMQ)
- `ai.processor.ts` consumes the job, generates the embedding, writes it to `pains.embedding`
- Handle OpenAI API errors gracefully — retry up to 3 times with exponential backoff, then dead-letter

### Constraints

- Embeddings are generated async — pain creation must not wait for embedding
- OpenAI API key must never appear in logs
- If embedding fails after retries, pain remains usable — embedding is nullable

### Validation

#### Unit
- embedding service builds correct prompt string
- retry logic retries 3 times then gives up

#### Integration
- create a pain → embedding job enqueued → processor runs → embedding column populated in DB

#### Regression
- pain creation still works
- all previous phase tests still pass

#### Live Verification
- submit a pain on staging → wait for worker → inspect `pains.embedding` column is populated

### Completion Criteria

Complete only if:
- embeddings generated and stored for new pains
- failures handled gracefully without breaking pain creation
- all tests pass
- CI passes
- live verification passes

---

## Feature 2 — Semantic Clustering

### Scope

Group semantically similar pains into clusters using their embeddings.

### Branch
`feature/phase-9-clustering`

### Tasks

- Create Drizzle schema for `pain_clusters` and `pain_cluster_memberships` tables if not yet migrated, run migration
- Create `src/modules/ai/clustering.service.ts` — implements k-means or cosine similarity grouping on stored embeddings using `pgvector` nearest-neighbour queries
- Scheduled BullMQ job runs daily: re-clusters all embedded pains, updates `pain_clusters` and `pain_cluster_memberships`, recomputes `avgOpportunityScore` and `growthRate` per cluster
- `GET /discovery/clusters` — premium: builder, returns cluster list
- `GET /discovery/clusters/:id` — premium: builder, returns cluster detail with member pains

### Constraints

- Clustering is async and scheduled — it does not block any request
- Clusters must be rebuilt from scratch on each run to avoid stale membership data

### Validation

#### Unit
- clustering service correctly groups pains with similar embeddings

#### Integration
- seed pains with known similar content → run clustering job → verify correct cluster memberships

#### E2E
- submit multiple similar pains → wait for embedding + clustering → discovery clusters endpoint shows them grouped

#### Regression
- embeddings still generated correctly
- all previous phase tests still pass

#### Live Verification
- seed similar pains on staging → trigger clustering job → inspect cluster memberships in DB → verify cluster endpoints

### Completion Criteria

Complete only if:
- clustering groups similar pains correctly
- cluster endpoints work for premium users
- all tests pass
- CI passes
- live verification passes

---

## Feature 3 — Semantic Search

### Scope

Allow premium users to search pains by meaning, not just keyword.

### Branch
`feature/phase-9-semantic-search`

### Tasks

- `GET /pains/search?q=` — premium: builder
- Generate embedding for the search query using the same embedding model
- Run `pgvector` cosine similarity search against `pains.embedding`
- Return top 20 most similar pains with similarity score
- Falls back gracefully if query embedding fails — returns empty results with error flag

### Validation

#### Unit
- search handler generates query embedding before executing similarity search
- fallback returns correct shape on embedding failure

#### Integration
- search for a known concept → returns pains with similar content ranked by similarity

#### E2E
- submit pain about "expense reports" → search for "reimbursement" → pain appears in results

#### Regression
- clustering still works
- all previous phase tests still pass

#### Live Verification
- submit a pain and wait for embedding → search for semantically related term → verify it appears in results

### Completion Criteria

Complete only if:
- semantic search returns meaningful results
- fallback works on embedding failure
- all tests pass
- CI passes
- live verification passes

---

## Feature 4 — Opportunity Brief Generation

### Scope

Generate AI-written opportunity briefs for pain clusters, available to Intelligence tier users.

### Branch
`feature/phase-9-briefs`

### Tasks

- `GET /discovery/briefs/:clusterId` — premium: intelligence
- Check if a cached brief exists in Redis (TTL: 24 hours) — return it if present
- If not cached: enqueue a `generate-brief` job to BullMQ
- `generate-brief.job.ts` — fetches all member pains for the cluster, builds prompt, calls OpenAI chat completion, writes result to Redis
- Brief prompt must include: cluster label, pain descriptions (up to 20), workarounds, frequency distribution, WTP distribution
- Return `{ status: "generating" }` if brief is being generated, `{ brief: "..." }` when ready

### Constraints

- Never include raw user IDs or emails in the prompt sent to OpenAI
- Cache briefs for 24 hours — do not regenerate on every request
- Brief generation is async — do not make the HTTP request wait for OpenAI

### Validation

#### Unit
- prompt builder correctly anonymises user data before sending to OpenAI
- cached brief is returned without hitting OpenAI

#### Integration
- request brief for a cluster → job enqueued → brief written to Redis → subsequent request returns brief

#### Regression
- semantic search still works
- all previous phase tests still pass

#### Live Verification
- request a brief on staging → wait for generation → request again → brief returned

### Completion Criteria

Complete only if:
- briefs generate correctly and are cached
- no user PII sent to OpenAI
- all tests pass
- CI passes
- live verification passes

---

## Feature 5 — Trend Alerts

### Scope

Allow premium users to set keyword or category monitors and be notified when matching pain clusters emerge.

### Branch
`feature/phase-9-trend-alerts`

### Tasks

- Add `trend_alerts` table to schema: `{ id, userId, keywords[], categories[], createdAt }`, run migration, update `SCHEMA.md`, log in `CHANGELOG.md`
- API endpoints: `POST /trend-alerts`, `GET /trend-alerts`, `DELETE /trend-alerts/:id` — all premium: builder
- After each clustering job run, check all trend alerts against new/updated clusters — enqueue notifications for matches
- Notification type: use existing `NOTIFICATION` system with a new payload type `TREND_ALERT`
- Add `TREND_ALERT` to `NotificationType` enum — update `SCHEMA.md`, log in `CHANGELOG.md`

### Validation

#### Unit
- alert matching correctly identifies clusters that match keywords
- alert matching correctly identifies clusters that match categories
- no false positives on non-matching clusters

#### Integration
- create trend alert → run clustering job with matching pain → notification enqueued

#### Regression
- brief generation still works
- all previous phase tests still pass

#### Live Verification
- create a trend alert → seed matching pains → trigger clustering → verify notification received

### Completion Criteria

Complete only if:
- trend alerts trigger correctly on matching clusters
- no false positives
- all tests pass
- CI passes
- live verification passes

---

## Phase 9 — Phase PR & Completion

Open PR `Phase 9 — AI Layer`, wait for CI, merge, deploy staging, live verify, release to production.

---

---

# Phase 10 — Production Hardening

## Goal

Finalise all infrastructure configuration, complete Nginx rate limiting, verify all monitoring is live, and run final load and smoke tests before declaring the platform production-ready.

---

## Feature 1 — Nginx Complete Configuration

### Scope

Complete the Nginx configuration with per-route rate limits, gzip, and security headers.

### Branch
`feature/phase-10-nginx`

### Tasks

- Set rate limits per route group in `nginx/nginx.conf`:
  - Auth endpoints: 10 requests/minute per IP
  - Pain creation: 30 requests/minute per IP
  - Me Too / comments: 60 requests/minute per IP
  - Read endpoints: 300 requests/minute per IP
  - SSE stream: 5 connections/minute per IP
  - Billing webhook: unlimited (verified by Stripe signature)
- Enable gzip compression for JSON responses
- Add security headers: `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Strict-Transport-Security`
- Verify SSL termination config is correct for Render

### Validation

#### Unit
- not applicable for Nginx config

#### Integration
- verify rate limiting triggers correctly at configured thresholds using a test script

#### Regression
- all API endpoints still respond correctly through Nginx
- all previous phase tests still pass

#### Live Verification
- send bursts of requests to auth endpoint on staging → verify 429 responses after threshold
- confirm security headers present on all responses

### Completion Criteria

Complete only if:
- rate limiting works at all configured thresholds
- security headers present
- gzip active
- all tests pass
- CI passes
- live verification passes

---

## Feature 2 — Monitoring Verification & Alerting Rules

### Scope

Confirm all Prometheus metrics are emitting, all Grafana dashboards are populated, all Loki logs are shipping, and all alerting rules are active.

### Branch
`feature/phase-10-monitoring`

### Tasks

- Verify all Grafana dashboards show live data: request rate, error rate, latency p50/p95/p99, DB query time, Redis hit rate, BullMQ queue depth
- Define Prometheus alerting rules:
  - Error rate > 1% over 5 minutes → alert
  - p99 latency > 2 seconds over 5 minutes → alert
  - DB connection pool > 80% utilised → alert
  - BullMQ dead-letter queue depth > 0 → alert
- Verify Loki is receiving application logs
- Write runbook entries for each alert in a `monitoring/RUNBOOK.md` file

### Validation

#### Live Verification
- generate load on staging → verify request rate metric updates in Grafana
- trigger an intentional error → verify error rate metric increases
- verify Loki log explorer shows recent application logs
- verify alerting rules are active in Prometheus

### Completion Criteria

Complete only if:
- all dashboards show live data
- all alerting rules are active
- Loki receiving logs
- RUNBOOK.md written for each alert
- live verification passes

---

## Feature 3 — Final Load Test & Smoke Test

### Scope

Run a structured load test against staging and a full smoke test covering every API endpoint.

### Branch
`feature/phase-10-load-test`

### Tasks

- Write a load test script (using `k6` or `autocannon`) that simulates:
  - 100 concurrent users browsing the pain feed
  - 20 concurrent users submitting pains
  - 50 concurrent users Me Tooing
  - 10 concurrent SSE connections
- Run the load test against staging for 5 minutes
- Verify p99 latency stays below 500ms under load
- Verify error rate stays below 0.1% under load
- Write a smoke test script that hits every endpoint in `API_SPEC.md` once with correct auth and verifies 2xx responses

### Validation

#### Live Verification
- run load test → p99 < 500ms, error rate < 0.1%
- run smoke test → all endpoints return expected status codes
- Grafana dashboards reflect load test traffic correctly

### Completion Criteria

Complete only if:
- load test passes at target thresholds
- smoke test passes all endpoints
- no new issues introduced
- live verification passes

---

## Phase 10 — Phase PR & Completion

Open PR `Phase 10 — Production Hardening`, wait for CI, merge, deploy staging, live verify, trigger `release.yml`.

**After Phase 10 is merged and released to production: Rawl backend is complete.**

---

---

## Final Checklist Before Production Release

- [ ] All 10 phases merged to `main`
- [ ] All PR CIs passed
- [ ] All staging live verifications passed
- [ ] All Grafana dashboards showing live production data
- [ ] All alerting rules active in production
- [ ] Stripe webhook registered for production endpoint
- [ ] Google OAuth callback URL registered for production domain
- [ ] All environment variables set in production (none from `.env.example` are missing)
- [ ] `/health` returns 200 on production
- [ ] Smoke test passes against production