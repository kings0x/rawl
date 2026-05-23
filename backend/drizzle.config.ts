import { defineConfig } from "drizzle-kit";

import { env } from "./src/shared/config/env.js";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/database/drizzle/schema/*.ts",
  out: "./src/database/drizzle/migrations",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
  strict: true,
  verbose: true,
});
