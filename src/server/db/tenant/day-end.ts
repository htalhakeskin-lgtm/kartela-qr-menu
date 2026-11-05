import "server-only";

import { and, isNotNull, lte } from "drizzle-orm";

import type { TenantTx } from "./scope";
import { itemAvailability } from "./tables";

/**
 * Day-end housekeeping of one venue (P-01, BR-MST-001): sold-out marks whose end has passed are
 * removed, so the panel and the next build show the product as available. The menu page already
 * hides an expired mark in the browser; this keeps the stored state honest. Indefinite marks stay.
 * Returns how many marks were cleared.
 */
export async function clearExpiredSoldOut(tx: TenantTx, now: Date): Promise<number> {
  const cleared = await tx
    .update(itemAvailability)
    .set({ soldOutUntil: null })
    .where(and(isNotNull(itemAvailability.soldOutUntil), lte(itemAvailability.soldOutUntil, now)))
    .returning({ id: itemAvailability.id });
  return cleared.length;
}
