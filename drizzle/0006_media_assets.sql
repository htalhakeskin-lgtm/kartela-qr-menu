CREATE TABLE "media_assets" (
	"id" uuid PRIMARY KEY NOT NULL,
	"venue_id" uuid NOT NULL,
	"key" text NOT NULL,
	"source" text NOT NULL,
	"url" text NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"photographer" text,
	"source_page" text,
	"license" text,
	"alt" jsonb NOT NULL,
	"focal_x" smallint DEFAULT 50 NOT NULL,
	"focal_y" smallint DEFAULT 50 NOT NULL,
	"dominant_color" text,
	"variants" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ux_media_assets_venue_id_id" UNIQUE("venue_id","id"),
	CONSTRAINT "ck_media_assets_source" CHECK ("media_assets"."source" in ('unsplash', 'pexels', 'upload')),
	CONSTRAINT "ck_media_assets_size" CHECK ("media_assets"."width" > 0 and "media_assets"."height" > 0),
	CONSTRAINT "ck_media_assets_focal" CHECK ("media_assets"."focal_x" between 0 and 100 and "media_assets"."focal_y" between 0 and 100),
	CONSTRAINT "ck_media_assets_alt" CHECK (coalesce(length(trim("media_assets"."alt" ->> 'tr')), 0) > 0)
);
--> statement-breakpoint
ALTER TABLE "media_assets" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ux_media_assets_venue_key" ON "media_assets" USING btree ("venue_id","key");--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "fk_items_image" FOREIGN KEY ("venue_id","image_id") REFERENCES "public"."media_assets"("venue_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "media_assets_tenant_isolation" ON "media_assets" AS PERMISSIVE FOR ALL TO public USING ("media_assets"."venue_id" = nullif(current_setting('app.venue_id', true), '')::uuid or current_setting('app.platform', true) = 'on') WITH CHECK ("media_assets"."venue_id" = nullif(current_setting('app.venue_id', true), '')::uuid or current_setting('app.platform', true) = 'on');