import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { isVenueRoute } from "@/platform/tenant/registry";
import type { Locale } from "@/platform/tenant/registry-schema";
import { ExplorePage } from "@/platform/theme/base/explore";
import { venuePageMetadata } from "@/server/menu/venue-page";
import { getVenueView } from "@/server/menu/venue-view";
import { rakimExploreSlots } from "@/themes/rakim/slots/page-slots";

/**
 * Rakım's Keşfet (SCR-002, D-15): the magazine layout (plan §11.5): origin chapters, brewing
 * guides, the bakery partner, the barista note. Rendered on the server; no story code reaches
 * the browser (K-34).
 */
type Params = { params: Promise<{ mekan: string; dil: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { mekan, dil } = await params;
  return venuePageMetadata("rakim", mekan, dil, "kesfet");
}

export default async function RakimExplorePage({ params }: Params) {
  const { mekan, dil } = await params;
  if (!isVenueRoute("rakim", mekan, dil)) notFound();
  const view = await getVenueView(mekan, dil as Locale);
  if (!view) notFound();
  return <ExplorePage venue={view} slots={rakimExploreSlots} layout="dergi" />;
}
