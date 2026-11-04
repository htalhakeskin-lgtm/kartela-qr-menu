import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { MenuSection, VenueMenu } from "@/platform/menu/types";
import { newId } from "@/server/db/columns";
import { loadVenueMenu, withVenue } from "@/server/db/tenant";
import { itemPrices, items, menus, menuSections, sectionItems } from "@/server/db/tenant/tables";

import { createVenue, removeVenues, type TestVenue } from "../tenant/fixtures";

/**
 * The read model a theme receives (D-03): order, nesting, prices, drafts. Each test reads the same
 * venue, built once in a deliberately shuffled insert order.
 */
describe("loadVenueMenu: one venue's menu as one structure", () => {
  let venue: TestVenue;
  let menu: VenueMenu;
  const id = { menemen: "", peynir: "", taslak: "", tek: "" };

  const names = (sections: MenuSection[]) => sections.map((section) => section.name.tr);

  beforeAll(async () => {
    venue = await createVenue("read");
    const venueId = venue.id;
    await withVenue(venueId, async (tx) => {
      const insertMenu = async (slug: string, tr: string, sort: number) => {
        const [row] = await tx
          .insert(menus)
          .values({ venueId, slug, name: { tr }, sort })
          .returning({ id: menus.id });
        return row!.id;
      };
      const evening = await insertMenu("aksam", "Akşam", 1);
      const breakfast = await insertMenu("kahvalti", "Kahvaltı", 0);

      const insertSection = async (
        menuId: string,
        tr: string,
        sort: number,
        parentId: string | null = null,
      ) => {
        const [row] = await tx
          .insert(menuSections)
          .values({ venueId, menuId, parentId, name: { tr }, sort })
          .returning({ id: menuSections.id });
        return row!.id;
      };
      const hot = await insertSection(breakfast, "Sıcaklar", 1);
      const cold = await insertSection(breakfast, "Soğuklar", 0);
      const cheeses = await insertSection(breakfast, "Peynirler", 0, cold);
      const mains = await insertSection(evening, "Ana yemekler", 0);

      const insertItem = async (slug: string, tr: string, status = "published") => {
        const [row] = await tx
          .insert(items)
          .values({ venueId, slug: `${slug}-${newId()}`, name: { tr }, status })
          .returning({ id: items.id });
        return row!.id;
      };
      id.menemen = await insertItem("menemen", "Menemen");
      id.peynir = await insertItem("peynir", "Ezine peyniri");
      id.taslak = await insertItem("taslak", "Taslak ürün", "draft");
      id.tek = await insertItem("tek", "Bölümsüz ürün");

      await tx.insert(sectionItems).values([
        { venueId, sectionId: hot, itemId: id.taslak, sort: 0 },
        { venueId, sectionId: hot, itemId: id.menemen, sort: 1, featured: true },
        { venueId, sectionId: cheeses, itemId: id.peynir, sort: 0 },
        { venueId, sectionId: mains, itemId: id.menemen, sort: 0 }, // one product, two menus
      ]);
      await tx.insert(itemPrices).values([
        { venueId, itemId: id.menemen, unit: "half", amountMinor: 14000, sort: 1 },
        {
          venueId,
          itemId: id.menemen,
          unit: "portion",
          amountMinor: 24000,
          isDefault: true,
          sort: 0,
        },
      ]);
    });
    menu = await withVenue(venueId, (tx) => loadVenueMenu(tx, venueId));
  });

  afterAll(async () => {
    await removeVenues([venue.id]);
  });

  it("menus and sections come in their sort order, sub-sections nested", () => {
    expect(menu.menus.map((m) => m.name.tr)).toEqual(["Kahvaltı", "Akşam"]);
    const breakfast = menu.menus[0]!;
    expect(names(breakfast.sections)).toEqual(["Soğuklar", "Sıcaklar"]);
    expect(names(breakfast.sections[0]!.children)).toEqual(["Peynirler"]);
    expect(breakfast.sections[0]!.children[0]!.items.map((p) => p.item.name.tr)).toEqual([
      "Ezine peyniri",
    ]);
  });

  it("draft products stay out of the visitor's menu", () => {
    const hot = menu.menus[0]!.sections[1]!;
    expect(hot.items.map((p) => [p.item.name.tr, p.featured])).toEqual([["Menemen", true]]);
    expect(menu.items.map((item) => item.id)).not.toContain(id.taslak);
  });

  it("price lines keep their order and their default", () => {
    const menemen = menu.items.find((item) => item.id === id.menemen)!;
    expect(menemen.prices.map((p) => [p.unit, p.amountMinor, p.isDefault])).toEqual([
      ["portion", 24000, true],
      ["half", 14000, false],
    ]);
  });

  it("the product list has each published product once, unplaced ones last", () => {
    expect(menu.items.map((item) => item.name.tr)).toEqual([
      "Ezine peyniri",
      "Menemen",
      "Bölümsüz ürün",
    ]);
  });

  it("the panel preview includes drafts", async () => {
    const preview = await withVenue(venue.id, (tx) =>
      loadVenueMenu(tx, venue.id, { includeDrafts: true }),
    );
    expect(preview.items.map((item) => item.id)).toContain(id.taslak);
  });
});
