import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/server/db/client";
import { venues } from "@/server/db/schema";
import { clearExpiredSoldOut, withVenue } from "@/server/db/tenant";

import { refreshForNewDay } from "./cache";

export type DayEndReport = {
  /** Venues whose menu pages were marked for a rebuild. */
  venues: string[];
  /** Sold-out marks whose end had passed, per venue slug. */
  clearedMarks: Record<string, number>;
};

/**
 * The 04:00 job (P-01, plan §12 "zamanlanmış işler"): for every active venue, clear the sold-out
 * marks that have ended, then mark its menu pages stale so the next visit rebuilds them with the
 * new business day's data (yesterday's daily menu drops out of the HTML). Each venue runs in its
 * own scope (ADR-0004); one venue's failure does not stop the others.
 */
export async function runDayEnd(now: Date): Promise<DayEndReport> {
  const active = await db
    .select({ id: venues.id, slug: venues.slug })
    .from(venues)
    .where(eq(venues.status, "active"));
  const report: DayEndReport = { venues: [], clearedMarks: {} };
  for (const venue of active) {
    report.clearedMarks[venue.slug] = await withVenue(venue.id, (tx) =>
      clearExpiredSoldOut(tx, now),
    );
    report.venues.push(venue.slug);
  }
  refreshForNewDay(report.venues, ["menu"]);
  return report;
}
