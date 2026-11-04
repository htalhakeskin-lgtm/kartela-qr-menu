import "server-only";

import { and, asc, eq, inArray } from "drizzle-orm";

import type { PriceUnit } from "@/platform/menu/price";
import type { OutsideWindow } from "@/platform/menu/schedule";
import type { Menu, MenuItem, MenuPrice, MenuSection, VenueMenu } from "@/platform/menu/types";
import type {
  Allergen,
  Diet,
  ItemKind,
  ItemStatus,
  MenuKind,
  SpiceLevel,
} from "@/platform/menu/vocabulary";

import type { TenantTx } from "./scope";
import { itemPrices, items, menus, menuSections, sectionItems } from "./tables";

/**
 * A venue's whole menu in one structure (plan §9, D-03): menus → sections → sub-sections →
 * products with their price lines. Five queries, no N+1; the value sets are guaranteed by the
 * tables' check constraints, so the text columns are narrowed to their unions here.
 *
 * Run inside withVenue(venueId, …): row level security limits every query to the venue; the
 * explicit venue filter is for the indexes. Draft and archived products are left out unless
 * `includeDrafts` (panel preview).
 */
export async function loadVenueMenu(
  tx: TenantTx,
  venueId: string,
  options: { includeDrafts?: boolean } = {},
): Promise<VenueMenu> {
  const statuses: ItemStatus[] = options.includeDrafts ? ["published", "draft"] : ["published"];

  const [menuRows, sectionRows, placementRows, itemRows, priceRows] = await Promise.all([
    tx
      .select()
      .from(menus)
      .where(eq(menus.venueId, venueId))
      .orderBy(asc(menus.sort), asc(menus.slug)),
    tx
      .select()
      .from(menuSections)
      .where(eq(menuSections.venueId, venueId))
      .orderBy(asc(menuSections.sort), asc(menuSections.id)),
    tx
      .select({
        sectionId: sectionItems.sectionId,
        itemId: sectionItems.itemId,
        featured: sectionItems.featured,
      })
      .from(sectionItems)
      .where(eq(sectionItems.venueId, venueId))
      .orderBy(asc(sectionItems.sort), asc(sectionItems.id)),
    tx
      .select()
      .from(items)
      .where(and(eq(items.venueId, venueId), inArray(items.status, statuses))),
    tx
      .select()
      .from(itemPrices)
      .where(eq(itemPrices.venueId, venueId))
      .orderBy(asc(itemPrices.sort), asc(itemPrices.id)),
  ]);

  const pricesByItem = new Map<string, MenuPrice[]>();
  for (const row of priceRows) {
    const lines = pricesByItem.get(row.itemId) ?? [];
    lines.push({
      id: row.id,
      unit: row.unit as PriceUnit,
      amountMinor: row.amountMinor,
      label: row.label,
      isDefault: row.isDefault,
    });
    pricesByItem.set(row.itemId, lines);
  }

  const itemsById = new Map<string, MenuItem>();
  for (const row of itemRows) {
    itemsById.set(row.id, {
      id: row.id,
      slug: row.slug,
      kind: row.kind as ItemKind,
      name: row.name,
      description: row.description,
      ingredients: row.ingredients,
      allergens: row.allergens as Allergen[],
      mayContain: row.mayContain as Allergen[],
      diets: row.diets as Diet[],
      spiceLevel: row.spiceLevel as SpiceLevel,
      energyKcal: row.energyKcal,
      nutrition: row.nutrition,
      portionG: row.portionG,
      volumeMl: row.volumeMl,
      origin: row.origin,
      attributes: row.attributes,
      alcohol: row.alcohol,
      imageId: row.imageId,
      prices: pricesByItem.get(row.id) ?? [],
    });
  }

  const sections = new Map<string, MenuSection & { menuId: string; parentId: string | null }>();
  for (const row of sectionRows) {
    sections.set(row.id, {
      id: row.id,
      menuId: row.menuId,
      parentId: row.parentId,
      name: row.name,
      description: row.description,
      layoutHint: row.layoutHint,
      items: [],
      children: [],
    });
  }
  for (const placement of placementRows) {
    const item = itemsById.get(placement.itemId); // undefined: draft or archived
    if (item) sections.get(placement.sectionId)?.items.push({ item, featured: placement.featured });
  }

  const topLevel = new Map<string, MenuSection[]>();
  for (const section of sections.values()) {
    const parent = section.parentId ? sections.get(section.parentId) : undefined;
    if (parent) parent.children.push(section);
    else topLevel.set(section.menuId, [...(topLevel.get(section.menuId) ?? []), section]);
  }

  const result: Menu[] = menuRows.map((row) => ({
    id: row.id,
    slug: row.slug,
    kind: row.kind as MenuKind,
    name: row.name,
    schedule: row.schedule,
    outsideWindow: row.outsideWindow as OutsideWindow,
    access: row.access === "password" ? "password" : "public",
    contexts: row.contexts,
    sections: (topLevel.get(row.id) ?? []).map(strip),
  }));

  // Every published product once: in menu order first, then those not placed in any section.
  const ordered = new Map<string, MenuItem>();
  const visit = (section: MenuSection) => {
    for (const { item } of section.items) ordered.set(item.id, item);
    section.children.forEach(visit);
  };
  result.forEach((menu) => {
    menu.sections.forEach(visit);
  });
  for (const item of itemsById.values()) ordered.set(item.id, item);

  return { menus: result, items: [...ordered.values()] };
}

/** Drops the internal link fields from a section tree. */
function strip(section: MenuSection & { menuId?: string; parentId?: string | null }): MenuSection {
  return {
    id: section.id,
    name: section.name,
    description: section.description,
    layoutHint: section.layoutHint,
    items: section.items,
    children: section.children.map(strip),
  };
}
