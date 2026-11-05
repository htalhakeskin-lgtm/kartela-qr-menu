import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/common/safe-html";
import { jsonLd } from "@/lib/seo";
import { venueJsonLd } from "@/platform/routes/venue-seo";
import { getVenue, isVenueRoute } from "@/platform/tenant/registry";
import type { Locale } from "@/platform/tenant/registry-schema";
import { InfoPage } from "@/platform/theme/base/info";
import { baseInfoSlots } from "@/platform/theme/base/info-slots";
import { venuePageMetadata } from "@/server/menu/venue-page";
import { getVenueView } from "@/server/menu/venue-view";

/**
 * Sade's information page (SCR-005, D-11): address, hours, contact, Wi-Fi, questions and the legal
 * notes, rendered on the server; only the "today" mark of the hours table runs in the browser.
 */
type Params = { params: Promise<{ mekan: string; dil: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { mekan, dil } = await params;
  return venuePageMetadata("sade", mekan, dil, "bilgi");
}

export default async function SadeInfoPage({ params }: Params) {
  const { mekan, dil } = await params;
  const venue = getVenue(mekan);
  if (!venue || !isVenueRoute("sade", mekan, dil)) notFound();
  const view = await getVenueView(mekan, dil as Locale);
  if (!view) notFound();
  return (
    <>
      <JsonLd json={jsonLd(venueJsonLd(view, venue, "bilgi"))} />
      <InfoPage venue={view} slots={baseInfoSlots} />
    </>
  );
}
