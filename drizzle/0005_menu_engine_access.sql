-- Menu engine tables join the tenant isolation of D-02 (ADR-0004, plan K-41): the app role
-- reaches them through withVenue only, and the owner is held to the policies as well.
GRANT SELECT, INSERT, UPDATE, DELETE ON "menus", "menu_sections", "section_items", "items", "item_prices" TO app_rw;--> statement-breakpoint
ALTER TABLE "menus" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "menu_sections" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "section_items" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "items" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "item_prices" FORCE ROW LEVEL SECURITY;
