# Rawl — API Specification

This file is the single source of truth for the Rawl backend API surface.

## Living Document Rules

This file MUST be updated by the agent when:
- A new endpoint is added to the codebase
- An endpoint is removed or deprecated
- A route path or method changes
- A premium/auth requirement changes on an existing route

This file MUST NOT be updated to:
- Remove an endpoint to avoid building or testing it
- Simplify a route to reduce implementation complexity
- Bypass a business rule defined in CONTEXT.md

Every change made to this file must be logged in `CHANGELOG.md` with the exact reason the change was made and what would break if it had not been made.

---

## Conventions

- Application routes are prefixed with `/api/v1`
- Infrastructure routes `/health` and `/metrics` are top-level for load balancers, staging smoke tests, and monitoring scrapes
- `[auth]` — requires valid access token
- `[premium: builder]` — requires Builder tier or above
- `[premium: intelligence]` — requires Intelligence tier only
- All responses are JSON
- All timestamps are ISO 8601 UTC
- Pagination uses `?page=` and `?limit=` query params where applicable

---

## Auth

```
POST   /auth/register          — create account with email + password
POST   /auth/google            — initiate Google OAuth flow
GET    /auth/google/callback   — Google OAuth callback handler
POST   /auth/login             — login, returns access + refresh tokens
POST   /auth/logout            — invalidate session                          [auth]
POST   /auth/refresh           — exchange refresh token for new access token
GET    /auth/me                — get current authenticated user              [auth]
```

---

## Health

```
GET    /health                 — server health check (used by Render, Nginx, monitoring)
GET    /metrics                — Prometheus metrics endpoint (used by monitoring)
```

---

## Users

```
PATCH  /users/me               — update own profile                          [auth]
PATCH  /users/me/contactable   — toggle contactable status                   [auth]
GET    /users/:id              — get public profile of any user
```

---

## Pains

```
POST   /pains                  — submit a pain                               [auth]
GET    /pains                  — list pains, basic filters (category, recency)
GET    /pains/:id              — get single pain
PATCH  /pains/:id              — update own pain                             [auth]
DELETE /pains/:id              — delete own pain                             [auth]
GET    /pains/map              — geographic cluster data                     [auth] [premium: builder]
GET    /pains/trends           — trending pain clusters, week-over-week      [auth] [premium: builder]
GET    /pains/search           — semantic search across pains                [auth] [premium: builder]
```

---

## Engagement

```
POST   /pains/:id/metoo        — add Me Too to a pain                        [auth]
DELETE /pains/:id/metoo        — remove own Me Too                           [auth]
GET    /pains/:id/metoos       — get Me Too count + current user's own status
POST   /pains/:id/comments     — add comment to a pain                       [auth]
GET    /pains/:id/comments     — list comments on a pain (paginated)
DELETE /comments/:id           — delete own comment                          [auth]
```

---

## Notifications

```
GET    /notifications          — list own notifications, paginated            [auth]
PATCH  /notifications/:id/read — mark a single notification as read          [auth]
PATCH  /notifications/read-all — mark all notifications as read              [auth]
GET    /notifications/stream   — SSE stream for real-time notification delivery [auth]
```

---

## Subscriptions

```
POST   /pains/:id/subscribe    — subscribe to resolution notification         [auth]
DELETE /pains/:id/subscribe    — unsubscribe                                  [auth]
GET    /pains/:id/subscribe    — check own subscription status on a pain      [auth]
```

---

## Solutions

```
POST   /pains/:id/solutions    — link a launched product to a pain            [auth] [premium: builder]
GET    /pains/:id/solutions    — list all solutions linked to a pain
GET    /solutions/:id          — get a single solution
POST   /solutions/:id/rating   — rate a solution (subscribed users only)      [auth]
```

---

## Discovery

```
GET    /discovery/opportunity-score/:id    — score breakdown for a pain        [auth] [premium: builder]
GET    /discovery/clusters                 — list all pain clusters            [auth] [premium: builder]
GET    /discovery/clusters/:id             — cluster detail + member pains     [auth] [premium: builder]
GET    /discovery/briefs/:clusterId        — AI opportunity brief for cluster  [auth] [premium: intelligence]
```

---

## Billing

```
POST   /billing/subscribe      — start a premium subscription via Stripe      [auth]
POST   /billing/cancel         — cancel active subscription                   [auth]
POST   /billing/webhook        — Stripe webhook handler (no auth — verified by Stripe signature)
GET    /billing/status         — get current tier and expiry date             [auth]
```

---

## Messaging

```
POST   /messages               — send message to an opted-in user             [auth] [premium: builder]
GET    /messages               — list all conversations                        [auth] [premium: builder]
GET    /messages/:userId       — get message thread with a specific user       [auth] [premium: builder]
PATCH  /messages/:id/read      — mark a message as read                        [auth]
```

---

## Saved Pains

```
POST   /saved/:painId          — save a pain to own collection                [auth] [premium: builder]
DELETE /saved/:painId          — remove a pain from own collection             [auth] [premium: builder]
GET    /saved                  — list own saved pains with notes               [auth] [premium: builder]
PATCH  /saved/:painId          — update note on a saved pain                   [auth] [premium: builder]
```
