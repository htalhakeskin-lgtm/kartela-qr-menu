import "server-only";

import { and, asc, eq } from "drizzle-orm";

import type { TenantTx } from "./scope";
import { dailyMenuEntries, itemAvailability, items, menus } from "./tables";

/**
 * Availability writes from the panel (D-20; BR-MST-001…005). Always inside a venueAction's
 * transaction: row level security keeps every read and write to the acting venue.
 */
export type AvailabilityRow = typeof itemAvailability.$inferSelect;
export type AvailabilityPatch = Partial<
  Pick<
    AvailabilityRow,
    | "soldOutUntil"
    | "soldOutIndefinitely"
    | "dailyLimit"
    | "remaining"
    | "remainingOn"
    | "releaseTimes"
  >
>;

/** The product (published or not) and its availability row, if any. */
export async function itemWithAvailability(
  tx: TenantTx,
  itemId: string,
): Promise<{ name: string; availability: AvailabilityRow | null } | null> {
  const [item] = await tx
    .select({ name: items.name })
    .from(items)
    .where(eq(items.id, itemId))
    .limit(1);
  if (!item) return null;
  const [availability] = await tx
    .select()
    .from(itemAvailability)
    .where(eq(itemAvailability.itemId, itemId))
    .limit(1);
  return { name: item.name.tr, availability: availability ?? null };
}

/**
 * Update first, insert only for a product without a row: PostgreSQL checks an INSERT's row
 * against ck_item_availability_count before ON CONFLICT is considered, so an upsert of a partial
 * change (only `remaining`) would fail on a product that already has a daily limit.
 */
export async function saveAvailability(
  tx: TenantTx,
  venueId: string,
  itemId: string,
  patch: AvailabilityPatch,
): Promise<void> {
  const updated = await tx
    .update(itemAvailability)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(itemAvailability.itemId, itemId))
    .returning({ id: itemAvailability.id });
  if (updated.length === 0) await tx.insert(itemAvailability).values({ venueId, itemId, ...patch });
}

export async function dailyMenus(tx: TenantTx): Promise<{ id: string; name: string }[]> {
  const rows = await tx
    .select({ id: menus.id, name: menus.name })
    .from(menus)
    .where(eq(menus.kind, "daily"))
    .orderBy(asc(menus.sort));
  return rows.map((row) => ({ id: row.id, name: row.name.tr }));
}

export async function dailyItemIds(
  tx: TenantTx,
  menuId: string,
  onDate: string,
): Promise<string[]> {
  const rows = await tx
    .select({ itemId: dailyMenuEntries.itemId })
    .from(dailyMenuEntries)
    .where(and(eq(dailyMenuEntries.menuId, menuId), eq(dailyMenuEntries.onDate, onDate)))
    .orderBy(asc(dailyMenuEntries.sort));
  return rows.map((row) => row.itemId);
}

/** BR-MST-005: the day's products replace the ones saved before, in the given order. */
export async function replaceDailyItems(
  tx: TenantTx,
  venueId: string,
  menuId: string,
  onDate: string,
  itemIds: readonly string[],
): Promise<void> {
  await tx
    .delete(dailyMenuEntries)
    .where(and(eq(dailyMenuEntries.menuId, menuId), eq(dailyMenuEntries.onDate, onDate)));
  if (itemIds.length === 0) return;
  await tx
    .insert(dailyMenuEntries)
    .values(itemIds.map((itemId, sort) => ({ venueId, menuId, onDate, itemId, sort })));
}
