import "server-only";

import { type TenantTx, withPlatform, withVenue } from "./scope";
import { auditLogs, demoOutbox } from "./tables";

/**
 * Writes to the append-only records (demo outbox, audit log) in the right scope: the venue's own
 * when venueId is set, the platform scope otherwise (row level security, ADR-0004).
 */
export type DemoOutboxEntry = Omit<typeof demoOutbox.$inferInsert, "id" | "createdAt">;
export type AuditEntry = Omit<typeof auditLogs.$inferInsert, "id" | "createdAt">;

export async function saveToDemoOutbox(entry: DemoOutboxEntry): Promise<void> {
  const write = async (tx: TenantTx) => {
    await tx.insert(demoOutbox).values(entry);
  };
  await (entry.venueId ? withVenue(entry.venueId, write) : withPlatform(write));
}

/** Inside a running scope (a venueAction handler's tx): the row joins the action's transaction. */
export async function recordAudit(tx: TenantTx, entry: AuditEntry): Promise<void> {
  await tx.insert(auditLogs).values(entry);
}
