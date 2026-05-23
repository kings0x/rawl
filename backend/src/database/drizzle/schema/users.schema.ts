import { boolean, integer, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";

import { premiumTierEnum } from "./enums.js";

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
