import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { isVenueRoute } from "@/platform/tenant/registry";
import type { Locale } from "@/platform/tenant/registry-schema";
import { ExplorePage } from "@/platform/theme/base/explore";
import { baseExploreSlots } from "@/platform/theme/base/explore-slots";
import { venuePageMetadata } from "@/server/menu/venue-page";
import { getVenueView } from "@/server/menu/venue-view";

/**
 * Sade's Keşfet (SCR-002, D-10): the venue's stories, rendered on the server. Layout "akis"; a
 * venue's choice (akis / dergi) arrives with its theme configuration (D-39).
 */
type Params = { params: Promise<{ mekan: string; dil: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { mekan, dil } = await params;
  return venuePageMetadata("sade", mekan, dil, "kesfet");
}

export default async function SadeExplorePage({ params }: Params) {
  const { mekan, dil } = await params;
  if (!isVenueRoute("sade", mekan, dil)) notFound();
  const view = await getVenueView(mekan, dil as Locale);
  if (!view) notFound();
  return <ExplorePage venue={view} slots={baseExploreSlots} layout="akis" />;
}
