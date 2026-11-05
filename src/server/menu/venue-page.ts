import "server-only";

import type { Metadata } from "next";

import { uiText } from "@/platform/i18n/ui";
import { venueMetadata, type VenuePage } from "@/platform/routes/venue-seo";
import { getVenue, isVenueRoute } from "@/platform/tenant/registry";
import type { Locale, ThemeId } from "@/platform/tenant/registry-schema";

import { getVenueView } from "./venue-view";

/**
 * generateMetadata of a venue page, shared by every theme tree (D-11). The description is the
 * venue's own (venue_settings.seo); without one, the page's label and the venue's name. Reads the
 * same cached view as the page, so the database is asked once per page and language.
 */
export async function venuePageMetadata(
  theme: ThemeId,
  slug: string,
  dil: string,
  page: VenuePage,
): Promise<Metadata> {
  const venue = getVenue(slug);
  if (!venue || !isVenueRoute(theme, slug, dil)) return {};
  const locale = dil as Locale;
  const view = await getVenueView(slug, locale);
  const ui = uiText(locale);
  const label = page === "menu" ? ui.menu : page === "kesfet" ? ui.explore : ui.info;
  return venueMetadata({
    venue,
    locale,
    page,
    description: view?.info?.description?.text ?? `${venue.name} · ${label}`,
  });
}
