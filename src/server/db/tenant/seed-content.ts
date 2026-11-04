import "server-only";

import { count, eq } from "drizzle-orm";

import type { MenuContent } from "@/platform/menu/content";

import { withVenue } from "./scope";
import {
  itemOptionGroups,
  itemPrices,
  items,
  mediaAssets,
  menus,
  menuSections,
  optionGroups,
  optionRules,
  options as optionsTable,
  sectionItems,
} from "./tables";

export type SeedContentResult =
  | { written: true; images: number; optionGroups: number; items: number; menus: number }
  | { written: false; reason: "venue already has a menu" };

/**
 * Writes a venue's content file (D-04) in one transaction of the venue's own scope. By default
 * only a venue without menus is written, so a deploy never overwrites what the panel changed;
 * `replace` deletes the venue's menu data first (db:reset, content development).
 *
 * Sort orders follow the file: the order of menus, sections, placements and price lines.
 */
export async function seedVenueContent(
  venueId: string,
  content: MenuContent,
  options: { replace?: boolean } = {},
): Promise<SeedContentResult> {
  return withVenue(venueId, async (tx) => {
    if (options.replace) {
      // Children cascade: sections → placements, items → prices. Items before images (FK).
      await tx.delete(menus).where(eq(menus.venueId, venueId));
      await tx.delete(items).where(eq(items.venueId, venueId));
      await tx.delete(optionGroups).where(eq(optionGroups.venueId, venueId)); // options, links, rules
      await tx.delete(mediaAssets).where(eq(mediaAssets.venueId, venueId));
    } else {
      const [existing] = await tx
        .select({ n: count() })
        .from(menus)
        .where(eq(menus.venueId, venueId));
      if ((existing?.n ?? 0) > 0) return { written: false, reason: "venue already has a menu" };
    }

    const imageIds = new Map<string, string>();
    const imageEntries = Object.entries(content.images);
    if (imageEntries.length > 0) {
      const rows = await tx
        .insert(mediaAssets)
        .values(
          imageEntries.map(([key, image]) => ({
            venueId,
            key,
            source: image.source,
            url: image.url,
            width: image.width,
            height: image.height,
            photographer: image.photographer,
            sourcePage: image.sourcePage,
            license: image.license,
            alt: image.alt,
            focalX: image.focal?.[0] ?? 50,
            focalY: image.focal?.[1] ?? 50,
          })),
        )
        .returning({ id: mediaAssets.id, key: mediaAssets.key });
      for (const row of rows) imageIds.set(row.key, row.id);
    }

    const itemRows = await tx
      .insert(items)
      .values(
        content.items.map((item) => ({
          venueId,
          slug: item.slug,
          kind: item.kind,
          name: item.name,
          description: item.description ?? null,
          ingredients: item.ingredients ?? null,
          allergens: item.allergens,
          mayContain: item.mayContain,
          diets: item.diets,
          spiceLevel: item.spiceLevel,
          energyKcal: item.energyKcal ?? null,
          nutrition: item.nutrition ?? null,
          portionG: item.portionG ?? null,
          volumeMl: item.volumeMl ?? null,
          origin: item.origin ?? null,
          attributes: item.attributes,
          alcohol: item.alcohol ?? null,
          imageId: item.image ? (imageIds.get(item.image) ?? null) : null,
          status: item.status,
        })),
      )
      .returning({ id: items.id, slug: items.slug });
    const itemIds = new Map(itemRows.map((row) => [row.slug, row.id]));
    /** The schema guarantees every reference; a miss here is a bug, not bad content. */
    const itemId = (slug: string) => {
      const found = itemIds.get(slug);
      if (!found) throw new Error(`Ürün kimliği yok: ${slug}`);
      return found;
    };

    const priceRows = await tx
      .insert(itemPrices)
      .values(
        content.items.flatMap((item) =>
          item.prices.map((line, sort) => ({
            venueId,
            itemId: itemId(item.slug),
            unit: line.unit,
            label: line.label ?? null,
            amountMinor: line.amount,
            isDefault: line.default,
            sort,
          })),
        ),
      )
      .returning({ id: itemPrices.id, itemId: itemPrices.itemId, sort: itemPrices.sort });
    /** "item slug / price key" → price line id, for groups limited to some lines. */
    const priceIds = new Map<string, string>();
    for (const item of content.items) {
      item.prices.forEach((line, sort) => {
        const row = priceRows.find(
          (price) => price.itemId === itemId(item.slug) && price.sort === sort,
        );
        if (line.key && row) priceIds.set(`${item.slug}/${line.key}`, row.id);
      });
    }

    await writeOptions();

    for (const [menuSort, menu] of content.menus.entries()) {
      const [menuRow] = await tx
        .insert(menus)
        .values({
          venueId,
          slug: menu.slug,
          kind: menu.kind,
          name: menu.name,
          schedule: menu.schedule ?? null,
          outsideWindow: menu.outsideWindow,
          sort: menuSort,
        })
        .returning({ id: menus.id });
      if (!menuRow) throw new Error(`Menü yazılamadı: ${menu.slug}`);

      for (const [sectionSort, section] of menu.sections.entries()) {
        const sectionId = await insertSection(menuRow.id, null, section, sectionSort);
        for (const [childSort, child] of section.children.entries()) {
          await insertSection(menuRow.id, sectionId, child, childSort);
        }
      }
    }

    return {
      written: true,
      optionGroups: Object.keys(content.optionGroups).length,
      images: imageEntries.length,
      items: content.items.length,
      menus: content.menus.length,
    };

    /** Option groups and options (venue-wide), product links, compatibility rules (D-05). */
    async function writeOptions(): Promise<void> {
      const groupIds = new Map<string, string>();
      const optionIds = new Map<string, string>(); // "group.option" → id
      for (const [sort, [key, group]] of Object.entries(content.optionGroups).entries()) {
        const [groupRow] = await tx
          .insert(optionGroups)
          .values({
            venueId,
            key,
            name: group.name,
            minSelect: group.min,
            maxSelect: group.max,
            sort,
          })
          .returning({ id: optionGroups.id });
        if (!groupRow) throw new Error(`Seçenek grubu yazılamadı: ${key}`);
        groupIds.set(key, groupRow.id);
        const rows = await tx
          .insert(optionsTable)
          .values(
            group.options.map((option, optionSort) => ({
              venueId,
              groupId: groupRow.id,
              key: option.key,
              name: option.name,
              priceDeltaMinor: option.delta,
              allergens: option.allergens,
              dietsRemoved: option.dietsRemoved,
              isDefault: option.default,
              available: option.available,
              sort: optionSort,
            })),
          )
          .returning({ id: optionsTable.id, key: optionsTable.key });
        for (const row of rows) optionIds.set(`${key}.${row.key}`, row.id);
      }

      const links = content.items.flatMap((item) =>
        item.options.map((link, sort) => ({
          venueId,
          itemId: itemId(item.slug),
          groupId: lookup(groupIds, link.group),
          sort,
          minOverride: link.min ?? null,
          maxOverride: link.max ?? null,
          appliesToPriceIds:
            link.appliesTo?.map((key) => lookup(priceIds, `${item.slug}/${key}`)) ?? null,
        })),
      );
      if (links.length > 0) await tx.insert(itemOptionGroups).values(links);

      if (content.rules.length > 0) {
        await tx.insert(optionRules).values(
          content.rules.map((rule) => {
            const target = (rule.excludes ?? rule.requires) as string;
            return {
              venueId,
              itemId: rule.item ? itemId(rule.item) : null,
              whenOptionId: lookup(optionIds, rule.when),
              effect: rule.excludes ? "excludes" : "requires",
              targetOptionId: target.includes(".") ? lookup(optionIds, target) : null,
              targetGroupId: target.includes(".") ? null : lookup(groupIds, target),
              message: rule.message ?? null,
            };
          }),
        );
      }
    }

    async function insertSection(
      menuId: string,
      parentId: string | null,
      section: MenuContent["menus"][number]["sections"][number]["children"][number],
      sort: number,
    ): Promise<string> {
      const [row] = await tx
        .insert(menuSections)
        .values({
          venueId,
          menuId,
          parentId,
          name: section.name,
          description: section.description ?? null,
          layoutHint: section.layoutHint ?? null,
          sort,
        })
        .returning({ id: menuSections.id });
      if (!row) throw new Error(`Bölüm yazılamadı: ${section.name.tr}`);
      if (section.items.length > 0) {
        await tx.insert(sectionItems).values(
          section.items.map((placement, placementSort) => ({
            venueId,
            sectionId: row.id,
            itemId: itemId(placement.item),
            sort: placementSort,
            featured: placement.featured,
          })),
        );
      }
      return row.id;
    }
  });
}

/** The schema guarantees every reference; a miss here is a bug, not bad content. */
function lookup(map: Map<string, string>, key: string): string {
  const found = map.get(key);
  if (!found) throw new Error(`Kimlik bulunamadı: ${key}`);
  return found;
}
