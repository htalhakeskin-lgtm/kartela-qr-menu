import { sql } from "drizzle-orm";
import { connection, NextResponse } from "next/server";

import { registryVersion, venues } from "@/platform/tenant/registry";
import { db } from "@/server/db/client";
import { tenantIsolationHolds } from "@/server/db/tenant";
import { logger } from "@/server/logger";

/**
 * Uptime monitors and post-deploy smoke tests call this (Z-32). Besides the database it reports
 * which venue map this deploy carries (ADR-0002): after binding a domain, the new fingerprint
 * shows the redeploy is live, and whether tenant isolation is in place (ADR-0004: the app role
 * exists, and without a venue scope it sees no tenant row). No details leak out.
 */
export async function GET() {
  await connection(); // always run at request time, never prerendered
  const map = { venues: venues.length, version: registryVersion };
  try {
    await db.execute(sql`select 1`);
    if (!(await tenantIsolationHolds())) throw new Error("tenant rows visible without a scope");
    return NextResponse.json(
      { status: "ok", map, tenant: "isolated" },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    logger.error("health.db_unreachable", { error: String(error) });
    return NextResponse.json(
      { status: "error", map },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
