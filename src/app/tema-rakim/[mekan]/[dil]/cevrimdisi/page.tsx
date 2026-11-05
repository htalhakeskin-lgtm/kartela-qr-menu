import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { uiText } from "@/platform/i18n/ui";
import { getVenue, isVenueRoute, localeHomePath } from "@/platform/tenant/registry";
import type { Locale } from "@/platform/tenant/registry-schema";
import { OfflinePage } from "@/platform/theme/base/offline-page";

/** The venue's offline page (SCR-009, D-13): stored by the service worker, never indexed. */
type Params = { params: Promise<{ mekan: string; dil: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { mekan, dil } = await params;
  const venue = getVenue(mekan);
  return {
    title: venue ? `${uiText(dil as Locale).offline} · ${venue.name}` : undefined,
    robots: { index: false, follow: false },
  };
}

export default async function RakimOfflinePage({ params }: Params) {
  const { mekan, dil } = await params;
  const venue = getVenue(mekan);
  if (!venue || !isVenueRoute("rakim", mekan, dil)) notFound();
  const locale = dil as Locale;
  return (
    <OfflinePage locale={locale} venueName={venue.name} homePath={localeHomePath(venue, locale)} />
  );
}
