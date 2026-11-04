import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { uiText } from "@/platform/i18n/ui";
import { getVenue, isVenueRoute } from "@/platform/tenant/registry";
import type { Locale } from "@/platform/tenant/registry-schema";
import { getVenueView } from "@/server/menu/venue-view";
import { SadeQuickMenu } from "@/themes/sade/client";

/**
 * Sade's quick menu (SCR-001, D-09): the venue's menu from the database (getVenueView, cached under
 * menu:{slug}) rendered by the base slots. Static: the whole menu is in the HTML; the clock,
 * filters, search, sheets and Seçtiklerim run in the browser (ADR-0005). D-11 adds the venue's
 * metadata (canonical, hreflang, JSON-LD, share image).
 */
type Params = { params: Promise<{ mekan: string; dil: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { mekan, dil } = await params;
  const venue = getVenue(mekan);
  if (!venue) return {};
  return { title: `${venue.name} · ${uiText(dil as Locale).menu}` };
}

export default async function SadeQuickMenuPage({ params }: Params) {
  const { mekan, dil } = await params;
  if (!isVenueRoute("sade", mekan, dil)) notFound();
  const view = await getVenueView(mekan, dil as Locale);
  if (!view) notFound();
  return <SadeQuickMenu venue={view} />;
}
