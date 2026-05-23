import {
  boolean,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { categoryEnum, frequencyEnum } from "./enums.js";
import { users } from "./users.schema.js";

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
}, (table) => ({
  painsCreatedAtIdx: index("pains_created_at_idx").on(table.createdAt),
  painsCategoryIdx: index("pains_category_idx").on(table.category),
}));
