-- Panel invitations join the tenant isolation (ADR-0004, plan K-41).
GRANT SELECT, INSERT, UPDATE, DELETE ON "venue_invitations" TO app_rw;--> statement-breakpoint
ALTER TABLE "venue_invitations" FORCE ROW LEVEL SECURITY;
