import { db } from "../../shared/config/database.js";
import { and, desc, eq } from "drizzle-orm";

import { pains, type pains as painsTable } from "../../database/drizzle/schema/index.js";

type PainRecord = typeof painsTable.$inferSelect & {
  commentCount?: number;
};

export type PublicPain = Omit<PainRecord, "userId"> & {
  userId?: string;
  commentCount: number;
};

export const createPain = async (input: {
  userId: string;
  rawDescription: string;
  frequency: "DAILY" | "FEW_TIMES_WEEK" | "MONTHLY" | "FEW_TIMES_YEAR" | "CONSTANTLY";
  workaround: string;
  wtpEstimate?: number;
  category: "WORK" | "HEALTH" | "FINANCE" | "PARENTING" | "HOME" | "LEARNING" | "OTHER";
  country?: string;
  isAnonymous?: boolean;
}) => {
  const [pain] = await db
    .insert(pains)
    .values({
      userId: input.userId,
      rawDescription: input.rawDescription,
      frequency: input.frequency,
      workaround: input.workaround,
      wtpEstimate: input.wtpEstimate,
      category: input.category,
      country: input.country,
      isAnonymous: input.isAnonymous ?? false,
      opportunityScore: "0",
      meTooCount: 0,
      subscriberCount: 0,
    })
    .returning();

  if (!pain) {
    throw new Error("Failed to create pain");
  }

  return pain;
};

export const toPublicPain = (pain: PainRecord): PublicPain => {
  const { userId, commentCount, ...publicPain } = pain;

  return {
    ...publicPain,
    ...(pain.isAnonymous ? {} : { userId }),
    commentCount: commentCount ?? 0,
  };
};

export const findPainById = async (painId: string) => {
  const rows = await db.select().from(pains).where(eq(pains.id, painId)).limit(1);
  return rows[0] ?? null;
};

export const listPains = async (input: {
  category?: "WORK" | "HEALTH" | "FINANCE" | "PARENTING" | "HOME" | "LEARNING" | "OTHER";
  sort: "recent" | "popular";
  page: number;
  limit: number;
}) => {
  const whereClauses = [];

  if (input.category) {
    whereClauses.push(eq(pains.category, input.category));
  }

  const offset = (input.page - 1) * input.limit;
  const orderBy =
    input.sort === "popular"
      ? [desc(pains.meTooCount), desc(pains.createdAt)]
      : [desc(pains.createdAt)];

  const rows = await db
    .select()
    .from(pains)
    .where(whereClauses.length > 0 ? and(...whereClauses) : undefined)
    .orderBy(...orderBy)
    .limit(input.limit)
    .offset(offset);

  return rows;
};
