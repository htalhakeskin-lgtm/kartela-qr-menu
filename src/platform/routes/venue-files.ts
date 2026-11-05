import "server-only";

import { getVenue, venueOrigin, venueParamsOf, venues } from "@/platform/tenant/registry";
import type { ThemeId, VenueRecord } from "@/platform/tenant/registry-schema";
import { themeMeta } from "@/themes/meta";

import { type VenuePage, venuePath } from "./venue-seo";

/**
 * robots.txt, sitemap.xml and manifest.webmanifest of a venue, served from its own theme tree
 * (ADR-0003) at its own domain: the host rewrites map /robots.txt etc. on a venue host here
 * (ADR-0002 v2). Venues never list or link each other (plan §15).
 *
 * D-11 lists the venue's pages with their language alternates; D-13 adds the offline icons and
 * scope details of the manifest.
 */

/** Static params of a theme tree's [mekan] segment (file routes). */
export function themeVenueParams(theme: ThemeId): { mekan: string }[] {
  return venueParamsOf(venues, theme);
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
  // Every page in every language, each with its alternates (hreflang + x-default), as on the page.
  const pages: VenuePage[] = ["menu", "kesfet", "bilgi"];
  const urls = pages.flatMap((page) => {
    const alternates = [
      ...venue.locales.map((other) => [other, venuePath(venue, other, page)] as const),
      ["x-default", venuePath(venue, venue.defaultLocale, page)] as const,
    ]
      .map(
        ([lang, path]) =>
          `    <xhtml:link rel="alternate" hreflang="${lang}" href="${origin}${path}"/>`,
      )
      .join("\n");
    return venue.locales.map(
      (locale) =>
        `  <url>\n    <loc>${origin}${venuePath(venue, locale, page)}</loc>\n${alternates}\n  </url>`,
    );
  });
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join("\n")}\n</urlset>\n`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}

export function venueManifest(theme: ThemeId, slug: string): Response {
  const venue = venueOf(theme, slug);
  if (!venue) return notFound();
  const { color } = themeMeta[theme].tokens;
  const manifest = {
    name: venue.name,
    short_name: venue.name,
    lang: venue.defaultLocale,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: color.background,
    theme_color: color.background,
    icons: [],
  };
  return Response.json(manifest, {
    headers: { "Content-Type": "application/manifest+json; charset=utf-8" },
  });
}
