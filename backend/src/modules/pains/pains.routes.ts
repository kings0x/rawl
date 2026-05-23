import type { FastifyPluginCallback } from "fastify";

import { painSchema } from "./pains.schema.js";
import { createPain, toPublicPain } from "./pains.service.js";
import { authenticate } from "../../shared/middleware/authenticate.js";

export const painRoutes: FastifyPluginCallback = (app, _options, done) => {
  app.post(
    "/pains",
    {
      preHandler: authenticate,
    },
    async (request, reply) => {
      const parsed = painSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply.code(422).send({
          error: "Validation error",
          fields: parsed.error.flatten().fieldErrors,
        });
      }

      const pain = await createPain({
        userId: request.user!.id,
        ...parsed.data,
      });

      return reply.code(201).send({
        pain: toPublicPain(pain),
      });
    },
  );

  done();
};
