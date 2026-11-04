import "server-only";

import { and, asc, eq, inArray } from "drizzle-orm";

import type { MediaAsset, Story } from "@/platform/menu/types";
import type { StoryKind } from "@/platform/menu/vocabulary";

import type { TenantTx } from "./scope";
import { mediaAssets, stories, storyItems } from "./tables";

/**
 * Keşfet read model (D-07): a venue's stories in their order, each with its products. Run inside
 * withVenue(venueId, …). Drafts and archived stories stay out unless `includeDrafts`.
 */
export async function loadVenueStories(
  tx: TenantTx,
  venueId: string,
  options: { includeDrafts?: boolean } = {},
): Promise<Story[]> {
  const statuses = options.includeDrafts ? ["published", "draft"] : ["published"];
  const [storyRows, linkRows] = await Promise.all([
    tx
      .select()
      .from(stories)
      .where(and(eq(stories.venueId, venueId), inArray(stories.status, statuses)))
      .orderBy(asc(stories.sort), asc(stories.slug)),
    tx
      .select({ storyId: storyItems.storyId, itemId: storyItems.itemId })
      .from(storyItems)
      .where(eq(storyItems.venueId, venueId))
      .orderBy(asc(storyItems.sort), asc(storyItems.id)),
  ]);
  const itemsByStory = new Map<string, string[]>();
  for (const link of linkRows) {
    itemsByStory.set(link.storyId, [...(itemsByStory.get(link.storyId) ?? []), link.itemId]);
  }
  return storyRows.map((row) => ({
    id: row.id,
    slug: row.slug,
    kind: row.kind as StoryKind,
    collection: row.collection,
    stop: row.chapterNo,
    title: row.title,
    summary: row.summary,
    body: row.bodyMd,
    coverId: row.coverId,
    galleryIds: row.galleryIds,
    itemIds: itemsByStory.get(row.id) ?? [],
  }));
}

/** The venue's image register by id: what a theme needs to render a photo (src, size, alt). */
export async function loadVenueMedia(
  tx: TenantTx,
  venueId: string,
): Promise<Record<string, MediaAsset>> {
  const rows = await tx.select().from(mediaAssets).where(eq(mediaAssets.venueId, venueId));
  return Object.fromEntries(
    rows.map((row) => [
      row.id,
      {
        id: row.id,
        source: row.source as MediaAsset["source"],
        url: row.url,
        width: row.width,
        height: row.height,
        alt: row.alt,
        focalX: row.focalX,
        focalY: row.focalY,
        photographer: row.photographer,
        sourcePage: row.sourcePage,
        license: row.license,
      },
    ]),
  );
}
