import type { FastifyPluginCallback } from "fastify";

import { authenticate } from "../../shared/middleware/authenticate.js";
import { verifyAccessToken } from "../../shared/security/tokens.js";
import { findPainById } from "../pains/pains.service.js";
import { painIdSchema } from "./metoo.schema.js";
import { addMeToo, getMeTooCount, hasUserMeToo, removeMeToo, SelfMeTooError } from "./metoo.service.js";

const getCurrentUserId = (authorizationHeader?: string) => {
  if (!authorizationHeader?.startsWith("Bearer ")) {
    return null;
  }

  try {
    const claims = verifyAccessToken(authorizationHeader.slice("Bearer ".length));
    return claims.sub;
  } catch {
    return null;
  }
};

export const metooRoutes: FastifyPluginCallback = (app, _options, done) => {
  app.post(
    "/pains/:id/metoo",
    {
      preHandler: authenticate,
    },
    async (request, reply) => {
      const params = painIdSchema.safeParse(request.params);

      if (!params.success) {
        return reply.code(422).send({
          error: "Validation error",
          fields: params.error.flatten().fieldErrors,
        });
      }

      const pain = await findPainById(params.data.id);

      if (!pain) {
        return reply.code(404).send({ error: "Pain not found" });
      }

      try {
        await addMeToo({
          userId: request.user!.id,
          painId: pain.id,
          painAuthorId: pain.userId,
        });
      } catch (error) {
        if (error instanceof SelfMeTooError) {
          return reply.code(403).send({ error: "You cannot Me Too your own pain" });
        }

        return reply.code(409).send({ error: "You have already Me Too'd this pain" });
      }

      return reply.code(201).send({
        painId: pain.id,
      });
    },
  );

  app.delete(
    "/pains/:id/metoo",
    {
      preHandler: authenticate,
    },
    async (request, reply) => {
      const params = painIdSchema.safeParse(request.params);

      if (!params.success) {
        return reply.code(422).send({
          error: "Validation error",
          fields: params.error.flatten().fieldErrors,
        });
      }

      const pain = await findPainById(params.data.id);

      if (!pain) {
        return reply.code(404).send({ error: "Pain not found" });
      }

      await removeMeToo({
        userId: request.user!.id,
        painId: pain.id,
      });

      return reply.send({ painId: pain.id });
    },
  );

  app.get("/pains/:id/metoos", async (request, reply) => {
    const params = painIdSchema.safeParse(request.params);

    if (!params.success) {
      return reply.code(422).send({
        error: "Validation error",
        fields: params.error.flatten().fieldErrors,
      });
    }

    const pain = await findPainById(params.data.id);

    if (!pain) {
      return reply.code(404).send({ error: "Pain not found" });
    }

    const currentUserId = getCurrentUserId(request.headers.authorization);

    return reply.send({
      count: await getMeTooCount(pain.id),
      hasMeToo: currentUserId ? await hasUserMeToo({ painId: pain.id, userId: currentUserId }) : false,
    });
  });

  done();
};
