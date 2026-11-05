import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/common/safe-html";
import { jsonLd } from "@/lib/seo";
import { venueJsonLd } from "@/platform/routes/venue-seo";
import { getVenue, isVenueRoute } from "@/platform/tenant/registry";
import type { Locale } from "@/platform/tenant/registry-schema";
import { venuePageMetadata } from "@/server/menu/venue-page";
import { getVenueView } from "@/server/menu/venue-view";
import { SadeQuickMenu } from "@/themes/sade/client";

/**
 * Sade's quick menu (SCR-001, D-09): the venue's menu from the database (getVenueView, cached under
 * menu:{slug}) rendered by the base slots. Static: the whole menu is in the HTML; the clock,
 * filters, search, sheets and Seçtiklerim run in the browser (ADR-0005). Metadata, hreflang and
 * the business with its menu as JSON-LD (D-11).
 */
type Params = { params: Promise<{ mekan: string; dil: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { mekan, dil } = await params;
  return venuePageMetadata("sade", mekan, dil, "menu");
}

export default async function SadeQuickMenuPage({ params }: Params) {
  const { mekan, dil } = await params;
  const venue = getVenue(mekan);
  if (!venue || !isVenueRoute("sade", mekan, dil)) notFound();
  const view = await getVenueView(mekan, dil as Locale);
  if (!view) notFound();
  return (
    <>
      <JsonLd json={jsonLd(venueJsonLd(view, venue, "menu"))} />
      <SadeQuickMenu venue={view} />
    </>
  );
}
