import { Queue, type ConnectionOptions } from "bullmq";

import { env, type AppEnv } from "./env.js";

export const queueNames = {
  notification: "notification",
  email: "email",
  ai: "ai",
} as const;

export type QueueName = (typeof queueNames)[keyof typeof queueNames];

export const getQueueConnection = (appEnv: AppEnv = env): ConnectionOptions => {
  const redisUrl = new URL(appEnv.REDIS_URL);

  return {
    host: redisUrl.hostname,
    port: Number(redisUrl.port || "6379"),
    username: redisUrl.username || undefined,
    password: redisUrl.password || undefined,
    db: redisUrl.pathname ? Number(redisUrl.pathname.replace("/", "") || "0") : 0,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  };
};

export const createQueue = <TJobData>(name: QueueName) =>
  new Queue<TJobData, void, string>(name, {
    connection: getQueueConnection(),
    defaultJobOptions: {
      attempts: 3,
      removeOnComplete: 1000,
      removeOnFail: 1000,
    },
  });
