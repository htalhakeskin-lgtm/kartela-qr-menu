import { sql } from "drizzle-orm";
import { type AnyPgColumn, pgPolicy } from "drizzle-orm/pg-core";

/**
 * Row level security of every tenant table (ADR-0004, layer 3). A row is visible and writable
 * only when its venue_id equals the transaction's app.venue_id, or inside the platform scope
 * (app.platform = on). Both settings are set with set_config(…, true): transaction scoped, so a
 * pooled connection never carries them into the next request (RSK-09). Unset → no rows.
 *
 * The policy applies to every role (`to public`); tables also get FORCE ROW LEVEL SECURITY in the
 * custom migration, so even the table owner is held to it unless it bypasses RLS altogether.
 */
export const VENUE_SETTING = "app.venue_id";
export const PLATFORM_SETTING = "app.platform";

export function tenantPolicy(table: string, venueId: AnyPgColumn) {
  const visible = sql`${venueId} = nullif(current_setting(${sql.raw(`'${VENUE_SETTING}'`)}, true), '')::uuid or current_setting(${sql.raw(`'${PLATFORM_SETTING}'`)}, true) = 'on'`;
  return pgPolicy(`${table}_tenant_isolation`, {
    as: "permissive",
    for: "all",
    using: visible,
    withCheck: visible,
  });
}
