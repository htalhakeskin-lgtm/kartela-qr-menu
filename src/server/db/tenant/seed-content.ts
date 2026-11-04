import "server-only";

import { count, eq } from "drizzle-orm";

import { DISPLAY_TIME_ZONE } from "@/lib/format";
import { businessDate, nextDayEnd } from "@/platform/menu/availability";
import type { MenuContent } from "@/platform/menu/content";

import { withVenue } from "./scope";
import {
  dailyMenuEntries,
  itemAvailability,
  itemOptionGroups,
  itemPrices,
  itemRelations,
  items,
  mediaAssets,
  menus,
  menuSections,
  optionGroups,
  optionRules,
  options as optionsTable,
  sectionItems,
  setComponents,
  stories,
  storyItems,
  tastingCourses,
} from "./tables";

export type SeedContentResult =
  | {
      written: true;
      images: number;
      optionGroups: number;
      stories: number;
      items: number;
      menus: number;
    }
  | { written: false; reason: "venue already has a menu" };

/**
 * Writes a venue's content file (D-04) in one transaction of the venue's own scope. By default
 * only a venue without menus is written, so a deploy never overwrites what the panel changed;
 * `replace` deletes the venue's menu data first (db:reset, content development).
 *
 * Sort orders follow the file: the order of menus, sections, placements and price lines.
 * Time-relative content (a sold-out mark "today", today's remaining count, the daily menu's next
 * `days` business dates) is anchored at `now` in the venue's time zone (P-01: day ends at 04:00).
 */
export async function seedVenueContent(
  venueId: string,
  content: MenuContent,
  options: { replace?: boolean; now?: Date; timeZone?: string } = {},
): Promise<SeedContentResult> {
  const now = options.now ?? new Date();
  const timeZone = options.timeZone ?? DISPLAY_TIME_ZONE;
  const today = businessDate(now, timeZone);
  return withVenue(venueId, async (tx) => {
    if (options.replace) {
      // Children cascade: sections → placements, items → prices. Stories and items before
      // images (cover and photo keys have no cascade).
      await tx.delete(stories).where(eq(stories.venueId, venueId));
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
    await writeAvailabilityAndRelations();
    await writeStories();

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

      if (menu.daily) {
        const entries = Array.from({ length: menu.daily.days }, (_, offset) => {
          const date = addDays(today, offset);
          return { date, slugs: menu.daily?.weekdays[String(isoWeekday(date)) as "1"] ?? [] };
        }).flatMap(({ date, slugs }) =>
          slugs.map((slug, sort) => ({
            venueId,
            menuId: menuRow.id,
            onDate: date,
            itemId: itemId(slug),
            sort,
          })),
        );
        if (entries.length > 0) await tx.insert(dailyMenuEntries).values(entries);
      }

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
      stories: content.stories.length,
      images: imageEntries.length,
      items: content.items.length,
      menus: content.menus.length,
    };

    /** Keşfet stories with their products (D-07); stops numbered in file order per collection. */
    async function writeStories(): Promise<void> {
      const nextStop = new Map<string, number>();
      for (const [sort, story] of content.stories.entries()) {
        let chapterNo: number | null = null;
        if (story.collection && (story.kind === "chapter" || story.kind === "guide")) {
          chapterNo = story.stop ?? (nextStop.get(story.collection) ?? 0) + 1;
          nextStop.set(story.collection, chapterNo);
        }
        const [row] = await tx
          .insert(stories)
          .values({
            venueId,
            slug: story.slug,
            kind: story.kind,
            collection: story.collection ?? null,
            chapterNo,
            title: story.title,
            summary: story.summary ?? null,
            bodyMd: story.body,
            coverId: story.cover ? lookup(imageIds, story.cover) : null,
            galleryIds: story.gallery.map((key) => lookup(imageIds, key)),
            status: story.status,
            sort,
          })
          .returning({ id: stories.id });
        if (!row) throw new Error(`Hikâye yazılamadı: ${story.slug}`);
        if (story.items.length > 0) {
          await tx.insert(storyItems).values(
            story.items.map((slug, itemSort) => ({
              venueId,
              storyId: row.id,
              itemId: itemId(slug),
              sort: itemSort,
            })),
          );
        }
      }
    }

    /** Availability rows and the relations between products (D-06). */
    async function writeAvailabilityAndRelations(): Promise<void> {
      const availability = content.items.flatMap((item) => {
        const a = item.availability;
        if (!a) return [];
        return [
          {
            venueId,
            itemId: itemId(item.slug),
            soldOutUntil: a.soldOut === "today" ? nextDayEnd(now, timeZone) : null,
            soldOutIndefinitely: a.soldOut === "indefinite",
            dailyLimit: a.dailyLimit ?? null,
            remaining: a.remainingToday ?? null,
            remainingOn: a.remainingToday === undefined ? null : today,
            releaseTimes: a.releaseTimes ?? [],
            seasons: a.seasons ?? null,
            outsideSeason: a.outsideSeason,
          },
        ];
      });
      if (availability.length > 0) await tx.insert(itemAvailability).values(availability);

      const relations = content.items.flatMap((item) => [
        ...item.pairings.map((pairing, sort) => ({
          venueId,
          fromItemId: itemId(item.slug),
          toItemId: itemId(pairing.item),
          kind: "pairing",
          note: pairing.note ?? null,
          sort,
        })),
        ...item.suggestions.map((slug, sort) => ({
          venueId,
          fromItemId: itemId(item.slug),
          toItemId: itemId(slug),
          kind: "suggestion",
          note: null,
          sort,
        })),
      ]);
      if (relations.length > 0) await tx.insert(itemRelations).values(relations);

      const components = content.items.flatMap((item) =>
        item.components.map((component, sort) => ({
          venueId,
          setItemId: itemId(item.slug),
          componentItemId: itemId(component.item),
          qty: component.qty,
          sort,
        })),
      );
      if (components.length > 0) await tx.insert(setComponents).values(components);

      const courses = content.items.flatMap((item) =>
        item.courses.map((course, index) => ({
          venueId,
          tastingItemId: itemId(item.slug),
          courseNo: index + 1,
          title: course.title,
          itemId: course.item ? itemId(course.item) : null,
          description: course.description ?? null,
        })),
      );
      if (courses.length > 0) await tx.insert(tastingCourses).values(courses);
    }

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

/** "2026-11-06" + 3 days → "2026-11-09" (calendar dates; no time zone involved). */
function addDays(date: string, days: number): string {
  const at = new Date(`${date}T12:00:00Z`);
  at.setUTCDate(at.getUTCDate() + days);
  return at.toISOString().slice(0, 10);
}

/** ISO weekday of a calendar date: 1 = Monday … 7 = Sunday. */
function isoWeekday(date: string): number {
  const day = new Date(`${date}T12:00:00Z`).getUTCDay();
  return day === 0 ? 7 : day;
}
