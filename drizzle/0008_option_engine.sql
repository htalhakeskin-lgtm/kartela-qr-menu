CREATE TABLE "item_option_groups" (
	"id" uuid PRIMARY KEY NOT NULL,
	"venue_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"group_id" uuid NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"min_override" smallint,
	"max_override" smallint,
	"applies_to_price_ids" uuid[],
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ux_item_option_groups_venue_id_id" UNIQUE("venue_id","id"),
	CONSTRAINT "ck_item_option_groups_limits" CHECK (coalesce("item_option_groups"."min_override", 0) >= 0 and coalesce("item_option_groups"."max_override", 1) >= 1 and coalesce("item_option_groups"."min_override", 0) <= coalesce("item_option_groups"."max_override", 32767))
);
--> statement-breakpoint
ALTER TABLE "item_option_groups" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "option_groups" (
	"id" uuid PRIMARY KEY NOT NULL,
	"venue_id" uuid NOT NULL,
	"key" text NOT NULL,
	"name" jsonb NOT NULL,
	"min_select" smallint DEFAULT 0 NOT NULL,
	"max_select" smallint DEFAULT 1 NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ux_option_groups_venue_id_id" UNIQUE("venue_id","id"),
	CONSTRAINT "ck_option_groups_name" CHECK (coalesce(length(trim("option_groups"."name" ->> 'tr')), 0) > 0),
	CONSTRAINT "ck_option_groups_limits" CHECK ("option_groups"."min_select" >= 0 and "option_groups"."max_select" >= 1 and "option_groups"."min_select" <= "option_groups"."max_select")
);
--> statement-breakpoint
ALTER TABLE "option_groups" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "option_rules" (
	"id" uuid PRIMARY KEY NOT NULL,
	"venue_id" uuid NOT NULL,
	"item_id" uuid,
	"when_option_id" uuid NOT NULL,
	"effect" text NOT NULL,
	"target_option_id" uuid,
	"target_group_id" uuid,
	"message" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ux_option_rules_venue_id_id" UNIQUE("venue_id","id"),
	CONSTRAINT "ck_option_rules_effect" CHECK ("option_rules"."effect" in ('excludes', 'requires')),
	CONSTRAINT "ck_option_rules_one_target" CHECK (("option_rules"."target_option_id" is null) <> ("option_rules"."target_group_id" is null)),
	CONSTRAINT "ck_option_rules_not_self" CHECK ("option_rules"."target_option_id" is distinct from "option_rules"."when_option_id"),
	CONSTRAINT "ck_option_rules_message" CHECK ("option_rules"."message" is null or coalesce(length(trim("option_rules"."message" ->> 'tr')), 0) > 0)
);
--> statement-breakpoint
ALTER TABLE "option_rules" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "options" (
	"id" uuid PRIMARY KEY NOT NULL,
	"venue_id" uuid NOT NULL,
	"group_id" uuid NOT NULL,
	"key" text NOT NULL,
	"name" jsonb NOT NULL,
	"price_delta_minor" bigint DEFAULT 0 NOT NULL,
	"allergens" text[] DEFAULT '{}'::text[] NOT NULL,
	"diets_removed" text[] DEFAULT '{}'::text[] NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"available" boolean DEFAULT true NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ux_options_venue_id_id" UNIQUE("venue_id","id"),
	CONSTRAINT "ck_options_name" CHECK (coalesce(length(trim("options"."name" ->> 'tr')), 0) > 0),
	CONSTRAINT "ck_options_allergens" CHECK ("options"."allergens" <@ array['gluten', 'crustaceans', 'eggs', 'fish', 'peanuts', 'soy', 'milk', 'nuts', 'celery', 'mustard', 'sesame', 'sulphites', 'lupin', 'molluscs']::text[]),
	CONSTRAINT "ck_options_diets_removed" CHECK ("options"."diets_removed" <@ array['vegan', 'vegetarian', 'gluten_free', 'lactose_free', 'halal']::text[])
);
--> statement-breakpoint
ALTER TABLE "options" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "item_option_groups" ADD CONSTRAINT "item_option_groups_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_option_groups" ADD CONSTRAINT "fk_item_option_groups_item" FOREIGN KEY ("venue_id","item_id") REFERENCES "public"."items"("venue_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_option_groups" ADD CONSTRAINT "fk_item_option_groups_group" FOREIGN KEY ("venue_id","group_id") REFERENCES "public"."option_groups"("venue_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "option_groups" ADD CONSTRAINT "option_groups_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "option_rules" ADD CONSTRAINT "option_rules_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "option_rules" ADD CONSTRAINT "fk_option_rules_item" FOREIGN KEY ("venue_id","item_id") REFERENCES "public"."items"("venue_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "option_rules" ADD CONSTRAINT "fk_option_rules_when" FOREIGN KEY ("venue_id","when_option_id") REFERENCES "public"."options"("venue_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "option_rules" ADD CONSTRAINT "fk_option_rules_target_option" FOREIGN KEY ("venue_id","target_option_id") REFERENCES "public"."options"("venue_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "option_rules" ADD CONSTRAINT "fk_option_rules_target_group" FOREIGN KEY ("venue_id","target_group_id") REFERENCES "public"."option_groups"("venue_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "options" ADD CONSTRAINT "options_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "options" ADD CONSTRAINT "fk_options_group" FOREIGN KEY ("venue_id","group_id") REFERENCES "public"."option_groups"("venue_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ux_item_option_groups_item_group" ON "item_option_groups" USING btree ("item_id","group_id");--> statement-breakpoint
CREATE INDEX "ix_item_option_groups_group" ON "item_option_groups" USING btree ("venue_id","group_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_option_groups_venue_key" ON "option_groups" USING btree ("venue_id","key");--> statement-breakpoint
CREATE INDEX "ix_option_rules_when" ON "option_rules" USING btree ("venue_id","when_option_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_options_group_key" ON "options" USING btree ("group_id","key");--> statement-breakpoint
CREATE INDEX "ix_options_group" ON "options" USING btree ("venue_id","group_id","sort");--> statement-breakpoint
CREATE POLICY "item_option_groups_tenant_isolation" ON "item_option_groups" AS PERMISSIVE FOR ALL TO public USING ("item_option_groups"."venue_id" = nullif(current_setting('app.venue_id', true), '')::uuid or current_setting('app.platform', true) = 'on') WITH CHECK ("item_option_groups"."venue_id" = nullif(current_setting('app.venue_id', true), '')::uuid or current_setting('app.platform', true) = 'on');--> statement-breakpoint
CREATE POLICY "option_groups_tenant_isolation" ON "option_groups" AS PERMISSIVE FOR ALL TO public USING ("option_groups"."venue_id" = nullif(current_setting('app.venue_id', true), '')::uuid or current_setting('app.platform', true) = 'on') WITH CHECK ("option_groups"."venue_id" = nullif(current_setting('app.venue_id', true), '')::uuid or current_setting('app.platform', true) = 'on');--> statement-breakpoint
CREATE POLICY "option_rules_tenant_isolation" ON "option_rules" AS PERMISSIVE FOR ALL TO public USING ("option_rules"."venue_id" = nullif(current_setting('app.venue_id', true), '')::uuid or current_setting('app.platform', true) = 'on') WITH CHECK ("option_rules"."venue_id" = nullif(current_setting('app.venue_id', true), '')::uuid or current_setting('app.platform', true) = 'on');--> statement-breakpoint
CREATE POLICY "options_tenant_isolation" ON "options" AS PERMISSIVE FOR ALL TO public USING ("options"."venue_id" = nullif(current_setting('app.venue_id', true), '')::uuid or current_setting('app.platform', true) = 'on') WITH CHECK ("options"."venue_id" = nullif(current_setting('app.venue_id', true), '')::uuid or current_setting('app.platform', true) = 'on');