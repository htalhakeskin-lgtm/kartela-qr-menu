import { timingSafeEqual } from "node:crypto";

import { connection, NextResponse } from "next/server";

import { env } from "@/lib/env";
import { logger } from "@/server/logger";
import { runDayEnd } from "@/server/menu/day-end";

/**
 * Day-end cron (P-01): Vercel Cron calls it at 01:00 UTC = 04:00 Istanbul (vercel.json) with
 * `Authorization: Bearer $CRON_SECRET`. Anything else answers 401 (05-sunucu-ve-api: route
 * handlers only for cron, webhooks, health, auth and files).
 */
function authorized(header: string | null): boolean {
  const expected = Buffer.from(`Bearer ${env.CRON_SECRET}`);
  const given = Buffer.from(header ?? "");
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export async function GET(request: Request) {
  await connection(); // never prerendered
  if (!authorized(request.headers.get("authorization"))) {
    return NextResponse.json(
      { error: "unauthorized" },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }
  try {
    const report = await runDayEnd(new Date());
    logger.info("cron.day_end", { venues: report.venues.length, cleared: report.clearedMarks });
    return NextResponse.json(report, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    logger.error("cron.day_end_failed", { error: String(error) });
    return NextResponse.json(
      { error: "failed" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
