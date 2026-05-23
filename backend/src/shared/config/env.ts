import { config as loadDotEnv } from "dotenv";
import { z } from "zod";

loadDotEnv();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "staging", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  PROMETHEUS_PORT: z.coerce.number().int().min(1).max(65535).default(9090),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  TEST_DATABASE_URL: z.string().min(1).optional(),
  REDIS_URL: z.string().min(1, "REDIS_URL is required"),
  TEST_REDIS_URL: z.string().min(1).optional(),
  JWT_ACCESS_SECRET: z.string().min(1, "JWT_ACCESS_SECRET is required"),
  JWT_REFRESH_SECRET: z.string().min(1, "JWT_REFRESH_SECRET is required"),
  JWT_ACCESS_EXPIRES_IN: z.string().min(1, "JWT_ACCESS_EXPIRES_IN is required"),
  JWT_REFRESH_EXPIRES_IN: z.string().min(1, "JWT_REFRESH_EXPIRES_IN is required"),
  ARGON2_MEMORY_COST: z.coerce.number().int().positive(),
  ARGON2_TIME_COST: z.coerce.number().int().positive(),
  ARGON2_PARALLELISM: z.coerce.number().int().positive(),
  FRONTEND_URL: z.string().url("FRONTEND_URL must be a valid URL"),
  BACKEND_URL: z.string().url("BACKEND_URL must be a valid URL"),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().url().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_BUILDER_PRICE_ID: z.string().optional(),
  STRIPE_INTELLIGENCE_PRICE_ID: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_EMBEDDING_MODEL: z.string().optional(),
  GRAFANA_URL: z.string().url().optional(),
  LOKI_URL: z.string().url().optional(),
  LOKI_USER: z.string().optional(),
  GRAFANA_API_KEY: z.string().optional(),
});

export type AppEnv = z.infer<typeof envSchema>;
type EnvSource = Record<string, string | undefined>;

export const buildEnv = (source: EnvSource): AppEnv => {
  const result = envSchema.safeParse(source);

  if (!result.success) {
    const errors = result.error.issues
      .map((issue) => `${issue.path.join(".") || "env"}: ${issue.message}`)
      .join("; ");

    throw new Error(`Environment validation failed: ${errors}`);
  }

  return result.data;
};

export const env = buildEnv(process.env);
