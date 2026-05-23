import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "../../database/drizzle/schema/index.js";
import { env, type AppEnv } from "./env.js";

let pool: Pool | null = null;

export const getPool = (appEnv: AppEnv = env) => {
  pool ??= new Pool({
    connectionString: appEnv.DATABASE_URL,
    max: 10,
  });

  return pool;
};

export const db = drizzle(getPool(), { schema });

export const pingDatabase = async (appEnv: AppEnv = env) => {
  const databasePool = getPool(appEnv);
  await databasePool.query("select 1");
};

export const closeDatabase = async () => {
  if (pool) {
    await pool.end();
    pool = null;
  }
};
