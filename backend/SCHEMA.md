# Rawl — Database Schema

This file is the single source of truth for the Rawl database schema.

## Living Document Rules

This file MUST be updated by the agent when:
- A new table or column is added to the database
- A table or column is removed or renamed
- A relationship between tables changes
- An enum value is added or removed
- An index is added for a performance reason

This file MUST NOT be updated to:
- Remove a table or column to avoid building or testing it
- Simplify a relationship to reduce implementation complexity
- Drop a constraint that exists for a business rule reason

Every change made to this file must be logged in `CHANGELOG.md` with the exact reason the change was made and what would break if it had not been made.

---

## Schema

```ts
import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const frequencyEnum = pgEnum("frequency", [
  "DAILY",
  "FEW_TIMES_WEEK",
  "MONTHLY",
  "FEW_TIMES_YEAR",
  "CONSTANTLY",
]);

export const categoryEnum = pgEnum("category", [
  "WORK",
  "HEALTH",
  "FINANCE",
  "PARENTING",
  "HOME",
  "LEARNING",
  "OTHER",
]);

export const premiumTierEnum = pgEnum("premium_tier", ["BUILDER", "INTELLIGENCE"]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "ME_TOO",
  "COMMENT",
  "MILESTONE",
  "BOOKMARK",
  "SOLUTION_LINKED",
  "RESOLUTION",
]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: varchar("email", { length: 320 }).notNull(),
    passwordHash: text("password_hash"),
    displayName: varchar("display_name", { length: 120 }),
    isAnonymousDefault: boolean("is_anonymous_default").notNull().default(false),
    isPremium: boolean("is_premium").notNull().default(false),
    premiumTier: premiumTierEnum("premium_tier"),
    premiumExpiresAt: timestamp("premium_expires_at", { withTimezone: true }),
    insightScore: integer("insight_score").notNull().default(0),
    isContactable: boolean("is_contactable").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    emailIdx: uniqueIndex("users_email_idx").on(table.email),
  }),
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    refreshToken: text("refresh_token").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    refreshTokenIdx: uniqueIndex("sessions_refresh_token_idx").on(table.refreshToken),
  }),
);

export const pains = pgTable("pains", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  rawDescription: text("raw_description").notNull(),
  frequency: frequencyEnum("frequency").notNull(),
  workaround: text("workaround").notNull(),
  wtpEstimate: integer("wtp_estimate"),
  category: categoryEnum("category").notNull(),
  country: varchar("country", { length: 2 }),
  isAnonymous: boolean("is_anonymous").notNull().default(false),
  isResolved: boolean("is_resolved").notNull().default(false),
  opportunityScore: numeric("opportunity_score", { precision: 10, scale: 2 }).notNull().default("0"),
  meTooCount: integer("me_too_count").notNull().default(0),
  subscriberCount: integer("subscriber_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const meToos = pgTable(
  "me_toos",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    painId: uuid("pain_id")
      .notNull()
      .references(() => pains.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    oneMeTooPerUserPerPain: uniqueIndex("me_toos_user_pain_idx").on(table.userId, table.painId),
  }),
);

export const comments = pgTable("comments", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  painId: uuid("pain_id")
    .notNull()
    .references(() => pains.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  painId: uuid("pain_id").references(() => pains.id, { onDelete: "set null" }),
  type: notificationTypeEnum("type").notNull(),
  payload: jsonb("payload").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    painId: uuid("pain_id")
      .notNull()
      .references(() => pains.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    oneSubscriptionPerUserPerPain: uniqueIndex("subscriptions_user_pain_idx").on(table.userId, table.painId),
  }),
);

export const solutions = pgTable("solutions", {
  id: uuid("id").defaultRandom().primaryKey(),
  painId: uuid("pain_id")
    .notNull()
    .references(() => pains.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  productName: varchar("product_name", { length: 200 }).notNull(),
  productUrl: text("product_url").notNull(),
  description: text("description").notNull(),
  resolutionQualityAvg: numeric("resolution_quality_avg", { precision: 10, scale: 2 }).notNull().default("0"),
  ratingCount: integer("rating_count").notNull().default(0),
  isSponsored: boolean("is_sponsored").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const solutionRatings = pgTable(
  "solution_ratings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    solutionId: uuid("solution_id")
      .notNull()
      .references(() => solutions.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    score: integer("score").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    oneRatingPerUserPerSolution: uniqueIndex("solution_ratings_solution_user_idx").on(table.solutionId, table.userId),
  }),
);

export const painClusters = pgTable("pain_clusters", {
  id: uuid("id").defaultRandom().primaryKey(),
  label: varchar("label", { length: 200 }).notNull(),
  painCount: integer("pain_count").notNull().default(0),
  avgOpportunityScore: numeric("avg_opportunity_score", { precision: 10, scale: 2 }).notNull().default("0"),
  growthRate: numeric("growth_rate", { precision: 10, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const painClusterMemberships = pgTable(
  "pain_cluster_memberships",
  {
    painId: uuid("pain_id")
      .notNull()
      .references(() => pains.id, { onDelete: "cascade" }),
    clusterId: uuid("cluster_id")
      .notNull()
      .references(() => painClusters.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.painId, table.clusterId] }),
  }),
);

export const savedPains = pgTable(
  "saved_pains",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    painId: uuid("pain_id")
      .notNull()
      .references(() => pains.id, { onDelete: "cascade" }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    oneSavedPainPerUserPerPain: uniqueIndex("saved_pains_user_pain_idx").on(table.userId, table.painId),
  }),
);

export const messages = pgTable("messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  senderId: uuid("sender_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  recipientId: uuid("recipient_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  painId: uuid("pain_id").references(() => pains.id, { onDelete: "set null" }),
  body: text("body").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
```
