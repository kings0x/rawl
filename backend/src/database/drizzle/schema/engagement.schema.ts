import { pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { pains } from "./pains.schema.js";
import { users } from "./users.schema.js";

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
