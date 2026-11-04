import { index, jsonb, pgTable, text, uuid } from "drizzle-orm/pg-core";

import { createdAt, id } from "../../columns";
import { venues } from "../../schema/venues";
import { tenantPolicy } from "../policy";

/**
 * Append-only records that may belong to a venue (D-02 moved them here from schema/core.ts and
 * added the venue foreign key). venue_id is null for platform-level rows (a domain bound, a panel
 * invitation); those are visible only in the platform scope. Written through
 * src/server/db/tenant/records.ts.
 */

/**
 * Messages that would have been sent in demo (02-mimari §5): panel invitations and password
 * resets while PLATFORM_DEMO=true, and — later — a demo venue's own messages (waiter call, P2).
 */
export const demoOutbox = pgTable(
  "demo_outbox",
  {
    id: id(),
    venueId: uuid().references(() => venues.id, { onDelete: "cascade" }),
    channel: text().notNull(),
    to: text().notNull(),
    template: text().notNull(),
    data: jsonb().$type<Record<string, unknown>>().notNull(),
    relatedId: text(),
    ...createdAt,
  },
  (table) => [
    index("ix_demo_outbox_venue_created_at").on(table.venueId, table.createdAt),
    tenantPolicy("demo_outbox", table.venueId),
  ],
);

/** Who changed what (A-02). A venue with history is never hard-deleted (no cascade). */
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: id(),
    venueId: uuid().references(() => venues.id),
    actorId: text(),
    action: text().notNull(), // availability.sold_out, prices.bulk_apply, platform.domain_bind…
    entity: text(),
    entityId: text(),
    changes: jsonb().$type<Record<string, { from: unknown; to: unknown }>>(),
    ipHash: text(),
    ...createdAt,
  },
  (table) => [
    index("ix_audit_logs_entity").on(table.entity, table.entityId, table.createdAt),
    index("ix_audit_logs_venue_created_at").on(table.venueId, table.createdAt),
    tenantPolicy("audit_logs", table.venueId),
  ],
);
