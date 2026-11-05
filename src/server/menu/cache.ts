import "server-only";

import { revalidateTag, updateTag } from "next/cache";

import { type CacheKind, venueTag } from "@/platform/tenant/cache-tags";

/**
 * Refreshing a venue's static pages (ADR-0005, REQ-016, BR-KRC-005). Menu pages are built once and
 * cached under tags that carry the venue's slug; only that venue's pages are touched.
 *
 * - After a panel write (Server Action): `updateTag` — the writer's next request already reads
 *   the new data (read-your-own-writes), every guest's next request gets the fresh page.
 * - From the day-end cron (Route Handler, where updateTag is not allowed): `revalidateTag` with the
 *   "max" profile — the first visit after 04:00 still gets yesterday's page while the new one is
 *   built. The browser applies the clock to it anyway (sold-out marks expire, today's daily menu
 *   is picked from the entries the page carries), so nobody sees a wrong state.
 */
export function refreshAfterWrite(slug: string, kinds: readonly CacheKind[]): void {
  for (const kind of kinds) updateTag(venueTag(kind, slug));
}

export function refreshForNewDay(slugs: readonly string[], kinds: readonly CacheKind[]): void {
  for (const slug of slugs) {
    for (const kind of kinds) revalidateTag(venueTag(kind, slug), "max");
  }
}
