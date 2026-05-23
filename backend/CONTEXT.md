# Rawl — Project Context

## What We Are Building

Rawl is a problem intelligence network. Everyday people share real frustrations, recurring pains, and unmet needs. Builders, founders, and product teams pay for premium access to discover high-signal problems worth solving. The platform connects human frustration to human solutions — with enough structured data at each step that a builder can actually make a decision.

---

## What Good Looks Like

- A user submits a pain in under 6 minutes and feels genuinely heard
- A builder searches a category, finds a cluster of 200 people with the same frustration, reads their workarounds, sees a WTP estimate, and knows within 10 minutes whether this is worth pursuing
- A builder launches a product, links it to a Rawl pain, and every subscribed user gets an email saying someone built what they asked for
- The platform handles that moment — and the press that follows — without going down

---

## What to Avoid

- Vague pain submissions with no structure (the flow must enforce quality without feeling like a form)
- Exposing user emails to anyone — ever
- Business logic in Nginx — infrastructure only
- Skipping tests to move faster
- Hardcoded secrets anywhere in the codebase
- Monolithic route files — everything is modular by domain
- Any feature that contacts a user without their explicit opt-in

---

## Living Document Rules

This file, `API_SPEC.md`, and `SCHEMA.md` are living documents. As the codebase evolves they must stay accurate. The agent is expected to update them. The following rules govern how and when.

### When updates are permitted

The agent MAY update `CONTEXT.md`, `API_SPEC.md`, and `SCHEMA.md` when:
- Something was genuinely missing from the initial spec and must be added as development reveals it
- A technical inconsistency exists that would cause the build to fail or produce incorrect behaviour
- The folder structure changes due to a legitimate architectural decision made during a phase
- A new endpoint, table, column, or relationship is required by a feature in the current phase

### When updates are forbidden

The agent MUST NOT update these files to:
- Remove an endpoint, table, or feature to avoid implementing or testing it
- Simplify a data model or API surface to reduce implementation difficulty
- Bypass a business rule, constraint, or validation step defined in this file
- Reduce test coverage requirements

### How updates must be made

Every change made to `CONTEXT.md`, `API_SPEC.md`, or `SCHEMA.md` must be accompanied by an entry in `CHANGELOG.md` that states:
1. Exactly what was changed
2. The exact reason the change was made
3. What would break or be wrong if the change had not been made

No change to these files is valid without a corresponding `CHANGELOG.md` entry.

---

## Companion Files

| File | Purpose |
|---|---|
| `API_SPEC.md` | Full API surface — all routes, methods, auth requirements. Update as endpoints are added or changed. |
| `SCHEMA.md` | Full database schema. Update as tables, columns, or relationships change. |
| `PHASES.md` | Full build sequence. Read before starting any work. |
| `CHANGELOG.md` | Log of all changes made to any spec file. Every entry must include what changed, why, and the consequence of not changing it. |

---

## User Types

There are two user types in the database but one account system. All users sign up the same way.

**Standard user** — free access. Can submit pains, Me Too, comment, subscribe to resolutions, browse the feed with basic filters.

**Premium user** — paid access. Gets the full discovery layer: advanced filters, Pain Map, Opportunity scores, Trend board, in-platform messaging (to opted-in users), saved collections, CSV export, AI opportunity briefs, trend alerts, competitive intelligence. There are two premium tiers: Builder and Intelligence.

There is no separate "founder account". Anyone who pays is premium.

---

## Core Domain Concepts

**Pain** — A structured problem submission. Contains: raw description, frequency, workaround, WTP estimate, category, country, anonymous flag, resolved flag, opportunity score, subscriber count, Me Too count.

**Me Too** — A validation signal. One per user per pain. Triggers a real-time notification to the pain author. Feeds into the opportunity score.

**Comment** — Optional text left under a pain. Triggers a notification to the pain author and anyone else who commented on that pain.

**Notification** — Real-time event delivered via SSE (Server-Sent Events). Types: me_too, comment, milestone, bookmark, solution_linked, resolution.

**Milestone** — Fires at 10, 50, 100, 500 Me Toos on a pain. Notification has contextual copy at each threshold.

**Subscription** — A user subscribing to be notified when a pain is resolved. "Email me when solved." Email is never exposed — Rawl holds it and sends the notification.

**Solution** — A builder links a launched product to a pain or pain cluster. Community rates how well it resolves the stated problem.

**Pain Cluster** — A group of semantically similar pains identified by the AI embedding pipeline. The unit of analysis for opportunity briefs and trend detection.

**Opportunity Score** — A computed value on every pain: function of frequency, Me Too count, WTP estimate, underserved score (inverse of workaround quality), and 30-day momentum.

**Sponsored Discovery** — A premium add-on. A builder pays to show a "solution in development" card alongside relevant pains. Strictly labelled as sponsored.

**In-Platform Message** — Builder-to-user contact routed entirely through Rawl. User email never leaves the system. User must have opted in to be contactable on a specific pain.

---

## Folder Structure

```
rawl/
├── AGENTS.md
├── backend/
│   ├── CONTEXT.md
│   ├── API_SPEC.md
│   ├── SCHEMA.md
│   ├── PHASES.md
│   ├── CHANGELOG.md
│   ├── .env.example
│   ├── package.json
│   ├── tsconfig.json
│   ├── drizzle.config.ts
│   │
│   ├── skills/
│   │
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   │   ├── auth.routes.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── auth.schema.ts
│   │   │   │   └── auth.test.ts
│   │   │   ├── users/
│   │   │   │   ├── users.routes.ts
│   │   │   │   ├── users.service.ts
│   │   │   │   ├── users.schema.ts
│   │   │   │   └── users.test.ts
│   │   │   ├── pains/
│   │   │   │   ├── pains.routes.ts
│   │   │   │   ├── pains.service.ts
│   │   │   │   ├── pains.schema.ts
│   │   │   │   └── pains.test.ts
│   │   │   ├── engagement/
│   │   │   │   ├── metoo.routes.ts
│   │   │   │   ├── metoo.service.ts
│   │   │   │   ├── comments.routes.ts
│   │   │   │   ├── comments.service.ts
│   │   │   │   └── engagement.test.ts
│   │   │   ├── notifications/
│   │   │   │   ├── notifications.routes.ts
│   │   │   │   ├── notifications.service.ts
│   │   │   │   ├── notifications.sse.ts
│   │   │   │   └── notifications.test.ts
│   │   │   ├── subscriptions/
│   │   │   │   ├── subscriptions.routes.ts
│   │   │   │   ├── subscriptions.service.ts
│   │   │   │   └── subscriptions.test.ts
│   │   │   ├── solutions/
│   │   │   │   ├── solutions.routes.ts
│   │   │   │   ├── solutions.service.ts
│   │   │   │   └── solutions.test.ts
│   │   │   ├── discovery/
│   │   │   │   ├── discovery.routes.ts
│   │   │   │   ├── discovery.service.ts
│   │   │   │   ├── opportunity.service.ts
│   │   │   │   └── discovery.test.ts
│   │   │   ├── premium/
│   │   │   │   ├── billing.routes.ts
│   │   │   │   ├── billing.service.ts
│   │   │   │   ├── gating.middleware.ts
│   │   │   │   └── billing.test.ts
│   │   │   ├── messaging/
│   │   │   │   ├── messaging.routes.ts
│   │   │   │   ├── messaging.service.ts
│   │   │   │   └── messaging.test.ts
│   │   │   └── ai/
│   │   │       ├── embeddings.service.ts
│   │   │       ├── clustering.service.ts
│   │   │       ├── briefs.service.ts
│   │   │       └── ai.test.ts
│   │   │
│   │   ├── workers/
│   │   │   ├── bullmq/
│   │   │   │   ├── queues/
│   │   │   │   │   ├── notification.queue.ts
│   │   │   │   │   ├── email.queue.ts
│   │   │   │   │   └── ai.queue.ts
│   │   │   │   ├── processors/
│   │   │   │   │   ├── notification.processor.ts
│   │   │   │   │   ├── email.processor.ts
│   │   │   │   │   └── ai.processor.ts
│   │   │   │   ├── jobs/
│   │   │   │   │   ├── send-notification.job.ts
│   │   │   │   │   ├── send-email.job.ts
│   │   │   │   │   └── generate-brief.job.ts
│   │   │   │   └── worker.ts
│   │   │   └── worker.ts
│   │   │
│   │   ├── database/
│   │   │   ├── drizzle/
│   │   │   │   ├── schema/
│   │   │   │   │   ├── users.schema.ts
│   │   │   │   │   ├── auth.schema.ts
│   │   │   │   │   ├── pains.schema.ts
│   │   │   │   │   ├── engagement.schema.ts
│   │   │   │   │   ├── notifications.schema.ts
│   │   │   │   │   ├── subscriptions.schema.ts
│   │   │   │   │   ├── solutions.schema.ts
│   │   │   │   │   ├── discovery.schema.ts
│   │   │   │   │   ├── premium.schema.ts
│   │   │   │   │   ├── messaging.schema.ts
│   │   │   │   │   └── ai.schema.ts
│   │   │   │   ├── migrations/
│   │   │   │   ├── seeds/
│   │   │   │   └── index.ts
│   │   │   └── seeds/
│   │   │
│   │   ├── shared/
│   │   │   ├── middleware/
│   │   │   │   ├── authenticate.ts
│   │   │   │   ├── requirePremium.ts
│   │   │   │   └── rateLimiter.ts
│   │   │   ├── utils/
│   │   │   │   ├── hash.ts
│   │   │   │   ├── token.ts
│   │   │   │   ├── email.ts
│   │   │   │   └── score.ts
│   │   │   └── config/
│   │   │       ├── env.ts
│   │   │       ├── database.ts
│   │   │       ├── redis.ts
│   │   │       └── bullmq.ts
│   │   │
│   │   ├── app.ts
│   │   └── server.ts
│   │
│   ├── tests/
│   │   ├── e2e/
│   │   ├── integration/
│   │   └── setup/
│   │       ├── test-env.ts
│   │       ├── global-setup.ts
│   │       └── global-teardown.ts
│   │
│   ├── nginx/
│   │   └── nginx.conf
│   │
│   ├── monitoring/
│   │   ├── prometheus.yml
│   │   ├── loki.yml
│   │   └── grafana/
│   │       └── dashboards/
│   │
│   ├── Dockerfile
│   └── docker-compose.yml
│
├── frontend/
└── .github/
    └── workflows/
        ├── ci.yml
        ├── deploy-staging.yml
        ├── release.yml
```

---

## Key Business Rules

1. User emails are never returned in any API response to any third party. Ever.
2. A user can only Me Too a pain once. Removing and re-adding is allowed.
3. In-platform messages can only be sent to users with `isContactable: true` on a pain they submitted.
4. Anonymous pains still belong to a user in the database — the anonymous flag controls what is shown publicly.
5. Opportunity scores are recomputed on a scheduled job every hour.
6. Milestone notifications fire exactly once per threshold per pain — they do not repeat.
7. Sponsored solutions are always labelled — the `isSponsored` flag must be surfaced in every response that includes solutions.
8. Premium gating is enforced at the middleware level, not inside service functions.
9. Rate limiting is enforced at the Nginx layer for all routes, with tighter limits on auth endpoints.
10. All solution ratings are only accepted from users who subscribed to that pain before the solution was linked.


---

## Phase Reference

See `PHASES.md` for the full build sequence. The current phase is always the lowest-numbered phase that has not had its PR merged to `main`.
