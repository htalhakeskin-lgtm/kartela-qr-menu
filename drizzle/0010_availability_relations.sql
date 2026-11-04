CREATE TABLE "daily_menu_entries" (
	"id" uuid PRIMARY KEY NOT NULL,
	"venue_id" uuid NOT NULL,
	"menu_id" uuid NOT NULL,
	"on_date" date NOT NULL,
	"item_id" uuid NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ux_daily_menu_entries_venue_id_id" UNIQUE("venue_id","id")
);
--> statement-breakpoint
ALTER TABLE "daily_menu_entries" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "item_availability" (
	"id" uuid PRIMARY KEY NOT NULL,
	"venue_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"sold_out_until" timestamp with time zone,
	"sold_out_indefinitely" boolean DEFAULT false NOT NULL,
	"daily_limit" integer,
	"remaining" integer,
	"remaining_on" date,
	"release_times" time[] DEFAULT '{}'::time[] NOT NULL,
	"seasons" jsonb,
	"outside_season" text DEFAULT 'dim' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ux_item_availability_venue_id_id" UNIQUE("venue_id","id"),
	CONSTRAINT "ck_item_availability_count" CHECK (("item_availability"."daily_limit" is null and "item_availability"."remaining" is null and "item_availability"."remaining_on" is null) or ("item_availability"."daily_limit" is not null and "item_availability"."daily_limit" >= 1 and coalesce("item_availability"."remaining", 0) between 0 and "item_availability"."daily_limit")),
	CONSTRAINT "ck_item_availability_mark" CHECK (not ("item_availability"."sold_out_indefinitely" and "item_availability"."sold_out_until" is not null)),
	CONSTRAINT "ck_item_availability_outside" CHECK ("item_availability"."outside_season" in ('dim', 'hide'))
);
--> statement-breakpoint
ALTER TABLE "item_availability" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "item_relations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"venue_id" uuid NOT NULL,
	"from_item_id" uuid NOT NULL,
	"to_item_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"note" jsonb,
	"sort" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ux_item_relations_venue_id_id" UNIQUE("venue_id","id"),
	CONSTRAINT "ck_item_relations_kind" CHECK ("item_relations"."kind" in ('pairing', 'suggestion')),
	CONSTRAINT "ck_item_relations_not_self" CHECK ("item_relations"."from_item_id" <> "item_relations"."to_item_id"),
	CONSTRAINT "ck_item_relations_note" CHECK ("item_relations"."note" is null or coalesce(length(trim("item_relations"."note" ->> 'tr')), 0) > 0)
);
--> statement-breakpoint
ALTER TABLE "item_relations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "set_components" (
	"id" uuid PRIMARY KEY NOT NULL,
	"venue_id" uuid NOT NULL,
	"set_item_id" uuid NOT NULL,
	"component_item_id" uuid NOT NULL,
	"qty" smallint DEFAULT 1 NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ux_set_components_venue_id_id" UNIQUE("venue_id","id"),
	CONSTRAINT "ck_set_components_qty" CHECK ("set_components"."qty" >= 1),
	CONSTRAINT "ck_set_components_not_self" CHECK ("set_components"."set_item_id" <> "set_components"."component_item_id")
);
--> statement-breakpoint
ALTER TABLE "set_components" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "tasting_courses" (
	"id" uuid PRIMARY KEY NOT NULL,
	"venue_id" uuid NOT NULL,
	"tasting_item_id" uuid NOT NULL,
	"course_no" smallint NOT NULL,
	"title" jsonb NOT NULL,
	"item_id" uuid,
	"description" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ux_tasting_courses_venue_id_id" UNIQUE("venue_id","id"),
	CONSTRAINT "ck_tasting_courses_no" CHECK ("tasting_courses"."course_no" >= 1),
	CONSTRAINT "ck_tasting_courses_title" CHECK (coalesce(length(trim("tasting_courses"."title" ->> 'tr')), 0) > 0),
	CONSTRAINT "ck_tasting_courses_description" CHECK ("tasting_courses"."description" is null or coalesce(length(trim("tasting_courses"."description" ->> 'tr')), 0) > 0)
);
--> statement-breakpoint
ALTER TABLE "tasting_courses" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "daily_menu_entries" ADD CONSTRAINT "daily_menu_entries_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_menu_entries" ADD CONSTRAINT "fk_daily_menu_entries_menu" FOREIGN KEY ("venue_id","menu_id") REFERENCES "public"."menus"("venue_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_menu_entries" ADD CONSTRAINT "fk_daily_menu_entries_item" FOREIGN KEY ("venue_id","item_id") REFERENCES "public"."items"("venue_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_availability" ADD CONSTRAINT "item_availability_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_availability" ADD CONSTRAINT "fk_item_availability_item" FOREIGN KEY ("venue_id","item_id") REFERENCES "public"."items"("venue_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_relations" ADD CONSTRAINT "item_relations_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_relations" ADD CONSTRAINT "fk_item_relations_from" FOREIGN KEY ("venue_id","from_item_id") REFERENCES "public"."items"("venue_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_relations" ADD CONSTRAINT "fk_item_relations_to" FOREIGN KEY ("venue_id","to_item_id") REFERENCES "public"."items"("venue_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "set_components" ADD CONSTRAINT "set_components_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "set_components" ADD CONSTRAINT "fk_set_components_set" FOREIGN KEY ("venue_id","set_item_id") REFERENCES "public"."items"("venue_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "set_components" ADD CONSTRAINT "fk_set_components_component" FOREIGN KEY ("venue_id","component_item_id") REFERENCES "public"."items"("venue_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasting_courses" ADD CONSTRAINT "tasting_courses_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasting_courses" ADD CONSTRAINT "fk_tasting_courses_tasting" FOREIGN KEY ("venue_id","tasting_item_id") REFERENCES "public"."items"("venue_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasting_courses" ADD CONSTRAINT "fk_tasting_courses_item" FOREIGN KEY ("venue_id","item_id") REFERENCES "public"."items"("venue_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ux_daily_menu_entries_day_item" ON "daily_menu_entries" USING btree ("menu_id","on_date","item_id");--> statement-breakpoint
CREATE INDEX "ix_daily_menu_entries_menu_date" ON "daily_menu_entries" USING btree ("venue_id","menu_id","on_date");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_item_availability_item" ON "item_availability" USING btree ("item_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_item_relations_pair" ON "item_relations" USING btree ("from_item_id","to_item_id","kind");--> statement-breakpoint
CREATE INDEX "ix_item_relations_to" ON "item_relations" USING btree ("venue_id","to_item_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_set_components_pair" ON "set_components" USING btree ("set_item_id","component_item_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_tasting_courses_order" ON "tasting_courses" USING btree ("tasting_item_id","course_no");--> statement-breakpoint
CREATE POLICY "daily_menu_entries_tenant_isolation" ON "daily_menu_entries" AS PERMISSIVE FOR ALL TO public USING ("daily_menu_entries"."venue_id" = nullif(current_setting('app.venue_id', true), '')::uuid or current_setting('app.platform', true) = 'on') WITH CHECK ("daily_menu_entries"."venue_id" = nullif(current_setting('app.venue_id', true), '')::uuid or current_setting('app.platform', true) = 'on');--> statement-breakpoint
CREATE POLICY "item_availability_tenant_isolation" ON "item_availability" AS PERMISSIVE FOR ALL TO public USING ("item_availability"."venue_id" = nullif(current_setting('app.venue_id', true), '')::uuid or current_setting('app.platform', true) = 'on') WITH CHECK ("item_availability"."venue_id" = nullif(current_setting('app.venue_id', true), '')::uuid or current_setting('app.platform', true) = 'on');--> statement-breakpoint
CREATE POLICY "item_relations_tenant_isolation" ON "item_relations" AS PERMISSIVE FOR ALL TO public USING ("item_relations"."venue_id" = nullif(current_setting('app.venue_id', true), '')::uuid or current_setting('app.platform', true) = 'on') WITH CHECK ("item_relations"."venue_id" = nullif(current_setting('app.venue_id', true), '')::uuid or current_setting('app.platform', true) = 'on');--> statement-breakpoint
CREATE POLICY "set_components_tenant_isolation" ON "set_components" AS PERMISSIVE FOR ALL TO public USING ("set_components"."venue_id" = nullif(current_setting('app.venue_id', true), '')::uuid or current_setting('app.platform', true) = 'on') WITH CHECK ("set_components"."venue_id" = nullif(current_setting('app.venue_id', true), '')::uuid or current_setting('app.platform', true) = 'on');--> statement-breakpoint
CREATE POLICY "tasting_courses_tenant_isolation" ON "tasting_courses" AS PERMISSIVE FOR ALL TO public USING ("tasting_courses"."venue_id" = nullif(current_setting('app.venue_id', true), '')::uuid or current_setting('app.platform', true) = 'on') WITH CHECK ("tasting_courses"."venue_id" = nullif(current_setting('app.venue_id', true), '')::uuid or current_setting('app.platform', true) = 'on');