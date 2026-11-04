import { sql } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";

import { db } from "@/server/db/client";

import { tenantTableNames } from "./fixtures";

/**
 * BR-KRC-002 — relations stay inside one venue (ADR-0004, layer 2). Read from the catalogue, so
 * every future tenant table is checked: a foreign key between two tenant tables must include
 * venue_id on both sides ((venue_id, section_id) → menu_sections (venue_id, id)); a single-column
 * key could tie venue A's row to venue B's. D-03 adds the first such relations (menus → sections →
 * items) and a behavioural cross-venue insert test for them.
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
    for (const fk of between) {
      const position = fk.fromCols.indexOf("venue_id");
      expect(position, fk.name).toBeGreaterThanOrEqual(0);
      expect(fk.toCols[position], fk.name).toBe("venue_id");
    }
  });
});
