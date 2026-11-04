-- media_assets joins the tenant isolation (ADR-0004, plan K-41).
GRANT SELECT, INSERT, UPDATE, DELETE ON "media_assets" TO app_rw;--> statement-breakpoint
ALTER TABLE "media_assets" FORCE ROW LEVEL SECURITY;
