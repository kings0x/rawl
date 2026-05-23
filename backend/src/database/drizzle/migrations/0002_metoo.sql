CREATE TABLE IF NOT EXISTS "me_toos" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users" ("id") ON DELETE cascade,
  "pain_id" uuid NOT NULL REFERENCES "pains" ("id") ON DELETE cascade,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "me_toos_user_pain_idx" ON "me_toos" USING btree ("user_id", "pain_id");
