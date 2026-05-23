import type { FastifyPluginCallback } from "fastify";

import { painIdParamSchema, painsListQuerySchema } from "./pains.read.schema.js";
import { findPainById, listPains, toPublicPain } from "./pains.service.js";

export const painReadRoutes: FastifyPluginCallback = (app, _options, done) => {
  app.get("/pains", async (request, reply) => {
    const parsed = painsListQuerySchema.safeParse(request.query);

    if (!parsed.success) {
      return reply.code(422).send({
        error: "Validation error",
        fields: parsed.error.flatten().fieldErrors,
      });
    }

    const pains = await listPains(parsed.data);

    return reply.send({
      pains: pains.map(toPublicPain),
      page: parsed.data.page,
      limit: parsed.data.limit,
    });
  });

  app.get("/pains/:id", async (request, reply) => {
    const params = painIdParamSchema.safeParse(request.params);

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

      return reply.send({
        pain: toPublicPain(pain),
      });
    });

  done();
};
