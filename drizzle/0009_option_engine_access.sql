-- Option engine tables join the tenant isolation (ADR-0004, plan K-41).
GRANT SELECT, INSERT, UPDATE, DELETE ON "option_groups", "options", "item_option_groups", "option_rules" TO app_rw;--> statement-breakpoint
ALTER TABLE "option_groups" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "options" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "item_option_groups" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "option_rules" FORCE ROW LEVEL SECURITY;
