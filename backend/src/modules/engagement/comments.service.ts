import { desc, eq } from "drizzle-orm";

import { db } from "../../shared/config/database.js";
import { comments } from "../../database/drizzle/schema/index.js";
import { enqueueNotificationJob } from "../../workers/bullmq/jobs/send-notification.job.js";

export const createComment = async (input: { userId: string; painId: string; painAuthorId: string; body: string }) => {
  const [comment] = await db
    .insert(comments)
    .values({
      userId: input.userId,
      painId: input.painId,
      body: input.body,
    })
    .returning();

  if (!comment) {
    throw new Error("Failed to create comment");
  }

  void Promise.resolve(
    enqueueNotificationJob({
      type: "COMMENT",
      userId: input.painAuthorId,
      payload: {
        painId: input.painId,
        actorUserId: input.userId,
        commentId: comment.id,
      },
    }),
  ).catch(() => undefined);

  return comment;
};

export const listComments = async (input: { painId: string; page: number; limit: number }) => {
  const offset = (input.page - 1) * input.limit;

  return db
    .select()
    .from(comments)
    .where(eq(comments.painId, input.painId))
    .orderBy(desc(comments.createdAt))
    .limit(input.limit)
    .offset(offset);
};

export type CommentOwnershipCheckResult =
  | { status: "not_found" }
  | { status: "forbidden" }
  | { status: "ok"; comment: Awaited<ReturnType<typeof createComment>> };

export const checkCommentOwnership = async (input: { commentId: string; userId: string }): Promise<CommentOwnershipCheckResult> => {
  const rows = await db.select().from(comments).where(eq(comments.id, input.commentId)).limit(1);
  const comment = rows[0] ?? null;

  if (!comment) {
    return { status: "not_found" };
  }

  if (comment.userId !== input.userId) {
    return { status: "forbidden" };
  }

  return { status: "ok", comment };
};

export const deleteComment = async (input: { commentId: string }) => {
  const [deleted] = await db.delete(comments).where(eq(comments.id, input.commentId)).returning();

  return deleted ?? null;
};

export const toPublicComment = (
  comment: Awaited<ReturnType<typeof createComment>>,
  painIsAnonymous = false,
) => {
  const { userId, ...publicComment } = comment;

  return {
    ...publicComment,
    ...(painIsAnonymous ? {} : { userId }),
  };
};
