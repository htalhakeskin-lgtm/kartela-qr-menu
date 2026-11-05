import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { uiText } from "@/platform/i18n/ui";
import { getVenue, isVenueRoute } from "@/platform/tenant/registry";
import type { Locale } from "@/platform/tenant/registry-schema";
import { ExplorePage } from "@/platform/theme/base/explore";
import { baseExploreSlots } from "@/platform/theme/base/explore-slots";
import { getVenueView } from "@/server/menu/venue-view";

/**
 * Sade's Keşfet (SCR-002, D-10): the venue's stories, rendered on the server. Layout "akis"; a
 * venue's choice (akis / dergi) arrives with its theme configuration (D-39).
 */
type Params = { params: Promise<{ mekan: string; dil: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { mekan, dil } = await params;
  const venue = getVenue(mekan);
  if (!venue) return {};
  return { title: `${venue.name} · ${uiText(dil as Locale).explore}` };
}

export default async function SadeExplorePage({ params }: Params) {
  const { mekan, dil } = await params;
  if (!isVenueRoute("sade", mekan, dil)) notFound();
  const view = await getVenueView(mekan, dil as Locale);
  if (!view) notFound();
  return <ExplorePage venue={view} slots={baseExploreSlots} layout="akis" />;
}
