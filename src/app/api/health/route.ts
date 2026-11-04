import { sql } from "drizzle-orm";
import { connection, NextResponse } from "next/server";

import { db } from "@/server/db/client";
import { logger } from "@/server/logger";

/** Uptime monitors and post-deploy smoke tests call this (Z-32). No details leak out. */
export async function GET() {
  await connection(); // always run at request time, never prerendered
  try {
    await db.execute(sql`select 1`);
    return NextResponse.json({ status: "ok" }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    logger.error("health.db_unreachable", { error: String(error) });
    return NextResponse.json(
      { status: "error" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
