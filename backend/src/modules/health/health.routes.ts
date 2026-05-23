import type { FastifyPluginCallback } from "fastify";

import { metricsRegistry } from "../../shared/config/metrics.js";

type HealthRoutesOptions = {
  buildTimestamp?: () => string;
};

export const healthRoutes: FastifyPluginCallback<HealthRoutesOptions> = (app, options, done) => {
  const timestamp = options.buildTimestamp ?? (() => new Date().toISOString());

  app.get("/health", () => ({
    status: "ok",
    timestamp: timestamp(),
  }));

  app.get("/metrics", (_request, reply) => {
    reply.header("Content-Type", metricsRegistry.contentType);
    return metricsRegistry.metrics();
  });

  done();
};
