ALTER TABLE "venue_settings" ADD COLUMN "faq" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "venue_settings" ADD COLUMN "wifi" jsonb;