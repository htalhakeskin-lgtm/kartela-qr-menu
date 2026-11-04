-- Availability and relation tables join the tenant isolation (ADR-0004, plan K-41).
GRANT SELECT, INSERT, UPDATE, DELETE ON "item_availability", "daily_menu_entries", "item_relations", "set_components", "tasting_courses" TO app_rw;--> statement-breakpoint
ALTER TABLE "item_availability" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "daily_menu_entries" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "item_relations" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "set_components" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "tasting_courses" FORCE ROW LEVEL SECURITY;
