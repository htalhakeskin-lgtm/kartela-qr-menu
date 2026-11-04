import "server-only";

import { getVenue, localeHomePath, venueOrigin, venuesForTheme } from "@/platform/tenant/registry";
import type { ThemeId, VenueRecord } from "@/platform/tenant/registry-schema";

/**
 * robots.txt, sitemap.xml and manifest.webmanifest of a venue, served from its own theme tree
 * (ADR-0003) at its own domain: the host rewrites map /robots.txt etc. on a venue host here
 * (ADR-0002 v2). Venues never list or link each other (plan §15).
 *
 * Skeleton in D-01: D-11 adds the venue's pages to the sitemap and the canonical metadata,
 * D-13 the offline icons and scope details of the manifest.
 */

/** Theme colours used before the theme module contract exists (D-08 moves them to ThemeModule.meta). */
const THEME_META: Record<ThemeId, { themeColor: string; backgroundColor: string }> = {
  rakim: { themeColor: "#f3f1ec", backgroundColor: "#f3f1ec" },
  sade: { themeColor: "#ffffff", backgroundColor: "#ffffff" },
};

/** Static params of a theme tree's [mekan] segment (file routes). */
export function themeVenueParams(theme: ThemeId): { mekan: string }[] {
  return venuesForTheme(theme).map((venue) => ({ mekan: venue.slug }));
}

function venueOf(theme: ThemeId, slug: string): VenueRecord | undefined {
  const venue = getVenue(slug);
  return venue?.theme === theme ? venue : undefined;
}

const notFound = () => new Response("Bulunamadı", { status: 404 });

export function venueRobots(theme: ThemeId, slug: string): Response {
  const venue = venueOf(theme, slug);
  if (!venue) return notFound();
  const lines =
    venue.mode === "demo"
      ? ["User-Agent: *", "Disallow: /"]
      : [
          "User-Agent: *",
          "Allow: /",
          "Disallow: /api/",
          "",
          `Sitemap: ${venueOrigin(venue)}/sitemap.xml`,
        ];
  return new Response(`${lines.join("\n")}\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

export function venueSitemap(theme: ThemeId, slug: string): Response {
  const venue = venueOf(theme, slug);
  if (!venue) return notFound();
  const origin = venueOrigin(venue);
  const urls = venue.locales
    .map((locale) => `  <url><loc>${origin}${localeHomePath(venue, locale)}</loc></url>`)
    .join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}

export function venueManifest(theme: ThemeId, slug: string): Response {
  const venue = venueOf(theme, slug);
  if (!venue) return notFound();
  const meta = THEME_META[theme];
  const manifest = {
    name: venue.name,
    short_name: venue.name,
    lang: venue.defaultLocale,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: meta.backgroundColor,
    theme_color: meta.themeColor,
    icons: [],
  };
  return Response.json(manifest, {
    headers: { "Content-Type": "application/manifest+json; charset=utf-8" },
  });
}
