import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { newId } from "@/server/db/columns";
import { withVenue } from "@/server/db/tenant";
import {
  itemAvailability,
  itemOptionGroups,
  itemPrices,
  itemRelations,
  items,
  menus,
  optionGroups,
  optionRules,
  options,
  setComponents,
  tastingCourses,
} from "@/server/db/tenant/tables";

import {
  createMenuBase,
  createVenue,
  type MenuBase,
  removeVenues,
  type TestVenue,
} from "../tenant/fixtures";

/**
 * REQ-005, BR-MNU-003: the database itself refuses values outside the engine's fixed sets, so a
 * broken import or a panel bug cannot store them (04-veri: value sets as text + check).
 */
const CHECK_VIOLATION = "23514";
const UNIQUE_VIOLATION = "23505";
const errorCode = (work: Promise<unknown>) =>
  work.then(
    () => "no error",
    (error: unknown) => (error as { cause?: { code?: string } }).cause?.code ?? String(error),
  );

describe("menu engine constraints", () => {
  let venue: TestVenue;
  let base: MenuBase;

  beforeAll(async () => {
    venue = await createVenue("ck");
    base = await withVenue(venue.id, (tx) => createMenuBase(tx, venue.id));
  });

  afterAll(async () => {
    await removeVenues([venue.id]);
  });

  const insertItem = (overrides: Partial<typeof items.$inferInsert>) =>
    errorCode(
      withVenue(venue.id, (tx) =>
        tx.insert(items).values({
          venueId: venue.id,
          slug: `ck-${newId()}`,
          name: { tr: "Ayran" },
          ...overrides,
        }),
      ),
    );

  it("REQ-005: only the 14 allergens and the known diets are stored", async () => {
    expect(await insertItem({ allergens: ["milk", "sesame"], diets: ["vegetarian"] })).toBe(
      "no error",
    );
    expect(await insertItem({ allergens: ["dairy"] })).toBe(CHECK_VIOLATION);
    expect(await insertItem({ mayContain: ["walnut"] })).toBe(CHECK_VIOLATION);
    expect(await insertItem({ diets: ["keto"] })).toBe(CHECK_VIOLATION);
  });

  it("spice level 0–3, no negative energy, a known product kind", async () => {
    expect(await insertItem({ spiceLevel: 4 })).toBe(CHECK_VIOLATION);
    expect(await insertItem({ energyKcal: -1 })).toBe(CHECK_VIOLATION);
    expect(await insertItem({ kind: "pizza" })).toBe(CHECK_VIOLATION);
  });

  it("BR-MNU-003: Turkish is required in every translated name; other languages are optional", async () => {
    expect(await insertItem({ name: { tr: "  ", en: "Ayran" } })).toBe(CHECK_VIOLATION);
    expect(await insertItem({ name: { en: "Ayran" } as never })).toBe(CHECK_VIOLATION);
    expect(await insertItem({ description: { tr: "" } })).toBe(CHECK_VIOLATION);
    expect(await insertItem({ name: { tr: "Ayran", ar: "عيران" } })).toBe("no error");
  });

  it("a password menu needs its hash; a public one has none", async () => {
    const menu = (access: string, passwordHash: string | null) =>
      errorCode(
        withVenue(venue.id, (tx) =>
          tx.insert(menus).values({
            venueId: venue.id,
            slug: `gizli-${newId()}`,
            name: { tr: "Gizli bölüm" },
            access,
            passwordHash,
          }),
        ),
      );
    expect(await menu("password", null)).toBe(CHECK_VIOLATION);
    expect(await menu("public", "hash")).toBe(CHECK_VIOLATION);
    expect(await menu("password", "hash")).toBe("no error");
  });

  it("price lines: known unit, no negative amount, one default per product", async () => {
    const price = (overrides: Partial<typeof itemPrices.$inferInsert>) =>
      errorCode(
        withVenue(venue.id, (tx) =>
          tx.insert(itemPrices).values({
            venueId: venue.id,
            itemId: base.itemId,
            amountMinor: 24000,
            ...overrides,
          }),
        ),
      );
    expect(await price({ unit: "per_gram" })).toBe(CHECK_VIOLATION);
    expect(await price({ amountMinor: -1 })).toBe(CHECK_VIOLATION);
    expect(await price({ isDefault: true })).toBe("no error");
    expect(await price({ isDefault: true, unit: "half" })).toBe(UNIQUE_VIOLATION);
  });

  it("BR-SCN-001: option group limits are consistent, also when a product overrides them", async () => {
    const group = (minSelect: number, maxSelect: number) =>
      errorCode(
        withVenue(venue.id, (tx) =>
          tx.insert(optionGroups).values({
            venueId: venue.id,
            key: `grup-${newId()}`,
            name: { tr: "Grup" },
            minSelect,
            maxSelect,
          }),
        ),
      );
    expect(await group(2, 1)).toBe(CHECK_VIOLATION);
    expect(await group(0, 0)).toBe(CHECK_VIOLATION);
    expect(await group(1, 3)).toBe("no error");

    const link = (minOverride: number | null, maxOverride: number | null) =>
      errorCode(
        withVenue(venue.id, (tx) =>
          tx.insert(itemOptionGroups).values({
            venueId: venue.id,
            itemId: base.itemId,
            groupId: base.groupId,
            minOverride,
            maxOverride,
          }),
        ),
      );
    expect(await link(3, 2)).toBe(CHECK_VIOLATION);
    expect(await link(0, 2)).toBe("no error");
    expect(await link(null, null)).toBe(UNIQUE_VIOLATION); // one link per product and group
  });

  it("options: known allergens and diets only", async () => {
    const option = (extra: Partial<typeof options.$inferInsert>) =>
      errorCode(
        withVenue(venue.id, (tx) =>
          tx.insert(options).values({
            venueId: venue.id,
            groupId: base.groupId,
            key: `secenek-${newId()}`,
            name: { tr: "Seçenek" },
            ...extra,
          }),
        ),
      );
    expect(await option({ allergens: ["oat"] })).toBe(CHECK_VIOLATION);
    expect(await option({ dietsRemoved: ["paleo"] })).toBe(CHECK_VIOLATION);
    expect(await option({ allergens: ["nuts"], priceDeltaMinor: -1000 })).toBe("no error");
  });

  it("BR-SCN-003: a rule has exactly one target and never targets itself", async () => {
    const rule = (extra: Partial<typeof optionRules.$inferInsert>) =>
      errorCode(
        withVenue(venue.id, (tx) =>
          tx.insert(optionRules).values({
            venueId: venue.id,
            whenOptionId: base.optionId,
            effect: "excludes",
            ...extra,
          }),
        ),
      );
    expect(await rule({})).toBe(CHECK_VIOLATION); // no target
    expect(await rule({ targetOptionId: base.otherOptionId, targetGroupId: base.groupId })).toBe(
      CHECK_VIOLATION,
    );
    expect(await rule({ targetOptionId: base.optionId })).toBe(CHECK_VIOLATION);
    expect(await rule({ targetOptionId: base.otherOptionId, effect: "allows" })).toBe(
      CHECK_VIOLATION,
    );
    expect(await rule({ targetOptionId: base.otherOptionId })).toBe("no error");
  });

  it("BR-MST-001/002: availability rows are consistent", async () => {
    const row = (extra: Partial<typeof itemAvailability.$inferInsert>) =>
      errorCode(
        withVenue(venue.id, (tx) =>
          tx.insert(itemAvailability).values({ venueId: venue.id, itemId: base.itemId, ...extra }),
        ),
      );
    expect(await row({ remaining: 3 })).toBe(CHECK_VIOLATION); // a count without a limit
    expect(await row({ dailyLimit: 2, remaining: 3 })).toBe(CHECK_VIOLATION);
    expect(await row({ dailyLimit: 0 })).toBe(CHECK_VIOLATION);
    expect(await row({ soldOutIndefinitely: true, soldOutUntil: new Date() })).toBe(
      CHECK_VIOLATION,
    );
    expect(await row({ outsideSeason: "grey" })).toBe(CHECK_VIOLATION);
    expect(await row({ releaseTimes: ["25:00"] })).not.toBe("no error"); // not a time of day
    expect(await row({ dailyLimit: 12, remaining: 0, remainingOn: "2026-11-06" })).toBe("no error");
    expect(await row({ soldOutIndefinitely: true })).toBe(UNIQUE_VIOLATION); // one row per product
  });

  it("BR-ILS-001: no relation to itself, no duplicate pair; sets and courses stay sensible", async () => {
    const insert = (work: Parameters<typeof withVenue>[1]) => errorCode(withVenue(venue.id, work));
    const relation = { venueId: venue.id, fromItemId: base.itemId, kind: "pairing" };
    const relate = (toItemId: string) =>
      insert((tx) => tx.insert(itemRelations).values({ ...relation, toItemId }));
    expect(await relate(base.itemId)).toBe(CHECK_VIOLATION);
    expect(await relate(base.otherItemId)).toBe("no error");
    expect(await relate(base.otherItemId)).toBe(UNIQUE_VIOLATION);
    const component = insert((tx) =>
      tx.insert(setComponents).values({
        venueId: venue.id,
        setItemId: base.itemId,
        componentItemId: base.otherItemId,
        qty: 0,
      }),
    );
    expect(await component).toBe(CHECK_VIOLATION);
    const course = insert((tx) =>
      tx.insert(tastingCourses).values({
        venueId: venue.id,
        tastingItemId: base.itemId,
        courseNo: 0,
        title: { tr: "Ara" },
      }),
    );
    expect(await course).toBe(CHECK_VIOLATION);
  });
});
