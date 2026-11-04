import { eq, inArray } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";

import { parseRegistry } from "@/platform/tenant/registry-schema";
import { db } from "@/server/db/client";
import { newId } from "@/server/db/columns";
import { venues } from "@/server/db/schema";
import { withPlatform } from "@/server/db/tenant";
import { seedVenues } from "@/server/db/tenant/seed-venues";
import { venueDomains, venueSettings } from "@/server/db/tenant/tables";

import { removeVenues } from "./fixtures";

/** pnpm db:seed writes registry venues to the database, and running it twice changes nothing. */
describe("seedVenues: registry → venues, settings, domains", () => {
  const suffix = newId().slice(-8);
  const records = parseRegistry([
    {
      slug: `tohum-a-${suffix}`,
      name: "Tohum A",
      kind: "coffee",
      theme: "rakim",
      locales: ["tr", "en"],
      defaultLocale: "tr",
      domains: [`tohum-a-${suffix}.test.example.com`, `www.tohum-a-${suffix}.test.example.com`],
      mode: "demo",
    },
    {
      slug: `tohum-b-${suffix}`,
      name: "Tohum B",
      kind: "lokanta",
      theme: "sade",
      locales: ["tr", "ar"],
      defaultLocale: "tr",
      domains: [],
      mode: "live",
    },
  ]);
  const slugs = records.map((record) => record.slug);

  afterAll(async () => {
    const rows = await db.select({ id: venues.id }).from(venues).where(inArray(venues.slug, slugs));
    await removeVenues(rows.map((row) => row.id));
  });

  it("is idempotent and keeps the venue facts in sync with the registry", async () => {
    const first = await seedVenues(records);
    const second = await seedVenues([{ ...records[0]!, name: "Tohum A (yeni ad)" }, records[1]!]);
    expect([...second.entries()]).toEqual([...first.entries()]); // same ids, no new rows

    const rows = await db
      .select({ slug: venues.slug, name: venues.name, kind: venues.kind, locales: venues.locales })
      .from(venues)
      .where(inArray(venues.slug, slugs))
      .orderBy(venues.slug);
    expect(rows).toEqual([
      { slug: slugs[0], name: "Tohum A (yeni ad)", kind: "coffee", locales: ["tr", "en"] },
      { slug: slugs[1], name: "Tohum B", kind: "lokanta", locales: ["tr", "ar"] },
    ]);

    const idA = first.get(slugs[0]!)!;
    const { domains, settings } = await withPlatform(async (tx) => ({
      domains: await tx
        .select({ host: venueDomains.host, isPrimary: venueDomains.isPrimary })
        .from(venueDomains)
        .where(eq(venueDomains.venueId, idA))
        .orderBy(venueDomains.host),
      settings: await tx
        .select({ venueId: venueSettings.venueId })
        .from(venueSettings)
        .where(inArray(venueSettings.venueId, [...first.values()])),
    }));
    expect(domains).toEqual([
      { host: `tohum-a-${suffix}.test.example.com`, isPrimary: true },
      { host: `www.tohum-a-${suffix}.test.example.com`, isPrimary: false },
    ]);
    expect(settings).toHaveLength(2);
  });
});
