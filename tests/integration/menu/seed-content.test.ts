import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { localize } from "@/platform/i18n/fallback";
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
describe("seedVenueContent: content file → database → read model", () => {
  let venue: TestVenue;
  let content: MenuContent;
  let menu: VenueMenu;

  beforeAll(async () => {
    venue = await createVenue("icerik");
    content = parseMenuContent("ornek", venueContents.ornek);
    expect(await seedVenueContent(venue.id, content)).toEqual({
      written: true,
      images: 1,
      items: 11,
      menus: 2,
    });
    menu = await withVenue(venue.id, (tx) => loadVenueMenu(tx, venue.id));
  });

  afterAll(async () => {
    await removeVenues([venue.id]);
  });

  it("menus, sections and sub-sections keep the file's order", () => {
    expect(menu.menus.map((m) => m.slug)).toEqual(["gunun-yemekleri", "kahvalti"]);
    const dishes = menu.menus[0]!;
    expect(dishes.sections.map((s) => s.name.tr)).toEqual([
      "Çorbalar",
      "Sulu yemekler",
      "Tatlılar",
    ]);
    expect(dishes.sections[2]!.children.map((s) => s.name.tr)).toEqual(["Sütlü tatlılar"]);
    expect(dishes.sections[1]!.items.map((p) => [p.item.slug, p.featured])).toEqual([
      ["zeytinyagli-kuru-fasulye", true],
      ["etli-nohut", false],
      ["pirinc-pilavi", false],
    ]);
    expect(menu.menus[1]!.schedule).toEqual({ windows: [{ start: "07:00", end: "11:00" }] });
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
      items: 11,
    });
    const after = await withVenue(venue.id, (tx) => loadVenueMenu(tx, venue.id));
    expect(after.items.map((item) => item.slug)).toEqual(menu.items.map((item) => item.slug));
    expect(after.items.map((item) => item.id)).not.toEqual(before);
  });
});
