import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { localize } from "@/platform/i18n/fallback";
import { availabilityStatus, dailyEntries } from "@/platform/menu/availability";
import { evaluate, initialSelection, toggle } from "@/platform/menu/configurator";
import { type MenuContent, parseMenuContent } from "@/platform/menu/content";
import type { VenueMenu } from "@/platform/menu/types";
import { loadVenueMenu, withVenue } from "@/server/db/tenant";
import { seedVenueContent } from "@/server/db/tenant/seed-content";
import { items, mediaAssets } from "@/server/db/tenant/tables";

import { venueContents } from "../../../content/mekanlar/icerik";
import { createVenue, removeVenues, type TestVenue } from "../tenant/fixtures";

/**
 * D-04: the fixture venue's content file goes into a fresh test venue and comes back through the
 * read model unchanged (order, nesting, prices, image, drafts).
 */
const TZ = "Europe/Istanbul";
const at = (local: string) => new Date(`${local}:00+03:00`);
/** Seed time: Friday 6 November 2026, 15:00 in Istanbul. */
const SEEDED_AT = at("2026-11-06T15:00");

describe("seedVenueContent: content file → database → read model", () => {
  let venue: TestVenue;
  let content: MenuContent;
  let menu: VenueMenu;

  beforeAll(async () => {
    venue = await createVenue("icerik");
    content = parseMenuContent("ornek", venueContents.ornek);
    expect(await seedVenueContent(venue.id, content, { now: SEEDED_AT })).toEqual({
      written: true,
      images: 1,
      optionGroups: 3,
      items: 15,
      menus: 3,
    });
    menu = await withVenue(venue.id, (tx) => loadVenueMenu(tx, venue.id));
  });

  afterAll(async () => {
    await removeVenues([venue.id]);
  });

  it("menus, sections and sub-sections keep the file's order", () => {
    expect(menu.menus.map((m) => m.slug)).toEqual(["gunun-yemekleri", "gunun-menusu", "kahvalti"]);
    const dishes = menu.menus[0]!;
    expect(dishes.sections.map((s) => s.name.tr)).toEqual([
      "Çorbalar",
      "Sulu yemekler",
      "Tatlılar",
      "Tabaklar",
    ]);
    expect(dishes.sections[2]!.children.map((s) => s.name.tr)).toEqual(["Sütlü tatlılar"]);
    expect(dishes.sections[1]!.items.map((p) => [p.item.slug, p.featured])).toEqual([
      ["zeytinyagli-kuru-fasulye", true],
      ["etli-nohut", false],
      ["pirinc-pilavi", false],
    ]);
    expect(menu.menus[2]!.schedule).toEqual({ windows: [{ start: "07:00", end: "11:00" }] });
  });

  it("prices arrive in kuruş with their units; the first line is the default", () => {
    const beans = menu.items.find((item) => item.slug === "zeytinyagli-kuru-fasulye")!;
    expect(beans.prices.map((p) => [p.unit, p.amountMinor, p.isDefault])).toEqual([
      ["portion", 22000, true],
      ["half", 14000, false],
    ]);
  });

  it("the draft product is stored but not shown", async () => {
    expect(menu.items.map((item) => item.slug)).not.toContain("gunun-tatlisi-taslak");
    const drafts = await withVenue(venue.id, (tx) =>
      tx.select({ slug: items.slug }).from(items).where(eq(items.status, "draft")),
    );
    expect(drafts).toEqual([{ slug: "gunun-tatlisi-taslak" }]);
  });

  it("the photo is registered with its source and linked; others have none (K-23)", async () => {
    const cortado = menu.items.find((item) => item.slug === "cortado")!;
    const [image] = await withVenue(venue.id, (tx) =>
      tx.select().from(mediaAssets).where(eq(mediaAssets.id, cortado.imageId!)),
    );
    expect(image).toMatchObject({
      key: "cortado-cam-bardak",
      source: "unsplash",
      width: 7170,
      photographer: "Adi Goldstein",
      focalY: 55,
    });
    expect(menu.items.filter((item) => item.imageId !== null).map((item) => item.slug)).toEqual([
      "cortado",
    ]);
  });

  it("D-05: option groups, limits, price lines and rules reach the configurator", () => {
    const cortado = menu.items.find((item) => item.slug === "cortado")!;
    expect(cortado.optionGroups.map((g) => [g.key, g.min, g.max])).toEqual([
      ["sut", 1, 1],
      ["ekstra", 0, 2],
    ]);
    const double = cortado.prices.find((p) => p.label?.tr === "Çift shot")!;
    expect(cortado.optionGroups[1]!.appliesTo).toEqual([double.id]);
    expect(cortado.optionRules).toHaveLength(1);

    let selection = initialSelection(cortado);
    let result = evaluate(cortado, selection);
    expect([result.totalMinor, result.allergens, result.complete]).toEqual([14000, ["milk"], true]);
    expect(result.groups.map((g) => g.group.key)).toEqual(["sut"]); // extras only on the double

    const option = (key: string) =>
      cortado.optionGroups.flatMap((g) => g.options).find((o) => o.key === key)!.id;
    selection = toggle(cortado, { ...selection, priceId: double.id }, option("yulaf"));
    result = evaluate(cortado, selection);
    expect(result.totalMinor).toBe(19000); // 170 + 20
    expect(result.allergens).toEqual(["gluten"]); // oat milk instead of cow's milk
    const cream = result.groups[1]!.options.find((s) => s.option.key === "krema")!;
    expect(cream.blocked).toMatchObject({ reason: "excluded" });
    const honey = result.groups[1]!.options.find((s) => s.option.key === "bal")!;
    expect(honey.blocked).toEqual({ reason: "unavailable" });
  });

  it("BR-SCN-001: Turkish coffee needs a sugar choice before it is complete", () => {
    const coffee = menu.items.find((item) => item.slug === "turk-kahvesi")!;
    const start = initialSelection(coffee);
    expect(evaluate(coffee, start).complete).toBe(false);
    const chosen = toggle(coffee, start, coffee.optionGroups[0]!.options[2]!.id);
    expect(evaluate(coffee, chosen)).toMatchObject({ complete: true, totalMinor: 9000 });
  });

  it("BR-MST-005: the menu of the day follows the weekday pattern; Sunday is empty", () => {
    const daily = menu.menus.find((m) => m.slug === "gunun-menusu")!;
    const slugOf = (id: string) => menu.items.find((item) => item.id === id)?.slug;
    const dates = [...new Set(daily.daily.map((entry) => entry.onDate))];
    expect(dates[0]).toBe("2026-11-06");
    expect(dates.at(-1)).toBe("2026-11-19");
    expect(dates).not.toContain("2026-11-08"); // Sunday: closed
    expect(daily.daily).toHaveLength(46); // 14 days, two Sundays empty
    expect(dailyEntries(daily.daily, "2026-11-07").map((e) => slugOf(e.itemId))).toEqual([
      "ezogelin-corbasi",
      "menemen",
      "irmik-helvasi",
    ]);
    expect(dailyEntries(daily.daily, "2026-11-08")).toEqual([]);
  });

  it("BR-MST-001…004: availability arrives as the page needs it", () => {
    const status = (slug: string, local: string) =>
      availabilityStatus(
        menu.items.find((item) => item.slug === slug)!.availability,
        at(local),
        TZ,
      );
    expect(status("etli-nohut", "2026-12-01T12:00").soldOut).toEqual({
      reason: "marked",
      until: null,
    });
    expect(status("irmik-helvasi", "2026-11-06T18:00").soldOut).toEqual({ reason: "count" });
    expect(status("irmik-helvasi", "2026-11-07T04:00")).toMatchObject({
      soldOut: null,
      remaining: 10,
    });
    expect(status("sutlac", "2026-11-06T12:00").nextRelease).toEqual({ time: "16:00", inDays: 0 });
    expect(status("salep", "2027-07-01T12:00").season).toMatchObject({
      inSeason: false,
      display: "dim",
    });
    expect(status("menemen", "2026-11-06T12:00").soldOut).toBeNull();
  });

  it("BR-ILS-001: pairings, suggestions, a set and a tasting menu", () => {
    const bySlug = (slug: string) => menu.items.find((item) => item.slug === slug)!;
    const idOf = (slug: string) => bySlug(slug).id;
    expect(bySlug("zeytinyagli-kuru-fasulye").pairings).toEqual([
      {
        itemId: idOf("pirinc-pilavi"),
        note: { tr: "Klasik ikili", en: "The classic pair", ar: "الثنائي الكلاسيكي" },
      },
    ]);
    expect(bySlug("mercimek-corbasi").suggestions).toEqual([idOf("ezogelin-corbasi")]);
    expect(bySlug("esnaf-tabagi").components).toEqual([
      { itemId: idOf("zeytinyagli-kuru-fasulye"), qty: 1 },
      { itemId: idOf("pirinc-pilavi"), qty: 1 },
      { itemId: idOf("cay"), qty: 1 },
    ]);
    expect(bySlug("lokanta-tadimi").courses.map((c) => [c.no, c.title.tr, c.itemId])).toEqual([
      [1, "Çorba", idOf("mercimek-corbasi")],
      [2, "Sulu yemek", idOf("zeytinyagli-kuru-fasulye")],
      [3, "Tatlı", idOf("sutlac")],
    ]);
  });

  it("the read model can leave out past daily entries", async () => {
    const later = await withVenue(venue.id, (tx) =>
      loadVenueMenu(tx, venue.id, { dailyFrom: "2026-11-16" }),
    );
    const daily = later.menus.find((m) => m.slug === "gunun-menusu")!.daily;
    expect(daily.every((entry) => entry.onDate >= "2026-11-16")).toBe(true);
    expect(daily.length).toBeGreaterThan(0);
  });

  it("BR-MNU-003: the Arabic page shows the missing description in Turkish, marked", () => {
    const ezogelin = menu.items.find((item) => item.slug === "ezogelin-corbasi")!;
    expect(localize(ezogelin.description!, "ar")).toMatchObject({ lang: "tr", fallback: true });
  });

  it("a second run leaves a venue with a menu alone; replace rebuilds it", async () => {
    expect(await seedVenueContent(venue.id, content)).toEqual({
      written: false,
      reason: "venue already has a menu",
    });
    const before = menu.items.map((item) => item.id);
    expect(await seedVenueContent(venue.id, content, { replace: true })).toMatchObject({
      written: true,
      items: 15,
    });
    const after = await withVenue(venue.id, (tx) => loadVenueMenu(tx, venue.id));
    expect(after.items.map((item) => item.slug)).toEqual(menu.items.map((item) => item.slug));
    expect(after.items.map((item) => item.id)).not.toEqual(before);
  });
});
