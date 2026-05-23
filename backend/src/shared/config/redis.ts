import RedisModule, { type Redis as RedisClient } from "ioredis";

import { env, type AppEnv } from "./env.js";

let redisClient: RedisClient | null = null;
const RedisCtor = RedisModule as unknown as new (
  url: string,
  options: {
    maxRetriesPerRequest: null;
    enableReadyCheck: boolean;
  },
) => RedisClient;

export const getRedis = (appEnv: AppEnv = env) => {
  redisClient ??= new RedisCtor(appEnv.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
  });

  return redisClient;
};

export const pingRedis = async (appEnv: AppEnv = env) => {
  const client = getRedis(appEnv);
  await client.ping();
};

export const closeRedis = async () => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
};
