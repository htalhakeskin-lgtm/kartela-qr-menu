import "server-only";

import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { z } from "zod";

import { pool } from "../client";
import * as platformSchema from "../schema";
import { PLATFORM_SETTING, VENUE_SETTING } from "./policy";
import * as tenantTables from "./tables";

/**
 * Scoped access to tenant tables (ADR-0004, layer 1). Each call is one transaction that first
 * switches to the app_rw role and sets the scope, both with set_config(…, true): they end with the
 * transaction, so a pooled connection never carries them into another request (RSK-09). Inside,
 * row level security shows only the scope's rows, whatever the query forgets to filter.
 */
const APP_ROLE = "app_rw";

const tenantDb = drizzle({
  client: pool,
  schema: { ...platformSchema, ...tenantTables },
  casing: "snake_case",
});

export type TenantTx = Parameters<Parameters<typeof tenantDb.transaction>[0]>[0];

const venueIdSchema = z.uuid();

/** Runs `work` with only this venue's tenant rows visible and writable. */
export async function withVenue<T>(
  venueId: string,
  work: (tx: TenantTx) => Promise<T>,
): Promise<T> {
  const id = venueIdSchema.parse(venueId); // never pass an unchecked value to the cast in the policy
  return tenantDb.transaction(async (tx) => {
    await tx.execute(
      sql`select set_config('role', ${APP_ROLE}, true), set_config(${VENUE_SETTING}, ${id}, true)`,
    );
    return work(tx);
  });
}

/**
 * Runs `work` across all venues: platform admin screens (D-19), the seed, platform-level records
 * (invitations, password resets in the demo outbox). ESLint allows importing it only from
 * src/server/platform/, src/server/db/tenant/, scripts/ and tests/.
 */
export async function withPlatform<T>(work: (tx: TenantTx) => Promise<T>): Promise<T> {
  return tenantDb.transaction(async (tx) => {
    await tx.execute(
      sql`select set_config('role', ${APP_ROLE}, true), set_config(${PLATFORM_SETTING}, 'on', true)`,
    );
    return work(tx);
  });
}

/**
 * For /api/health: the owner can switch to app_rw, and without a scope row level security hides
 * every tenant row. Proves the deploy's migrations (role, grants, policies) without reading data.
 */
export async function tenantIsolationHolds(): Promise<boolean> {
  return tenantDb.transaction(async (tx) => {
    await tx.execute(sql`select set_config('role', ${APP_ROLE}, true)`);
    const result = await tx.execute<{ n: number }>(
      sql`select count(*)::int as n from venue_settings`,
    );
    return result.rows[0]?.n === 0;
  });
}
