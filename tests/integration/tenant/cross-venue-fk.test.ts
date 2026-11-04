import { sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { db } from "@/server/db/client";
import { withPlatform, withVenue } from "@/server/db/tenant";
import { itemPrices, menuSections, sectionItems } from "@/server/db/tenant/tables";

import {
  createMenuBase,
  createVenue,
  type MenuBase,
  removeVenues,
  tenantTableNames,
  type TestVenue,
} from "./fixtures";

/** foreign_key_violation */
const FK_VIOLATION = "23503";
const errorCode = (work: Promise<unknown>) =>
  work.then(
    () => "no error",
    (error: unknown) => (error as { cause?: { code?: string } }).cause?.code ?? String(error),
  );

/**
 * BR-KRC-002 — relations stay inside one venue (ADR-0004, layer 2). Read from the catalogue, so
 * every future tenant table is checked: a foreign key between two tenant tables must include
 * venue_id on both sides ((venue_id, section_id) → menu_sections (venue_id, id)); a single-column
 * key could tie venue A's row to venue B's. The behavioural test tries exactly that in the platform
 * scope, where row level security lets both venues' rows through: only the key stops it.
 */

type ForeignKey = { name: string; from: string; to: string; fromCols: string[]; toCols: string[] };

async function foreignKeys(): Promise<ForeignKey[]> {
  const result = await db.execute<ForeignKey>(sql`
    select c.conname as name, src.relname as "from", dst.relname as "to",
      array(select a.attname::text from unnest(c.conkey) with ordinality k(attnum, i)
            join pg_attribute a on a.attrelid = c.conrelid and a.attnum = k.attnum order by k.i) as "fromCols",
      array(select a.attname::text from unnest(c.confkey) with ordinality k(attnum, i)
            join pg_attribute a on a.attrelid = c.confrelid and a.attnum = k.attnum order by k.i) as "toCols"
    from pg_constraint c
    join pg_class src on src.oid = c.conrelid
    join pg_class dst on dst.oid = c.confrelid
    where c.contype = 'f' and src.relnamespace = 'public'::regnamespace`);
  return result.rows;
}

describe("BR-KRC-002: relations never cross venues", () => {
  let tenant: string[] = [];
  let keys: ForeignKey[] = [];

  beforeAll(async () => {
    tenant = await tenantTableNames();
    keys = await foreignKeys();
  });

  it("every tenant table's venue_id references venues(id)", () => {
    for (const table of tenant) {
      const key = keys.find(
        (fk) => fk.from === table && fk.to === "venues" && fk.fromCols.join() === "venue_id",
      );
      expect(key?.toCols, table).toEqual(["id"]);
    }
  });

  it("every foreign key between two tenant tables pairs venue_id with venue_id", () => {
    const between = keys.filter((fk) => tenant.includes(fk.from) && tenant.includes(fk.to));
    expect(between.length).toBeGreaterThanOrEqual(5); // menus → sections (+ parent) → items → prices (D-03)
    for (const fk of between) {
      const position = fk.fromCols.indexOf("venue_id");
      expect(position, fk.name).toBeGreaterThanOrEqual(0);
      expect(fk.toCols[position], fk.name).toBe("venue_id");
    }
  });
});

describe("BR-KRC-002: a row of venue A cannot hang under a row of venue B", () => {
  let a: TestVenue;
  let b: TestVenue;
  let baseA: MenuBase;
  let baseB: MenuBase;

  beforeAll(async () => {
    [a, b] = [await createVenue("fk-a"), await createVenue("fk-b")];
    baseA = await withVenue(a.id, (tx) => createMenuBase(tx, a.id));
    baseB = await withVenue(b.id, (tx) => createMenuBase(tx, b.id));
  });

  afterAll(async () => {
    await removeVenues([a.id, b.id]);
  });

  it.each([
    [
      "A's section + B's product",
      () => ({ venueId: a.id, sectionId: baseA.sectionId, itemId: baseB.itemId }),
    ],
    [
      "B's product claimed by A's section",
      () => ({ venueId: b.id, sectionId: baseA.sectionId, itemId: baseB.itemId }),
    ],
  ])("section_items: %s is refused", async (_case, row) => {
    expect(await errorCode(withPlatform((tx) => tx.insert(sectionItems).values(row())))).toBe(
      FK_VIOLATION,
    );
  });

  it("a section of A cannot belong to B's menu, a price of A cannot belong to B's product", async () => {
    const section = withPlatform((tx) =>
      tx
        .insert(menuSections)
        .values({ venueId: a.id, menuId: baseB.menuId, name: { tr: "Sızma" } }),
    );
    expect(await errorCode(section)).toBe(FK_VIOLATION);
    const price = withPlatform((tx) =>
      tx.insert(itemPrices).values({ venueId: a.id, itemId: baseB.itemId, amountMinor: 1000 }),
    );
    expect(await errorCode(price)).toBe(FK_VIOLATION);
  });

  it("the same rows inside one venue are accepted", async () => {
    await withVenue(a.id, (tx) =>
      tx
        .insert(sectionItems)
        .values({ venueId: a.id, sectionId: baseA.sectionId, itemId: baseA.itemId }),
    );
  });
});
