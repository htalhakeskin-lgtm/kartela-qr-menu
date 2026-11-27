CREATE TABLE "venue_invitations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"venue_id" uuid NOT NULL,
	"email" text NOT NULL,
	"role" text NOT NULL,
	"token_hash" text NOT NULL,
	"invited_by" text,
	"expires_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ck_venue_invitations_role" CHECK ("venue_invitations"."role" in ('owner', 'manager', 'staff'))
);
--> statement-breakpoint
ALTER TABLE "venue_invitations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "venue_invitations" ADD CONSTRAINT "venue_invitations_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venue_invitations" ADD CONSTRAINT "venue_invitations_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ux_venue_invitations_token" ON "venue_invitations" USING btree ("token_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_venue_invitations_open" ON "venue_invitations" USING btree ("venue_id","email") WHERE "venue_invitations"."accepted_at" is null and "venue_invitations"."revoked_at" is null;--> statement-breakpoint
CREATE POLICY "venue_invitations_tenant_isolation" ON "venue_invitations" AS PERMISSIVE FOR ALL TO public USING ("venue_invitations"."venue_id" = nullif(current_setting('app.venue_id', true), '')::uuid or current_setting('app.platform', true) = 'on') WITH CHECK ("venue_invitations"."venue_id" = nullif(current_setting('app.venue_id', true), '')::uuid or current_setting('app.platform', true) = 'on');