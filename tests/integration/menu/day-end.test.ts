import { eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { db } from "@/server/db/client";
import { venues } from "@/server/db/schema";
import { withVenue } from "@/server/db/tenant";
import { itemAvailability } from "@/server/db/tenant/tables";
import { runDayEnd } from "@/server/menu/day-end";

import {
  createMenuBase,
  createVenue,
  type MenuBase,
  removeVenues,
  type TestVenue,
} from "../tenant/fixtures";

/**
 * P-01 / BR-MST-001: the 04:00 job clears sold-out marks that have ended, keeps the running and
 * indefinite ones, and marks every active venue's menu pages stale — each venue under its own tag
 * (BR-KRC-005). revalidateTag needs a Next.js request; here it records the calls.
 */
vi.mock("next/cache", () => ({ updateTag: vi.fn(), revalidateTag: vi.fn() }));

/** 04:00 in Istanbul on Saturday 7 November 2026. */
const NOW = new Date("2026-11-07T01:00:00Z");
const hours = (h: number) => new Date(NOW.getTime() + h * 3_600_000);

describe("runDayEnd: the 04:00 job", () => {
  let a: TestVenue;
  let b: TestVenue;
  let archived: TestVenue;
  let baseA: MenuBase;
  let baseB: MenuBase;

  beforeAll(async () => {
    [a, b, archived] = [
      await createVenue("gun-a"),
      await createVenue("gun-b"),
      await createVenue("gun-arsiv"),
    ];
    await db.update(venues).set({ status: "archived" }).where(eq(venues.id, archived.id));
    baseA = await withVenue(a.id, (tx) => createMenuBase(tx, a.id));
    baseB = await withVenue(b.id, (tx) => createMenuBase(tx, b.id));
    await withVenue(a.id, (tx) =>
      tx.insert(itemAvailability).values([
        { venueId: a.id, itemId: baseA.itemId, soldOutUntil: hours(-0.01) }, // ended at 03:59
        { venueId: a.id, itemId: baseA.otherItemId, soldOutIndefinitely: true },
      ]),
    );
    await withVenue(b.id, (tx) =>
      tx.insert(itemAvailability).values([
        { venueId: b.id, itemId: baseB.itemId, soldOutUntil: hours(24) }, // marked for tomorrow
        { venueId: b.id, itemId: baseB.otherItemId, soldOutUntil: hours(-5) },
      ]),
    );
  });

  afterAll(async () => {
    await removeVenues([a.id, b.id, archived.id]);
  });

  const marks = (venue: TestVenue) =>
    withVenue(venue.id, (tx) =>
      tx
        .select({
          itemId: itemAvailability.itemId,
          until: itemAvailability.soldOutUntil,
          indefinitely: itemAvailability.soldOutIndefinitely,
        })
        .from(itemAvailability),
    );

  it("clears ended marks, keeps running and indefinite ones, in every active venue", async () => {
    const report = await runDayEnd(NOW);

    expect(report.clearedMarks[a.slug]).toBe(1);
    expect(report.clearedMarks[b.slug]).toBe(1);
    expect(report.venues).toEqual(expect.arrayContaining([a.slug, b.slug]));
    expect(report.venues).not.toContain(archived.slug);

    const inA = await marks(a);
    expect(inA.find((m) => m.itemId === baseA.itemId)?.until).toBeNull();
    expect(inA.find((m) => m.itemId === baseA.otherItemId)?.indefinitely).toBe(true);
    const inB = await marks(b);
    expect(inB.find((m) => m.itemId === baseB.itemId)?.until).toEqual(hours(24));
    expect(inB.find((m) => m.itemId === baseB.otherItemId)?.until).toBeNull();
  });

  it("BR-KRC-005: each active venue's menu tag is marked stale on its own, served stale meanwhile", async () => {
    await runDayEnd(NOW);
    const calls = vi.mocked(revalidateTag).mock.calls;
    expect(calls).toContainEqual([`menu:${a.slug}`, "max"]);
    expect(calls).toContainEqual([`menu:${b.slug}`, "max"]);
    expect(calls.map(([tag]) => tag)).not.toContain(`menu:${archived.slug}`);
  });

  it("a second run the same night has nothing left to clear", async () => {
    const report = await runDayEnd(NOW);
    expect(report.clearedMarks[a.slug]).toBe(0);
    expect(report.clearedMarks[b.slug]).toBe(0);
  });
});
