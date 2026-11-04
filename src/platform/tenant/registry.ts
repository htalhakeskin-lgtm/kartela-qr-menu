import { venueRecords } from "../../../content/mekanlar";
import {
  type Locale,
  parseRegistry,
  RTL_LOCALES,
  type ThemeId,
  type VenueRecord,
} from "./registry-schema";

/**
 * The validated venue registry (ADR-0002 v2). Imported by next.config.ts (relative imports only,
 * no "server-only", no env.ts) and by the theme trees for static params and venue metadata.
 *
 * Fixtures (test venues) are left out of the production build, so their hosts never route there.
 */
// eslint-disable-next-line no-restricted-properties -- build-time constant set by Vercel; env.ts cannot load in next.config
const isProductionBuild = process.env.VERCEL_ENV === "production";

export const venues: readonly VenueRecord[] = parseRegistry(venueRecords).filter(
  (venue) => !(isProductionBuild && venue.fixture),
);

export function getVenue(slug: string): VenueRecord | undefined {
  return venues.find((venue) => venue.slug === slug);
}

export function venuesForTheme(theme: ThemeId): VenueRecord[] {
  return venues.filter((venue) => venue.theme === theme);
}

/** Static params of a theme tree's [mekan]/[dil] segments. */
export function themeLocaleParams(theme: ThemeId): { mekan: string; dil: Locale }[] {
  return localeParamsOf(venues, theme);
}

/**
 * Placeholder venue of a theme tree that has no venue in this build (e.g. Sade in production,
 * where only the fixture uses it). With Cache Components every generateStaticParams must return
 * at least one entry; this one is not in the registry, so its page and files answer 404.
 * The host rewrites never route to it.
 */
export const EMPTY_THEME_SLUG = "-";

/** Pure form of themeLocaleParams, testable with any venue list (registry.test.ts). */
export function localeParamsOf(
  list: readonly VenueRecord[],
  theme: ThemeId,
): { mekan: string; dil: Locale }[] {
  const params = list
    .filter((venue) => venue.theme === theme)
    .flatMap((venue) => venue.locales.map((dil) => ({ mekan: venue.slug, dil })));
  return params.length > 0 ? params : [{ mekan: EMPTY_THEME_SLUG, dil: "tr" }];
}

/** Static params of a theme tree's [mekan] segment (file routes), never empty. */
export function venueParamsOf(list: readonly VenueRecord[], theme: ThemeId): { mekan: string }[] {
  const params = list
    .filter((venue) => venue.theme === theme)
    .map((venue) => ({ mekan: venue.slug }));
  return params.length > 0 ? params : [{ mekan: EMPTY_THEME_SLUG }];
}

/** True when the slug belongs to this theme and serves this locale (else the page 404s). */
export function isVenueRoute(theme: ThemeId, slug: string, locale: string): boolean {
  const venue = getVenue(slug);
  return Boolean(venue && venue.theme === theme && (venue.locales as string[]).includes(locale));
}

export function isRtl(locale: string): boolean {
  return (RTL_LOCALES as readonly string[]).includes(locale);
}

/** Local development host of a venue (rakim.localhost); Chromium resolves *.localhost itself. */
export function localHost(venue: VenueRecord): string {
  return `${venue.slug}.localhost`;
}

/**
 * Canonical origin of a venue: its first production domain. Fixtures have none and use their
 * local host on the project's dev port (plan K-30).
 */
export function venueOrigin(venue: VenueRecord): string {
  const primary = venue.domains[0];
  return primary ? `https://${primary}` : `http://${localHost(venue)}:3020`;
}

/** Path of a locale's home on the venue's own domain: "/" for the default, "/en" otherwise. */
export function localeHomePath(venue: VenueRecord, locale: Locale): string {
  return locale === venue.defaultLocale ? "/" : `/${locale}`;
}

/**
 * Short, stable fingerprint of the routed registry; /api/health returns it so a deploy can be
 * checked for the domain map it carries (ADR-0002). FNV-1a: no crypto module in any bundle.
 */
export const registryVersion: string = (() => {
  let hash = 0x811c9dc5;
  for (const char of JSON.stringify(venues)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
})();
