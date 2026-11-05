import "server-only";

import { eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";

import { businessDate } from "@/platform/menu/availability";
import { buildVenueView, type VenueView } from "@/platform/menu/view";
import { venueTag } from "@/platform/tenant/cache-tags";
import { getVenue, isRtl, venueHostNames } from "@/platform/tenant/registry";
import type { Locale, VenueKind } from "@/platform/tenant/registry-schema";
import { db } from "@/server/db/client";
import { venues } from "@/server/db/schema";
import {
  loadVenueInfo,
  loadVenueMedia,
  loadVenueMenu,
  loadVenueStories,
  withVenue,
} from "@/server/db/tenant";

/**
 * A venue's menu as its theme renders it (ADR-0003, ADR-0005, D-08): read once at build time for
 * each page language and cached until the venue's `menu:{slug}` tag is updated (panel writes,
 * D-12; the daily 04:00 cron refreshes the menu of the day). Null when the venue is not in the
 * database: the page then answers 404.
 *
 * Daily menu entries from yesterday's business date on: the page lives until the next refresh,
 * the browser picks today's (BR-MST-005).
 */
export async function getVenueView(slug: string, locale: Locale): Promise<VenueView | null> {
  "use cache";
  cacheLife("max");
  cacheTag(venueTag("menu", slug), venueTag("stories", slug));

  const [venue] = await db.select().from(venues).where(eq(venues.slug, slug)).limit(1);
  if (!venue || venue.status !== "active") return null;

  const record = getVenue(slug);
  const now = new Date();
  const dailyFrom = businessDate(new Date(now.getTime() - 86_400_000), venue.timezone);
  const data = await withVenue(venue.id, async (tx) => ({
    menu: await loadVenueMenu(tx, venue.id, { dailyFrom }),
    stories: await loadVenueStories(tx, venue.id),
    media: await loadVenueMedia(tx, venue.id),
    info: await loadVenueInfo(tx, venue.id),
  }));

  return buildVenueView(
    {
      venue: {
        slug: venue.slug,
        name: venue.name,
        kind: venue.kind as VenueKind,
        mode: venue.mode === "live" ? "live" : "demo",
        defaultLocale: venue.defaultLocale as Locale,
        locales: venue.locales as Locale[],
        timeZone: venue.timezone,
        hosts: record ? venueHostNames(record) : [],
      },
      ...data,
    },
    locale,
    { rtl: isRtl(locale) },
  );
}
