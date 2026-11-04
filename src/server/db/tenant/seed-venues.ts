import "server-only";

import type { VenueRecord } from "@/platform/tenant/registry-schema";

import { db } from "../client";
import { venues } from "../schema/venues";
import { withVenue } from "./scope";
import { venueDomains, venueSettings } from "./tables";

/**
 * Writes registry venues (content/mekanlar/*\/mekan.ts) to the database: the venues row by slug,
 * then — inside the venue's own scope — its settings row and domains. Idempotent: a second run
 * updates the venue's facts and adds nothing. The registry stays the source of the host map at
 * build time (ADR-0002 v2); D-19 adds domains bound in the panel.
 */
export async function seedVenues(records: readonly VenueRecord[]): Promise<Map<string, string>> {
  const ids = new Map<string, string>();
  for (const record of records) {
    const facts = {
      name: record.name,
      kind: record.kind,
      mode: record.mode,
      themeId: record.theme,
      defaultLocale: record.defaultLocale,
      locales: [...record.locales],
    };
    const [row] = await db
      .insert(venues)
      .values({ slug: record.slug, ...facts })
      .onConflictDoUpdate({ target: venues.slug, set: { ...facts, updatedAt: new Date() } })
      .returning({ id: venues.id });
    if (!row) throw new Error(`Mekân yazılamadı: ${record.slug}`);
    ids.set(record.slug, row.id);

    await withVenue(row.id, async (tx) => {
      await tx.insert(venueSettings).values({ venueId: row.id }).onConflictDoNothing();
      for (const [index, host] of record.domains.entries()) {
        await tx
          .insert(venueDomains)
          .values({ venueId: row.id, host, isPrimary: index === 0, status: "active" })
          .onConflictDoNothing();
      }
    });
  }
  return ids;
}
