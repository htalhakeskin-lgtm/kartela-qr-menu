CREATE TABLE "item_prices" (
	"id" uuid PRIMARY KEY NOT NULL,
	"venue_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"unit" text DEFAULT 'portion' NOT NULL,
	"label" jsonb,
	"amount_minor" bigint NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ux_item_prices_venue_id_id" UNIQUE("venue_id","id"),
	CONSTRAINT "ck_item_prices_unit" CHECK ("item_prices"."unit" in ('portion', 'size', 'half', 'per_100g', 'per_kg', 'glass', 'bottle', 'piece')),
	CONSTRAINT "ck_item_prices_amount" CHECK ("item_prices"."amount_minor" >= 0),
	CONSTRAINT "ck_item_prices_label" CHECK ("item_prices"."label" is null or coalesce(length(trim("item_prices"."label" ->> 'tr')), 0) > 0)
);
--> statement-breakpoint
ALTER TABLE "item_prices" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "items" (
	"id" uuid PRIMARY KEY NOT NULL,
	"venue_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"kind" text DEFAULT 'dish' NOT NULL,
	"name" jsonb NOT NULL,
	"description" jsonb,
	"ingredients" jsonb,
	"allergens" text[] DEFAULT '{}'::text[] NOT NULL,
	"may_contain" text[] DEFAULT '{}'::text[] NOT NULL,
	"diets" text[] DEFAULT '{}'::text[] NOT NULL,
	"spice_level" smallint DEFAULT 0 NOT NULL,
	"energy_kcal" integer,
	"nutrition" jsonb,
	"portion_g" integer,
	"volume_ml" integer,
	"origin" jsonb,
	"attributes" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"alcohol" jsonb,
	"image_id" uuid,
	"status" text DEFAULT 'published' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ux_items_venue_id_id" UNIQUE("venue_id","id"),
	CONSTRAINT "ck_items_kind" CHECK ("items"."kind" in ('dish', 'drink', 'bean', 'set', 'tasting')),
	CONSTRAINT "ck_items_status" CHECK ("items"."status" in ('draft', 'published', 'archived')),
	CONSTRAINT "ck_items_name" CHECK (coalesce(length(trim("items"."name" ->> 'tr')), 0) > 0),
	CONSTRAINT "ck_items_description" CHECK ("items"."description" is null or coalesce(length(trim("items"."description" ->> 'tr')), 0) > 0),
	CONSTRAINT "ck_items_ingredients" CHECK ("items"."ingredients" is null or coalesce(length(trim("items"."ingredients" ->> 'tr')), 0) > 0),
	CONSTRAINT "ck_items_allergens" CHECK ("items"."allergens" <@ array['gluten', 'crustaceans', 'eggs', 'fish', 'peanuts', 'soy', 'milk', 'nuts', 'celery', 'mustard', 'sesame', 'sulphites', 'lupin', 'molluscs']::text[]),
	CONSTRAINT "ck_items_may_contain" CHECK ("items"."may_contain" <@ array['gluten', 'crustaceans', 'eggs', 'fish', 'peanuts', 'soy', 'milk', 'nuts', 'celery', 'mustard', 'sesame', 'sulphites', 'lupin', 'molluscs']::text[]),
	CONSTRAINT "ck_items_diets" CHECK ("items"."diets" <@ array['vegan', 'vegetarian', 'gluten_free', 'lactose_free', 'halal']::text[]),
	CONSTRAINT "ck_items_spice_level" CHECK ("items"."spice_level" between 0 and 3),
	CONSTRAINT "ck_items_amounts" CHECK (coalesce("items"."energy_kcal", 0) >= 0 and coalesce("items"."portion_g", 0) >= 0 and coalesce("items"."volume_ml", 0) >= 0)
);
--> statement-breakpoint
ALTER TABLE "items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "menu_sections" (
	"id" uuid PRIMARY KEY NOT NULL,
	"venue_id" uuid NOT NULL,
	"menu_id" uuid NOT NULL,
	"parent_id" uuid,
	"name" jsonb NOT NULL,
	"description" jsonb,
	"layout_hint" text,
	"sort" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ux_menu_sections_venue_id_id" UNIQUE("venue_id","id"),
	CONSTRAINT "ck_menu_sections_name" CHECK (coalesce(length(trim("menu_sections"."name" ->> 'tr')), 0) > 0),
	CONSTRAINT "ck_menu_sections_description" CHECK ("menu_sections"."description" is null or coalesce(length(trim("menu_sections"."description" ->> 'tr')), 0) > 0),
	CONSTRAINT "ck_menu_sections_not_own_parent" CHECK ("menu_sections"."parent_id" is distinct from "menu_sections"."id")
);
--> statement-breakpoint
ALTER TABLE "menu_sections" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "menus" (
	"id" uuid PRIMARY KEY NOT NULL,
	"venue_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"name" jsonb NOT NULL,
	"kind" text DEFAULT 'all_day' NOT NULL,
	"schedule" jsonb,
	"outside_window" text DEFAULT 'dim' NOT NULL,
	"access" text DEFAULT 'public' NOT NULL,
	"password_hash" text,
	"contexts" text[] DEFAULT '{}'::text[] NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ux_menus_venue_id_id" UNIQUE("venue_id","id"),
	CONSTRAINT "ck_menus_name" CHECK (coalesce(length(trim("menus"."name" ->> 'tr')), 0) > 0),
	CONSTRAINT "ck_menus_kind" CHECK ("menus"."kind" in ('all_day', 'breakfast', 'lunch', 'evening', 'night', 'daily', 'tasting', 'drinks')),
	CONSTRAINT "ck_menus_outside_window" CHECK ("menus"."outside_window" in ('dim', 'hide')),
	CONSTRAINT "ck_menus_access" CHECK (("menus"."access" = 'public' and "menus"."password_hash" is null) or ("menus"."access" = 'password' and "menus"."password_hash" is not null))
);
--> statement-breakpoint
ALTER TABLE "menus" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "section_items" (
	"id" uuid PRIMARY KEY NOT NULL,
	"venue_id" uuid NOT NULL,
	"section_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ux_section_items_venue_id_id" UNIQUE("venue_id","id")
);
--> statement-breakpoint
ALTER TABLE "section_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "item_prices" ADD CONSTRAINT "item_prices_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_prices" ADD CONSTRAINT "fk_item_prices_item" FOREIGN KEY ("venue_id","item_id") REFERENCES "public"."items"("venue_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_sections" ADD CONSTRAINT "menu_sections_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_sections" ADD CONSTRAINT "fk_menu_sections_menu" FOREIGN KEY ("venue_id","menu_id") REFERENCES "public"."menus"("venue_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_sections" ADD CONSTRAINT "fk_menu_sections_parent" FOREIGN KEY ("venue_id","parent_id") REFERENCES "public"."menu_sections"("venue_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menus" ADD CONSTRAINT "menus_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "section_items" ADD CONSTRAINT "section_items_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "section_items" ADD CONSTRAINT "fk_section_items_section" FOREIGN KEY ("venue_id","section_id") REFERENCES "public"."menu_sections"("venue_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "section_items" ADD CONSTRAINT "fk_section_items_item" FOREIGN KEY ("venue_id","item_id") REFERENCES "public"."items"("venue_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ix_item_prices_item" ON "item_prices" USING btree ("venue_id","item_id","sort");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_item_prices_default" ON "item_prices" USING btree ("item_id") WHERE "item_prices"."is_default";--> statement-breakpoint
CREATE UNIQUE INDEX "ux_items_venue_slug" ON "items" USING btree ("venue_id","slug");--> statement-breakpoint
CREATE INDEX "ix_menu_sections_menu" ON "menu_sections" USING btree ("venue_id","menu_id","sort");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_menus_venue_slug" ON "menus" USING btree ("venue_id","slug");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_section_items_section_item" ON "section_items" USING btree ("section_id","item_id");--> statement-breakpoint
CREATE INDEX "ix_section_items_item" ON "section_items" USING btree ("venue_id","item_id");--> statement-breakpoint
CREATE POLICY "item_prices_tenant_isolation" ON "item_prices" AS PERMISSIVE FOR ALL TO public USING ("item_prices"."venue_id" = nullif(current_setting('app.venue_id', true), '')::uuid or current_setting('app.platform', true) = 'on') WITH CHECK ("item_prices"."venue_id" = nullif(current_setting('app.venue_id', true), '')::uuid or current_setting('app.platform', true) = 'on');--> statement-breakpoint
CREATE POLICY "items_tenant_isolation" ON "items" AS PERMISSIVE FOR ALL TO public USING ("items"."venue_id" = nullif(current_setting('app.venue_id', true), '')::uuid or current_setting('app.platform', true) = 'on') WITH CHECK ("items"."venue_id" = nullif(current_setting('app.venue_id', true), '')::uuid or current_setting('app.platform', true) = 'on');--> statement-breakpoint
CREATE POLICY "menu_sections_tenant_isolation" ON "menu_sections" AS PERMISSIVE FOR ALL TO public USING ("menu_sections"."venue_id" = nullif(current_setting('app.venue_id', true), '')::uuid or current_setting('app.platform', true) = 'on') WITH CHECK ("menu_sections"."venue_id" = nullif(current_setting('app.venue_id', true), '')::uuid or current_setting('app.platform', true) = 'on');--> statement-breakpoint
CREATE POLICY "menus_tenant_isolation" ON "menus" AS PERMISSIVE FOR ALL TO public USING ("menus"."venue_id" = nullif(current_setting('app.venue_id', true), '')::uuid or current_setting('app.platform', true) = 'on') WITH CHECK ("menus"."venue_id" = nullif(current_setting('app.venue_id', true), '')::uuid or current_setting('app.platform', true) = 'on');--> statement-breakpoint
CREATE POLICY "section_items_tenant_isolation" ON "section_items" AS PERMISSIVE FOR ALL TO public USING ("section_items"."venue_id" = nullif(current_setting('app.venue_id', true), '')::uuid or current_setting('app.platform', true) = 'on') WITH CHECK ("section_items"."venue_id" = nullif(current_setting('app.venue_id', true), '')::uuid or current_setting('app.platform', true) = 'on');