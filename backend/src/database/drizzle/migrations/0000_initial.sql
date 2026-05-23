CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "email" varchar(320) NOT NULL,
  "password_hash" text,
  "display_name" varchar(120),
  "is_anonymous_default" boolean DEFAULT false NOT NULL,
  "is_premium" boolean DEFAULT false NOT NULL,
  "premium_tier" "premium_tier",
  "premium_expires_at" timestamp with time zone,
  "insight_score" integer DEFAULT 0 NOT NULL,
  "is_contactable" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "users_email_idx" ON "users" USING btree ("email");

CREATE TABLE IF NOT EXISTS "sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users" ("id") ON DELETE cascade,
  "refresh_token" text NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "sessions_refresh_token_idx" ON "sessions" USING btree ("refresh_token");
