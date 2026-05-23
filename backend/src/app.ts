import Fastify from "fastify";
import cookie from "@fastify/cookie";

import { authRoutes } from "./modules/auth/auth.routes.js";
import { healthRoutes } from "./modules/health/health.routes.js";
import { env as defaultEnv, type AppEnv } from "./shared/config/env.js";
import { createLogger } from "./shared/config/logger.js";

type BuildAppOptions = {
  env?: AppEnv;
  logger?: boolean;
};

export const buildApp = async (options: BuildAppOptions = {}) => {
  const appEnv = options.env ?? defaultEnv;

  const app = Fastify({
    logger: options.logger === false ? false : createLogger(appEnv),
  });

  await app.register(cookie);
  await app.register(healthRoutes);
  await app.register(authRoutes, { prefix: "/api/v1" });

  return app;
};
