import type { FastifyPluginCallback } from "fastify";

import { painSchema, painUpdateSchema } from "./pains.schema.js";
import { painIdParamSchema } from "./pains.read.schema.js";
import {
  checkPainOwnership,
  createPain,
  deletePain,
  toPublicPain,
  updatePain,
} from "./pains.service.js";
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

  app.patch(
    "/pains/:id",
    {
      preHandler: authenticate,
    },
    async (request, reply) => {
      const params = painIdParamSchema.safeParse(request.params);

      if (!params.success) {
        return reply.code(422).send({
          error: "Validation error",
          fields: params.error.flatten().fieldErrors,
        });
      }

      const parsed = painUpdateSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply.code(422).send({
          error: "Validation error",
          fields: parsed.error.flatten().fieldErrors,
        });
      }

      const ownership = await checkPainOwnership(params.data.id, request.user!.id);

      if (ownership.status === "not_found") {
        return reply.code(404).send({ error: "Pain not found" });
      }

      if (ownership.status === "forbidden") {
        return reply.code(403).send({ error: "Forbidden" });
      }

      const updatedPain = await updatePain(params.data.id, parsed.data);

      if (!updatedPain) {
        return reply.code(404).send({ error: "Pain not found" });
      }

      return reply.send({
        pain: toPublicPain(updatedPain),
      });
    },
  );

  app.delete(
    "/pains/:id",
    {
      preHandler: authenticate,
    },
    async (request, reply) => {
      const params = painIdParamSchema.safeParse(request.params);

      if (!params.success) {
        return reply.code(422).send({
          error: "Validation error",
          fields: params.error.flatten().fieldErrors,
        });
      }

      const ownership = await checkPainOwnership(params.data.id, request.user!.id);

      if (ownership.status === "not_found") {
        return reply.code(404).send({ error: "Pain not found" });
      }

      if (ownership.status === "forbidden") {
        return reply.code(403).send({ error: "Forbidden" });
      }

      const deletedPain = await deletePain(params.data.id);

      if (!deletedPain) {
        return reply.code(404).send({ error: "Pain not found" });
      }

      return reply.send({
        pain: toPublicPain(deletedPain),
      });
    },
  );

  done();
};
