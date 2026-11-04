-- Application role for tenant access (ADR-0004, plan D-02). Not a login role: the app keeps its
-- one connection string (the owner role) and switches to app_rw inside each tenant transaction with
-- set_config('role', 'app_rw', true) — transaction scoped, safe with a pooled connection (RSK-09).
-- app_rw does not own the tables and never bypasses row level security.
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'app_rw') THEN
    CREATE ROLE app_rw NOLOGIN NOBYPASSRLS;
  END IF;
END
$$;--> statement-breakpoint
-- The migrating (owner) role must be able to switch to app_rw. PostgreSQL 16+ gives the creator
-- only ADMIN on a role it creates; this grant adds SET. A repeated grant is a notice, not an error.
GRANT app_rw TO CURRENT_USER;--> statement-breakpoint
GRANT USAGE ON SCHEMA public TO app_rw;--> statement-breakpoint
-- Tenant root: read only (slug → id before a venue scope exists).
GRANT SELECT ON "venues" TO app_rw;--> statement-breakpoint
-- Tenant tables: full DML, filtered by the tenant_isolation policies.
GRANT SELECT, INSERT, UPDATE, DELETE ON "venue_domains", "venue_members", "venue_settings", "audit_logs", "demo_outbox" TO app_rw;--> statement-breakpoint
-- The table owner is held to the policies as well (unless it bypasses RLS, e.g. a superuser).
ALTER TABLE "venue_domains" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "venue_members" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "venue_settings" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "audit_logs" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "demo_outbox" FORCE ROW LEVEL SECURITY;
