import "server-only";

import { and, asc, eq, gte, inArray } from "drizzle-orm";

import type { ItemAvailability } from "@/platform/menu/availability";
import type { ConfigGroup, ConfigOption, ConfigRule } from "@/platform/menu/configurator";
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
import { sequential } from "./sequential";
import {
  dailyMenuEntries,
  itemAvailability,
  itemOptionGroups,
  itemPrices,
  itemRelations,
  items,
  menus,
  menuSections,
  optionGroups,
  optionRules,
  options as optionsTable,
  sectionItems,
  setComponents,
  tastingCourses,
} from "./tables";

/**
 * A venue's whole menu in one structure (plan §9, D-03, D-05): menus → sections → sub-sections →
 * products with their price lines, configurator groups, availability and relations, plus the
 * daily menu entries. Fourteen queries in three parallel batches, no N+1; the value sets are guaranteed by the
 * tables' check constraints, so the text columns are narrowed to their unions here.
 *
 * Run inside withVenue(venueId, …): row level security limits every query to the venue; the
 * explicit venue filter is for the indexes. Draft and archived products are left out unless
 * `includeDrafts` (panel preview).
 */
export async function loadVenueMenu(
  tx: TenantTx,
  venueId: string,
  options: {
    includeDrafts?: boolean;
    /** Daily menu entries from this business date on ("YYYY-MM-DD"); default: all. */
    dailyFrom?: string;
  } = {},
): Promise<VenueMenu> {
  const statuses: ItemStatus[] = options.includeDrafts ? ["published", "draft"] : ["published"];

  const [menuRows, sectionRows, placementRows, itemRows, priceRows] = await sequential([
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

  const [groupRows, optionRows, linkRows, ruleRows] = await sequential([
    tx.select().from(optionGroups).where(eq(optionGroups.venueId, venueId)),
    tx
      .select()
      .from(optionsTable)
      .where(eq(optionsTable.venueId, venueId))
      .orderBy(asc(optionsTable.sort), asc(optionsTable.id)),
    tx
      .select()
      .from(itemOptionGroups)
      .where(eq(itemOptionGroups.venueId, venueId))
      .orderBy(asc(itemOptionGroups.sort), asc(itemOptionGroups.id)),
    tx.select().from(optionRules).where(eq(optionRules.venueId, venueId)),
  ]);

  const [availabilityRows, dailyRows, relationRows, componentRows, courseRows] = await sequential([
    tx.select().from(itemAvailability).where(eq(itemAvailability.venueId, venueId)),
    tx
      .select({
        menuId: dailyMenuEntries.menuId,
        onDate: dailyMenuEntries.onDate,
        itemId: dailyMenuEntries.itemId,
      })
      .from(dailyMenuEntries)
      .where(
        options.dailyFrom
          ? and(
              eq(dailyMenuEntries.venueId, venueId),
              gte(dailyMenuEntries.onDate, options.dailyFrom),
            )
          : eq(dailyMenuEntries.venueId, venueId),
      )
      .orderBy(asc(dailyMenuEntries.onDate), asc(dailyMenuEntries.sort)),
    tx
      .select()
      .from(itemRelations)
      .where(eq(itemRelations.venueId, venueId))
      .orderBy(asc(itemRelations.sort), asc(itemRelations.id)),
    tx
      .select()
      .from(setComponents)
      .where(eq(setComponents.venueId, venueId))
      .orderBy(asc(setComponents.sort), asc(setComponents.id)),
    tx
      .select()
      .from(tastingCourses)
      .where(eq(tastingCourses.venueId, venueId))
      .orderBy(asc(tastingCourses.courseNo)),
  ]);

  const availabilityByItem = new Map<string, ItemAvailability>(
    availabilityRows.map((row) => [
      row.itemId,
      {
        soldOutUntil: row.soldOutUntil?.toISOString() ?? null,
        soldOutIndefinitely: row.soldOutIndefinitely,
        dailyLimit: row.dailyLimit,
        remaining: row.remaining,
        remainingOn: row.remainingOn,
        releaseTimes: row.releaseTimes.map((time) => time.slice(0, 5)),
        seasons: row.seasons,
        outsideSeason: row.outsideSeason === "hide" ? "hide" : "dim",
      },
    ]),
  );
  const grouped = <T, K extends string>(rows: readonly T[], key: (row: T) => K) => {
    const map = new Map<K, T[]>();
    for (const row of rows) map.set(key(row), [...(map.get(key(row)) ?? []), row]);
    return map;
  };
  const relationsByItem = grouped(relationRows, (row) => row.fromItemId);
  const componentsBySet = grouped(componentRows, (row) => row.setItemId);
  const coursesByTasting = grouped(courseRows, (row) => row.tastingItemId);
  const dailyByMenu = grouped(dailyRows, (row) => row.menuId);

  const optionsByGroup = new Map<string, ConfigOption[]>();
  const groupOfOption = new Map<string, string>();
  for (const row of optionRows) {
    groupOfOption.set(row.id, row.groupId);
    optionsByGroup.set(row.groupId, [
      ...(optionsByGroup.get(row.groupId) ?? []),
      {
        id: row.id,
        key: row.key,
        name: row.name,
        priceDeltaMinor: row.priceDeltaMinor,
        allergens: row.allergens as Allergen[],
        dietsRemoved: row.dietsRemoved as Diet[],
        isDefault: row.isDefault,
        available: row.available,
      },
    ]);
  }
  const groupsById = new Map(groupRows.map((row) => [row.id, row]));
  const groupsByItem = new Map<string, ConfigGroup[]>();
  for (const link of linkRows) {
    const group = groupsById.get(link.groupId);
    if (!group) continue;
    groupsByItem.set(link.itemId, [
      ...(groupsByItem.get(link.itemId) ?? []),
      {
        id: group.id,
        key: group.key,
        name: group.name,
        min: link.minOverride ?? group.minSelect,
        max: link.maxOverride ?? group.maxSelect,
        appliesTo: link.appliesToPriceIds,
        options: optionsByGroup.get(group.id) ?? [],
      },
    ]);
  }
  /** A product's rules: its own, plus venue-wide ones about options of its groups. */
  const rulesFor = (itemId: string, groups: ConfigGroup[]): ConfigRule[] => {
    const groupIds = new Set(groups.map((group) => group.id));
    return ruleRows
      .filter((rule) =>
        rule.itemId === null
          ? groupIds.has(groupOfOption.get(rule.whenOptionId) ?? "")
          : rule.itemId === itemId,
      )
      .map((rule) => ({
        whenOptionId: rule.whenOptionId,
        effect: rule.effect === "requires" ? "requires" : "excludes",
        targetOptionId: rule.targetOptionId,
        targetGroupId: rule.targetGroupId,
        message: rule.message,
      }));
  };

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
      optionGroups: groupsByItem.get(row.id) ?? [],
      optionRules: rulesFor(row.id, groupsByItem.get(row.id) ?? []),
      availability: availabilityByItem.get(row.id) ?? null,
      pairings: (relationsByItem.get(row.id) ?? [])
        .filter((relation) => relation.kind === "pairing")
        .map((relation) => ({ itemId: relation.toItemId, note: relation.note })),
      suggestions: (relationsByItem.get(row.id) ?? [])
        .filter((relation) => relation.kind === "suggestion")
        .map((relation) => relation.toItemId),
      components: (componentsBySet.get(row.id) ?? []).map((component) => ({
        itemId: component.componentItemId,
        qty: component.qty,
      })),
      courses: (coursesByTasting.get(row.id) ?? []).map((course) => ({
        no: course.courseNo,
        title: course.title,
        itemId: course.itemId,
        description: course.description,
      })),
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
    daily: (dailyByMenu.get(row.id) ?? []).map(({ onDate, itemId }) => ({ onDate, itemId })),
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
