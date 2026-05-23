import { eq } from "drizzle-orm";

import { sessions } from "../../database/drizzle/schema/index.js";
import { db } from "../../shared/config/database.js";
import { getRedis } from "../../shared/config/redis.js";
import { parseDurationToMilliseconds } from "../../shared/utils/parse-duration.js";

const refreshTokenKey = (token: string) => `refresh-token:${token}`;

export const storeRefreshSession = async (input: {
  userId: string;
  refreshToken: string;
  expiresAt: Date;
}) => {
  const redis = getRedis();
  const ttlMs = input.expiresAt.getTime() - Date.now();
  const ttlSeconds = Math.max(1, Math.ceil(ttlMs / 1000));

  await Promise.all([
    db.insert(sessions).values({
      userId: input.userId,
      refreshToken: input.refreshToken,
      expiresAt: input.expiresAt,
    }),
    redis.set(refreshTokenKey(input.refreshToken), input.userId, "EX", ttlSeconds),
  ]);
};

export const hasRefreshSession = async (refreshToken: string) => {
  const redis = getRedis();
  return (await redis.get(refreshTokenKey(refreshToken))) !== null;
};

export const deleteRefreshSession = async (refreshToken: string) => {
  const redis = getRedis();

  await Promise.all([
    db.delete(sessions).where(eq(sessions.refreshToken, refreshToken)),
    redis.multi().del(refreshTokenKey(refreshToken)).exec(),
  ]);
};

export const getRefreshTokenTtlMs = (expiresIn: string) => parseDurationToMilliseconds(expiresIn);
