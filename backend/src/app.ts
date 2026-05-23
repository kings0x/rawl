import Fastify from "fastify";
import cookie from "@fastify/cookie";

import { authRoutes } from "./modules/auth/auth.routes.js";
import { commentRoutes } from "./modules/engagement/comments.routes.js";
import { metooRoutes } from "./modules/engagement/metoo.routes.js";
import { painReadRoutes } from "./modules/pains/pains.read.routes.js";
import { painRoutes } from "./modules/pains/pains.routes.js";
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
  await app.register(painRoutes, { prefix: "/api/v1" });
  await app.register(painReadRoutes, { prefix: "/api/v1" });
  await app.register(metooRoutes, { prefix: "/api/v1" });
  await app.register(commentRoutes, { prefix: "/api/v1" });

  return app;
};
