CREATE TABLE IF NOT EXISTS "pains" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users" ("id") ON DELETE cascade,
  "raw_description" text NOT NULL,
  "frequency" "frequency" NOT NULL,
  "workaround" text NOT NULL,
  "wtp_estimate" integer,
  "category" "category" NOT NULL,
  "country" varchar(2),
  "is_anonymous" boolean DEFAULT false NOT NULL,
  "is_resolved" boolean DEFAULT false NOT NULL,
  "opportunity_score" numeric(10, 2) DEFAULT '0' NOT NULL,
  "me_too_count" integer DEFAULT 0 NOT NULL,
  "subscriber_count" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "pains_created_at_idx" ON "pains" ("created_at");
CREATE INDEX IF NOT EXISTS "pains_category_idx" ON "pains" ("category");
