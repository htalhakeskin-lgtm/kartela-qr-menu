CREATE TABLE "stories" (
	"id" uuid PRIMARY KEY NOT NULL,
	"venue_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"kind" text NOT NULL,
	"collection" text,
	"chapter_no" smallint,
	"title" jsonb NOT NULL,
	"summary" jsonb,
	"body_md" jsonb NOT NULL,
	"cover_id" uuid,
	"gallery_ids" uuid[] DEFAULT '{}'::uuid[] NOT NULL,
	"status" text DEFAULT 'published' NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ux_stories_venue_id_id" UNIQUE("venue_id","id"),
	CONSTRAINT "ck_stories_kind" CHECK ("stories"."kind" in ('item_story', 'chef_note', 'supplier', 'chapter', 'guide')),
	CONSTRAINT "ck_stories_status" CHECK ("stories"."status" in ('draft', 'published', 'archived')),
	CONSTRAINT "ck_stories_title" CHECK (coalesce(length(trim("stories"."title" ->> 'tr')), 0) > 0),
	CONSTRAINT "ck_stories_summary" CHECK ("stories"."summary" is null or coalesce(length(trim("stories"."summary" ->> 'tr')), 0) > 0),
	CONSTRAINT "ck_stories_body" CHECK (coalesce(length(trim("stories"."body_md" ->> 'tr')), 0) > 0),
	CONSTRAINT "ck_stories_stop" CHECK ("stories"."chapter_no" is null or ("stories"."collection" is not null and "stories"."chapter_no" >= 1))
);
--> statement-breakpoint
ALTER TABLE "stories" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "story_items" (
	"id" uuid PRIMARY KEY NOT NULL,
	"venue_id" uuid NOT NULL,
	"story_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ux_story_items_venue_id_id" UNIQUE("venue_id","id")
);
--> statement-breakpoint
ALTER TABLE "story_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "stories" ADD CONSTRAINT "stories_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stories" ADD CONSTRAINT "fk_stories_cover" FOREIGN KEY ("venue_id","cover_id") REFERENCES "public"."media_assets"("venue_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_items" ADD CONSTRAINT "story_items_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_items" ADD CONSTRAINT "fk_story_items_story" FOREIGN KEY ("venue_id","story_id") REFERENCES "public"."stories"("venue_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_items" ADD CONSTRAINT "fk_story_items_item" FOREIGN KEY ("venue_id","item_id") REFERENCES "public"."items"("venue_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ux_stories_venue_slug" ON "stories" USING btree ("venue_id","slug");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_stories_collection_stop" ON "stories" USING btree ("venue_id","collection","chapter_no") WHERE "stories"."collection" is not null and "stories"."chapter_no" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "ux_story_items_story_item" ON "story_items" USING btree ("story_id","item_id");--> statement-breakpoint
CREATE INDEX "ix_story_items_item" ON "story_items" USING btree ("venue_id","item_id");--> statement-breakpoint
CREATE POLICY "stories_tenant_isolation" ON "stories" AS PERMISSIVE FOR ALL TO public USING ("stories"."venue_id" = nullif(current_setting('app.venue_id', true), '')::uuid or current_setting('app.platform', true) = 'on') WITH CHECK ("stories"."venue_id" = nullif(current_setting('app.venue_id', true), '')::uuid or current_setting('app.platform', true) = 'on');--> statement-breakpoint
CREATE POLICY "story_items_tenant_isolation" ON "story_items" AS PERMISSIVE FOR ALL TO public USING ("story_items"."venue_id" = nullif(current_setting('app.venue_id', true), '')::uuid or current_setting('app.platform', true) = 'on') WITH CHECK ("story_items"."venue_id" = nullif(current_setting('app.venue_id', true), '')::uuid or current_setting('app.platform', true) = 'on');