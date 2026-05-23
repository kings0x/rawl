import type { FastifyPluginCallback } from "fastify";

import { authenticate } from "../../shared/middleware/authenticate.js";
import { findPainById } from "../pains/pains.service.js";
import { commentBodySchema, commentIdSchema, commentListQuerySchema } from "./comments.schema.js";
import {
  checkCommentOwnership,
  createComment,
  deleteComment,
  listComments,
  toPublicComment,
} from "./comments.service.js";

export const commentRoutes: FastifyPluginCallback = (app, _options, done) => {
  app.post(
    "/pains/:id/comments",
    {
      preHandler: authenticate,
    },
    async (request, reply) => {
      const params = commentIdSchema.safeParse(request.params);
      const body = commentBodySchema.safeParse(request.body);

      if (!params.success || !body.success) {
        return reply.code(422).send({
          error: "Validation error",
          fields: {
            ...(params.success ? {} : params.error.flatten().fieldErrors),
            ...(body.success ? {} : body.error.flatten().fieldErrors),
          },
        });
      }

      const pain = await findPainById(params.data.id);

      if (!pain) {
        return reply.code(404).send({ error: "Pain not found" });
      }

      const comment = await createComment({
        userId: request.user!.id,
        painId: pain.id,
        painAuthorId: pain.userId,
        body: body.data.body,
      });

      return reply.code(201).send({
        comment: toPublicComment(comment, pain.isAnonymous),
      });
    },
  );

  app.get("/pains/:id/comments", async (request, reply) => {
    const params = commentIdSchema.safeParse(request.params);
    const query = commentListQuerySchema.safeParse(request.query);

    if (!params.success || !query.success) {
      return reply.code(422).send({
        error: "Validation error",
        fields: {
          ...(params.success ? {} : params.error.flatten().fieldErrors),
          ...(query.success ? {} : query.error.flatten().fieldErrors),
        },
      });
    }

    const pain = await findPainById(params.data.id);

    if (!pain) {
      return reply.code(404).send({ error: "Pain not found" });
    }

    const rows = await listComments({
      painId: pain.id,
      page: query.data.page,
      limit: query.data.limit,
    });

    return reply.send({
      comments: rows.map((comment) => toPublicComment(comment, pain.isAnonymous)),
      page: query.data.page,
      limit: query.data.limit,
    });
  });

  app.delete(
    "/comments/:id",
    {
      preHandler: authenticate,
    },
    async (request, reply) => {
      const params = commentIdSchema.safeParse(request.params);

      if (!params.success) {
        return reply.code(422).send({
          error: "Validation error",
          fields: params.error.flatten().fieldErrors,
        });
      }

      const ownership = await checkCommentOwnership({
        commentId: params.data.id,
        userId: request.user!.id,
      });

      if (ownership.status === "not_found") {
        return reply.code(404).send({ error: "Comment not found" });
      }

      if (ownership.status === "forbidden") {
        return reply.code(403).send({ error: "Forbidden" });
      }

      const deleted = await deleteComment({
        commentId: params.data.id,
      });

      if (!deleted) {
        return reply.code(404).send({ error: "Comment not found" });
      }

      return reply.send({
        comment: toPublicComment(deleted, false),
      });
    },
  );

  done();
};
