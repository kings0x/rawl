import { and, eq, sql } from "drizzle-orm";

import { db } from "../../shared/config/database.js";
import { meToos, pains } from "../../database/drizzle/schema/index.js";
import { enqueueNotificationJob } from "../../workers/bullmq/jobs/send-notification.job.js";

export class SelfMeTooError extends Error {
  override name = "SelfMeTooError";
}

export const getMeTooCount = async (painId: string) => {
  const rows = await db.select({ count: pains.meTooCount }).from(pains).where(eq(pains.id, painId)).limit(1);
  return rows[0]?.count ?? 0;
};

export const hasUserMeToo = async (input: { userId: string; painId: string }) => {
  const rows = await db
    .select({ id: meToos.id })
    .from(meToos)
    .where(and(eq(meToos.userId, input.userId), eq(meToos.painId, input.painId)))
    .limit(1);

  return rows.length > 0;
};

export const addMeToo = async (input: { userId: string; painId: string; painAuthorId: string }) => {
  if (input.userId === input.painAuthorId) {
    throw new SelfMeTooError("Users cannot Me Too their own pain");
  }

  return db.transaction(async (tx) => {
    const [created] = await tx
      .insert(meToos)
      .values({
        userId: input.userId,
        painId: input.painId,
      })
      .returning();

    if (!created) {
      throw new Error("Failed to create Me Too");
    }

    await tx
      .update(pains)
      .set({
        meTooCount: sql`${pains.meTooCount} + 1`,
      })
      .where(eq(pains.id, input.painId));

    void Promise.resolve(
      enqueueNotificationJob({
        type: "ME_TOO",
        userId: input.painAuthorId,
        payload: {
          painId: input.painId,
          actorUserId: input.userId,
        },
      }),
    ).catch(() => undefined);

    return created;
  });
};

export const removeMeToo = async (input: { userId: string; painId: string }) => {
  return db.transaction(async (tx) => {
    const [deleted] = await tx
      .delete(meToos)
      .where(and(eq(meToos.userId, input.userId), eq(meToos.painId, input.painId)))
      .returning();

    if (!deleted) {
      return null;
    }

    await tx
      .update(pains)
      .set({
        meTooCount: sql`${pains.meTooCount} - 1`,
      })
      .where(eq(pains.id, input.painId));

    return deleted;
  });
};
