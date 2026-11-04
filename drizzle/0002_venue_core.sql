CREATE TABLE "venues" (
	"id" uuid PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"kind" text NOT NULL,
	"mode" text DEFAULT 'demo' NOT NULL,
	"theme_id" text NOT NULL,
	"theme_config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"default_locale" text NOT NULL,
	"locales" text[] NOT NULL,
	"timezone" text DEFAULT 'Europe/Istanbul' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ck_venues_kind" CHECK ("venues"."kind" in ('coffee', 'pasta', 'restaurant', 'sushi', 'concept', 'lokanta', 'fish', 'meyhane', 'ocakbasi', 'cocktail_bar', 'bakery', 'breakfast', 'burger', 'beach_bar', 'room_service', 'plant_based')),
	CONSTRAINT "ck_venues_mode" CHECK ("venues"."mode" in ('demo', 'live')),
	CONSTRAINT "ck_venues_status" CHECK ("venues"."status" in ('active', 'archived')),
	CONSTRAINT "ck_venues_default_locale" CHECK ("venues"."default_locale" = any("venues"."locales"))
);
--> statement-breakpoint
CREATE TABLE "venue_domains" (
	"id" uuid PRIMARY KEY NOT NULL,
	"venue_id" uuid NOT NULL,
	"host" text NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ck_venue_domains_status" CHECK ("venue_domains"."status" in ('pending', 'active', 'error'))
);
--> statement-breakpoint
ALTER TABLE "venue_domains" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "venue_members" (
	"id" uuid PRIMARY KEY NOT NULL,
	"venue_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"role" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ck_venue_members_role" CHECK ("venue_members"."role" in ('owner', 'manager', 'staff'))
);
--> statement-breakpoint
ALTER TABLE "venue_members" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "venue_settings" (
	"venue_id" uuid PRIMARY KEY NOT NULL,
	"company" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"contact" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"hours" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"social" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"seo" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"legal" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"features" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "venue_settings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "demo_outbox" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "venue_domains" ADD CONSTRAINT "venue_domains_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venue_members" ADD CONSTRAINT "venue_members_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venue_members" ADD CONSTRAINT "venue_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venue_settings" ADD CONSTRAINT "venue_settings_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ux_venues_slug" ON "venues" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_venue_domains_host" ON "venue_domains" USING btree ("host");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_venue_domains_primary" ON "venue_domains" USING btree ("venue_id") WHERE "venue_domains"."is_primary";--> statement-breakpoint
CREATE UNIQUE INDEX "ux_venue_members_venue_user" ON "venue_members" USING btree ("venue_id","user_id");--> statement-breakpoint
CREATE INDEX "ix_venue_members_user" ON "venue_members" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "demo_outbox" ADD CONSTRAINT "demo_outbox_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "audit_logs_tenant_isolation" ON "audit_logs" AS PERMISSIVE FOR ALL TO public USING ("audit_logs"."venue_id" = nullif(current_setting('app.venue_id', true), '')::uuid or current_setting('app.platform', true) = 'on') WITH CHECK ("audit_logs"."venue_id" = nullif(current_setting('app.venue_id', true), '')::uuid or current_setting('app.platform', true) = 'on');--> statement-breakpoint
CREATE POLICY "demo_outbox_tenant_isolation" ON "demo_outbox" AS PERMISSIVE FOR ALL TO public USING ("demo_outbox"."venue_id" = nullif(current_setting('app.venue_id', true), '')::uuid or current_setting('app.platform', true) = 'on') WITH CHECK ("demo_outbox"."venue_id" = nullif(current_setting('app.venue_id', true), '')::uuid or current_setting('app.platform', true) = 'on');--> statement-breakpoint
CREATE POLICY "venue_domains_tenant_isolation" ON "venue_domains" AS PERMISSIVE FOR ALL TO public USING ("venue_domains"."venue_id" = nullif(current_setting('app.venue_id', true), '')::uuid or current_setting('app.platform', true) = 'on') WITH CHECK ("venue_domains"."venue_id" = nullif(current_setting('app.venue_id', true), '')::uuid or current_setting('app.platform', true) = 'on');--> statement-breakpoint
CREATE POLICY "venue_members_tenant_isolation" ON "venue_members" AS PERMISSIVE FOR ALL TO public USING ("venue_members"."venue_id" = nullif(current_setting('app.venue_id', true), '')::uuid or current_setting('app.platform', true) = 'on') WITH CHECK ("venue_members"."venue_id" = nullif(current_setting('app.venue_id', true), '')::uuid or current_setting('app.platform', true) = 'on');--> statement-breakpoint
CREATE POLICY "venue_settings_tenant_isolation" ON "venue_settings" AS PERMISSIVE FOR ALL TO public USING ("venue_settings"."venue_id" = nullif(current_setting('app.venue_id', true), '')::uuid or current_setting('app.platform', true) = 'on') WITH CHECK ("venue_settings"."venue_id" = nullif(current_setting('app.venue_id', true), '')::uuid or current_setting('app.platform', true) = 'on');