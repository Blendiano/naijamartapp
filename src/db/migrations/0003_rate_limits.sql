CREATE TABLE "rate_limits" (
	"id" text PRIMARY KEY NOT NULL,
	"scope" text NOT NULL,
	"counter_key" text NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"window_started_at" timestamp NOT NULL,
	"window_expires_at" timestamp NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "rate_limits_expires_idx" ON "rate_limits" USING btree ("window_expires_at");--> statement-breakpoint
CREATE INDEX "rate_limits_scope_key_idx" ON "rate_limits" USING btree ("scope","counter_key");