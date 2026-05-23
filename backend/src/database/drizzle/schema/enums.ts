import { pgEnum } from "drizzle-orm/pg-core";

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
