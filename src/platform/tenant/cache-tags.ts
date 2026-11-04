/**
 * Cache tags (ADR-0004, BR-KRC-005): every tag carries the venue slug, so one venue's update
 * refreshes only its own pages. A slug never contains ":" (registry-schema), so tags cannot collide.
 */
export const CACHE_KINDS = ["menu", "venue", "stories", "stats"] as const;
export type CacheKind = (typeof CACHE_KINDS)[number];

export function venueTag(kind: CacheKind, slug: string): string {
  return `${kind}:${slug}`;
}
