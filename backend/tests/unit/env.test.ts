import { describe, expect, it } from "vitest";

import { buildEnv } from "../../src/shared/config/env.js";

const validEnv = {
  NODE_ENV: "test",
  PORT: "3000",
  PROMETHEUS_PORT: "9090",
  DATABASE_URL: "postgresql://rawl:rawl@localhost:5432/rawl",
  REDIS_URL: "redis://localhost:6379",
  JWT_ACCESS_SECRET: "access",
  JWT_REFRESH_SECRET: "refresh",
  JWT_ACCESS_EXPIRES_IN: "15m",
  JWT_REFRESH_EXPIRES_IN: "30d",
  ARGON2_MEMORY_COST: "65536",
  ARGON2_TIME_COST: "3",
  ARGON2_PARALLELISM: "4",
  FRONTEND_URL: "http://localhost:3001",
  BACKEND_URL: "http://localhost:3000",
};

describe("buildEnv", () => {
  it("throws when required variables are missing", () => {
    expect(() => buildEnv({ NODE_ENV: "test" })).toThrow(/DATABASE_URL: Required/);
  });

  it("parses valid environment variables", () => {
    expect(buildEnv(validEnv)).toMatchObject({
      PORT: 3000,
      NODE_ENV: "test",
      DATABASE_URL: validEnv.DATABASE_URL,
    });
  });
});
