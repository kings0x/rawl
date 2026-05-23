import pino, { type LoggerOptions, type TransportMultiOptions, type TransportTargetOptions } from "pino";

import type { AppEnv } from "./env.js";

const buildTransport = (env: AppEnv): TransportMultiOptions | undefined => {
  if (env.NODE_ENV === "test") {
    return undefined;
  }

  const targets: TransportTargetOptions[] = [];

  if (env.NODE_ENV !== "production") {
    targets.push({
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:standard",
        ignore: "pid,hostname",
      },
    });
  }

  if (env.LOKI_URL) {
    targets.push({
      target: "pino-loki",
      options: {
        batching: true,
        interval: 5,
        host: env.LOKI_URL,
        labels: {
          app: "rawl-backend",
          env: env.NODE_ENV,
        },
        basicAuth: env.LOKI_USER && env.GRAFANA_API_KEY ? `${env.LOKI_USER}:${env.GRAFANA_API_KEY}` : undefined,
      },
    });
  }

  return targets.length > 0 ? { targets } : undefined;
};

export const createLogger = (env: AppEnv) => {
  const options: LoggerOptions = {
    level: env.NODE_ENV === "production" ? "info" : "debug",
  };

  const transport = buildTransport(env);

  return pino({
    ...options,
    ...(transport ? { transport } : {}),
  });
};
