import { sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { db } from "@/server/db/client";
import { venues } from "@/server/db/schema";
import { type TenantTx, withPlatform, withVenue } from "@/server/db/tenant";

import {
  createMenuBase,
  createUser,
  createVenue,
  insertFixture,
  type MenuBase,
  removeUsers,
  removeVenues,
  tenantFixtures,
  tenantTableNames,
  type TestVenue,
} from "./fixtures";

/**
 * REQ-002, BR-KRC-001 — row level security proof (ADR-0004). The table list comes from the
 * database: every table with a venue_id column is checked, so a new tenant table is covered (or
 * fails the suite) without editing this file.
 */

const count = async (tx: Pick<TenantTx, "execute">, table: string, venueId?: string) => {
  const where = venueId ? sql` where venue_id = ${venueId}` : sql``;
  const result = await tx.execute<{ n: number }>(
    sql`select count(*)::int as n from ${sql.identifier(table)}${where}`,
  );
  return result.rows[0]?.n ?? 0;
};

/** insufficient_privilege: "new row violates row-level security policy". */
const RLS_VIOLATION = "42501";

const errorCode = (work: Promise<unknown>) =>
  work.then(
    () => "no error",
    (error: unknown) => (error as { cause?: { code?: string } }).cause?.code ?? String(error),
  );

describe("BR-KRC-001: tenant rows are visible only in their venue's scope", () => {
  let tables: string[] = [];
  let a: TestVenue;
  let b: TestVenue;
  let userId: string;
  const bases = new Map<string, MenuBase>();
  /** Fixture context for a row of `venueId`: its own parent rows. */
  const ctx = (venueId: string) => ({ userId, base: bases.get(venueId)! });

  beforeAll(async () => {
    tables = await tenantTableNames();
    [a, b] = [await createVenue("a"), await createVenue("b")];
    userId = await createUser();
    for (const venue of [a, b]) {
      await withVenue(venue.id, async (tx) => {
        const base = await createMenuBase(tx, venue.id);
        bases.set(venue.id, base);
        for (const table of tables) await insertFixture(tx, table, venue.id, { userId, base });
      });
    }
  });

  afterAll(async () => {
    await removeVenues([a.id, b.id]);
    await removeUsers([userId]);
  });

  it("finds the tenant tables of D-02 (the list is read from the database)", () => {
    expect(tables).toEqual(
      expect.arrayContaining([
        "venue_domains",
        "venue_members",
        "venue_settings",
        "audit_logs",
        "demo_outbox",
      ]),
    );
  });

  it("every tenant table has a fixture row, so the leak tests below cover it", () => {
    expect(Object.keys(tenantFixtures).sort()).toEqual([...tables].sort());
  });

  it("every tenant table enables and forces RLS, has a policy and grants the app role", async () => {
    const result = await db.execute<{
      table: string;
      enabled: boolean;
      forced: boolean;
      policies: number;
      granted: boolean;
    }>(sql`
      select c.relname as table, c.relrowsecurity as enabled, c.relforcerowsecurity as forced,
        (select count(*)::int from pg_policies p where p.schemaname = 'public' and p.tablename = c.relname) as policies,
        has_table_privilege('app_rw', c.oid, 'SELECT, INSERT, UPDATE, DELETE') as granted
      from pg_class c
      where c.relnamespace = 'public'::regnamespace and c.relname::text in ${tables}`);
    expect(result.rows).toHaveLength(tables.length);
    for (const row of result.rows) {
      expect(row, row.table).toMatchObject({ enabled: true, forced: true, granted: true });
      expect(row.policies, row.table).toBeGreaterThan(0);
    }
  });

  it("the app role without a venue scope sees no tenant rows at all", async () => {
    await db.transaction(async (tx) => {
      await tx.execute(sql`select set_config('role', 'app_rw', true)`);
      for (const table of tables) expect(await count(tx, table), table).toBe(0);
    });
  });

  it("venue A's scope reads only A's rows, even with an explicit filter for B", async () => {
    await withVenue(a.id, async (tx) => {
      for (const table of tables) {
        expect(await count(tx, table, b.id), table).toBe(0);
        const own = await count(tx, table, a.id);
        expect(own, table).toBeGreaterThan(0);
        expect(await count(tx, table), table).toBe(own); // no filter: still only A
      }
    });
  });

  it("venue A's scope cannot update or delete B's rows", async () => {
    await withVenue(a.id, async (tx) => {
      for (const table of tables) {
        const updated = await tx.execute(
          sql`update ${sql.identifier(table)} set venue_id = venue_id where venue_id = ${b.id}`,
        );
        const deleted = await tx.execute(
          sql`delete from ${sql.identifier(table)} where venue_id = ${b.id}`,
        );
        expect([updated.rowCount, deleted.rowCount], table).toEqual([0, 0]);
      }
    });
    await withVenue(b.id, async (tx) => {
      for (const table of tables) expect(await count(tx, table), table).toBeGreaterThan(0);
    });
  });

  it("venue A's scope cannot write a row for B, nor move its own row to B (RLS, 42501)", async () => {
    // The error code matters: a unique or foreign key violation would also throw and hide a table
    // whose policy is missing.
    for (const table of tables) {
      const insert = await errorCode(
        withVenue(a.id, (tx) => insertFixture(tx, table, b.id, ctx(b.id))),
      );
      const move = await errorCode(
        withVenue(a.id, (tx) =>
          tx.execute(sql`update ${sql.identifier(table)} set venue_id = ${b.id}`),
        ),
      );
      expect(insert, `${table} insert`).toBe(RLS_VIOLATION);
      expect(move, `${table} update`).toBe(RLS_VIOLATION);
    }
  });

  it("the platform scope sees every venue's rows", async () => {
    await withPlatform(async (tx) => {
      for (const table of tables) {
        expect(await count(tx, table, a.id), table).toBeGreaterThan(0);
        expect(await count(tx, table, b.id), table).toBeGreaterThan(0);
      }
    });
  });

  it("the app role may read the tenant root but never change it", async () => {
    await withVenue(a.id, async (tx) => {
      const rows = await tx.select({ slug: venues.slug }).from(venues);
      expect(rows.map((row) => row.slug)).toEqual(expect.arrayContaining([a.slug, b.slug]));
    });
    await expect(
      withVenue(a.id, (tx) => tx.execute(sql`update venues set name = 'x' where id = ${b.id}`)),
    ).rejects.toThrow();
  });

  it("withVenue refuses a venue id that is not a UUID", async () => {
    await expect(withVenue("rakim' or true --", () => Promise.resolve(1))).rejects.toThrow();
  });
});
