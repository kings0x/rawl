import argon2 from "argon2";

import { env } from "../../shared/config/env.js";

const hashOptions = {
  type: argon2.argon2id,
  memoryCost: env.ARGON2_MEMORY_COST,
  timeCost: env.ARGON2_TIME_COST,
  parallelism: env.ARGON2_PARALLELISM,
} as const;

export const hashPassword = async (password: string) => argon2.hash(password, hashOptions);

export const verifyPassword = async (hash: string, password: string) => argon2.verify(hash, password);
