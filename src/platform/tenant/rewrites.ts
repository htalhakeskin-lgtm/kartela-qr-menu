import type { VenueRecord } from "./registry-schema";

/**
 * Host-based tenant routing as next.config `rewrites.beforeFiles` (ADR-0002 v2, plan K-39).
 *
 * Why not proxy.ts: in Next.js 16 the proxy runs only on the Node.js runtime, so on Vercel every
 * menu request would invoke a function before the CDN cache. Rewrites with `has: host` are
 * applied by the routing layer instead and the menu stays a static, cached page.
 *
 * beforeFiles rewrites CHAIN: after one matches, the following rules see the rewritten path
 * (Next.js docs, rewrites → "Good to know"). Hence the order below, and every rule after the
 * venue rules excludes `tema-` so it never touches an already rewritten path.
 *
 *   1. /tema-* requested directly          → 404 (BR-KRC-004; checked once, on the original path)
 *   2. venue host: files, locales, default → /tema-{theme}/{slug}/{locale}/…
 *   3. /m/{slug}/… on any other host       → same tree (path-prefixed preview, noindex header)
 *   4. ?mekan={slug} on any other host     → /api/onizleme (sets the cookie; ?mekan=platform clears)
 *   5. kartela_onizleme cookie              → same tree as 2 (panel stays reachable)
 *   (2, 3, 5 each start with the view cookie rule: kartela_gorunum=kesfet → the locale's Keşfet)
 *   6. unknown host                         → 404
 */

export const PREVIEW_COOKIE = "kartela_onizleme";

/** Hızlı ↔ Keşfet memory (D-08): "kesfet" sends the venue's home to its Keşfet page. */
export const VIEW_COOKIE = "kartela_gorunum";
export const EXPLORE_SEGMENT = "kesfet";

/** Internal destination with no route: renders the global 404 (app/global-not-found.tsx). */
export const NOT_FOUND_PATH = "/bilinmeyen-alan-adi";

type HasCondition =
  | { type: "host"; value: string }
  | { type: "query" | "cookie" | "header"; key: string; value?: string };

export type TenantRewrite = {
  source: string;
  destination: string;
  has?: HasCondition[];
  missing?: HasCondition[];
};

export type TenantHeader = { source: string; headers: { key: string; value: string }[] };

/** Next.js metadata image routes a theme tree may hold; their URLs stay public. */
const METADATA_IMAGES = ["icon", "apple-icon", "opengraph-image", "twitter-image"] as const;

/**
 * Files every venue serves from its own tree instead of the platform's root files: public path →
 * route folder under /tema-{theme}/[mekan]/. The sitemap folder must not be named sitemap.xml:
 * that is Next.js' sitemap convention, which drops the dynamic segments (/tema-rakim/-/sitemap.xml)
 * and left the venue's /sitemap.xml without a route on Vercel.
 */
const VENUE_FILES = {
  "robots.txt": "robots.txt",
  "sitemap.xml": "site-haritasi",
  "manifest.webmanifest": "manifest.webmanifest",
} as const;

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Matches any of the hosts exactly (Next.js anchors `has` values: ^value$). */
const anyHost = (hosts: readonly string[]) => `(?:${hosts.map(escapeRegex).join("|")})`;

function venueHosts(venue: VenueRecord): string[] {
  return [...venue.domains, `${venue.slug}.localhost`];
}

/** Rules that map a request path to the venue's tree, guarded by `conditions`. */
function venuePathRules(
  venue: VenueRecord,
  conditions: Pick<TenantRewrite, "has" | "missing">,
  options: { prefix?: string; excluded: string },
): TenantRewrite[] {
  const tree = `/tema-${venue.theme}/${venue.slug}`;
  const prefix = options.prefix ?? "";
  const rules: TenantRewrite[] = [];
  // The view cookie only changes a locale's home page; search engines carry no cookie and always
  // get the quick menu (ADR-0002 v2). These rules come first: the plain home rules would match too.
  const explore: HasCondition = { type: "cookie", key: VIEW_COOKIE, value: EXPLORE_SEGMENT };
  for (const locale of venue.locales) {
    const home = locale === venue.defaultLocale ? prefix || "/" : `${prefix}/${locale}`;
    rules.push({
      source: home,
      destination: `${tree}/${locale}/${EXPLORE_SEGMENT}`,
      ...conditions,
      has: [...(conditions.has ?? []), explore],
    });
  }
  for (const locale of venue.locales) {
    if (locale === venue.defaultLocale) continue;
    rules.push(
      { source: `${prefix}/${locale}`, destination: `${tree}/${locale}`, ...conditions },
      {
        source: `${prefix}/${locale}/:path*`,
        destination: `${tree}/${locale}/:path*`,
        ...conditions,
      },
    );
  }
  rules.push(
    { source: prefix || "/", destination: `${tree}/${venue.defaultLocale}`, ...conditions },
    {
      source: `${prefix}/:path((?!${options.excluded}).+)`,
      destination: `${tree}/${venue.defaultLocale}/:path`,
      ...conditions,
    },
  );
  return rules;
}

export function buildTenantRewrites(
  venues: readonly VenueRecord[],
  options: { platformHosts: readonly string[] },
): TenantRewrite[] {
  // 1. Internal tree paths requested directly answer 404 — except the tree's metadata images
  //    (icon.svg, apple-icon, opengraph-image, twitter-image): Next.js serves them at
  //    /tema-{theme}/-/-/icon.svg?… and the page links that address itself.
  const rules: TenantRewrite[] = [
    {
      source: `/:internal(tema-(?!.*/(?:${METADATA_IMAGES.join("|")})[^/]*$).*)`,
      destination: NOT_FOUND_PATH,
    },
  ];

  // 2. Venue hosts (production domains + {slug}.localhost).
  for (const venue of venues) {
    const has: HasCondition[] = [{ type: "host", value: anyHost(venueHosts(venue)) }];
    for (const [file, folder] of Object.entries(VENUE_FILES)) {
      rules.push({
        source: `/${file}`,
        destination: `/tema-${venue.theme}/${venue.slug}/${folder}`,
        has,
      });
    }
    rules.push(...venuePathRules(venue, { has }, { excluded: "_next/|api/|tema-" }));
  }

  // 3. Path-prefixed preview (/m/rakim/…), any host that is not a venue host.
  for (const venue of venues) {
    rules.push(
      ...venuePathRules(venue, {}, { prefix: `/m/${venue.slug}`, excluded: "_next/|api/" }),
    );
  }

  // 4. ?mekan= sets the preview cookie (?mekan=platform clears it), then redirects back.
  rules.push({
    source: "/:path((?!_next/|api/|tema-).*)",
    has: [{ type: "query", key: "mekan" }],
    destination: "/api/onizleme?yol=:path",
  });

  // 5. Preview cookie: the platform or preview host acts as the venue, except the panel.
  for (const venue of venues) {
    rules.push(
      ...venuePathRules(
        venue,
        { has: [{ type: "cookie", key: PREVIEW_COOKIE, value: escapeRegex(venue.slug) }] },
        { excluded: "_next/|api/|tema-|panel|m/" },
      ),
    );
  }

  // 6. Unknown host. Known: local hosts, the platform's own hosts, *.vercel.app (preview and
  //    deployment URLs of this project) and the venue hosts — their pages were rewritten in step
  //    2, but /api/* and /_next/* on a venue host are not and must still be served.
  const knownHosts = [
    "localhost",
    "127.0.0.1",
    ...options.platformHosts,
    ...venues.flatMap(venueHosts),
  ];
  const known = `(?:${knownHosts.map(escapeRegex).join("|")}|.*\\.vercel\\.app)`;
  rules.push({
    source: "/:path((?!_next/|tema-).*)",
    missing: [{ type: "host", value: known }],
    destination: NOT_FOUND_PATH,
  });

  return rules;
}

/** Path-prefixed previews are never indexed (ADR-0002); venue pages carry their own canonical. */
export function buildTenantHeaders(): TenantHeader[] {
  return [{ source: "/m/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] }];
}
