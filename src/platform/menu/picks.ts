import { PICKS_TTL_HOURS } from "../../config/limits";

/**
 * Seçtiklerim (REQ-013, BR-SEC-001, D-08): what the guest wants to order, kept in the browser
 * only (no account, no server), per venue, for 24 hours (P-03). The waiter view shows it in large
 * type. A product removed from the menu stays in the list as "artık menüde yok".
 */
export type StoredPick = {
  key: string;
  itemId: string;
  priceId: string | null;
  optionIds: string[];
  qty: number;
  addedAt: string;
};

export const picksStorageKey = (venueSlug: string) => `kartela:secim:${venueSlug}`;

/** The same product with the same size and options is one line with a quantity. */
export function pickKey(
  itemId: string,
  priceId: string | null,
  optionIds: readonly string[],
): string {
  return [itemId, priceId ?? "-", [...optionIds].sort().join(",")].join("|");
}

/** Parses what localStorage held; anything unreadable is an empty list. */
export function parseStoredPicks(raw: string | null): StoredPick[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    return value.filter(
      (pick): pick is StoredPick =>
        typeof pick === "object" &&
        pick !== null &&
        typeof (pick as StoredPick).itemId === "string" &&
        typeof (pick as StoredPick).key === "string" &&
        typeof (pick as StoredPick).addedAt === "string" &&
        Number.isInteger((pick as StoredPick).qty),
    );
  } catch {
    return [];
  }
}

/** BR-SEC-001: lines older than 24 hours are dropped. */
export function prunePicks(picks: readonly StoredPick[], now: Date): StoredPick[] {
  const oldest = now.getTime() - PICKS_TTL_HOURS * 3_600_000;
  return picks.filter((pick) => new Date(pick.addedAt).getTime() >= oldest);
}

export function addPick(
  picks: readonly StoredPick[],
  pick: Omit<StoredPick, "key" | "qty" | "addedAt">,
  now: Date,
): StoredPick[] {
  const key = pickKey(pick.itemId, pick.priceId, pick.optionIds);
  const existing = picks.find((line) => line.key === key);
  if (existing) {
    return picks.map((line) =>
      line.key === key ? { ...line, qty: line.qty + 1, addedAt: now.toISOString() } : line,
    );
  }
  return [...picks, { ...pick, key, qty: 1, addedAt: now.toISOString() }];
}

export function changeQty(picks: readonly StoredPick[], key: string, delta: number): StoredPick[] {
  return picks.flatMap((line) => {
    if (line.key !== key) return [line];
    const qty = line.qty + delta;
    return qty > 0 ? [{ ...line, qty }] : [];
  });
}

/** Lines with their product; a product no longer on the menu comes back as `item: null`. */
export function resolvePicks<T>(
  picks: readonly StoredPick[],
  items: ReadonlyMap<string, T>,
): { pick: StoredPick; item: T | null }[] {
  return picks.map((pick) => ({ pick, item: items.get(pick.itemId) ?? null }));
}
