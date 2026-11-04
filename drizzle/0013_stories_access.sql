-- Keşfet tables join the tenant isolation (ADR-0004, plan K-41).
GRANT SELECT, INSERT, UPDATE, DELETE ON "stories", "story_items" TO app_rw;--> statement-breakpoint
ALTER TABLE "stories" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "story_items" FORCE ROW LEVEL SECURITY;
