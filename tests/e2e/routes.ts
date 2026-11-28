import { venues } from "../../src/platform/tenant/registry";

/**
 * Every route the responsive, accessibility, image and SEO checks visit (07-mobil §10).
 * Adding a page = adding it here (quality gate B).
 */

/** Platform host pages (introduction, legal texts, style tile) + the global 404. */
export const publicRoutes = [
  "/",
  "/kvkk",
  "/gizlilik",
  "/cerez-politikasi",
  "/stil",
  "/bu-sayfa-yok", // global 404 (SCR-051)
] as const;

/** Port of the server under test (local and CI: 3020, plan K-30). */
// eslint-disable-next-line no-restricted-properties -- test harness setting, same variable as playwright.config.ts
const port = new URL(process.env.E2E_BASE_URL ?? "http://localhost:3020").port || "3020";

/**
 * A venue page on its own host (ADR-0002 v2): {slug}.localhost resolves to the local server in
 * Chromium, and the host rewrites open the venue's theme tree. Use with page.goto.
 */
export function venueUrl(slug: string, path = "/"): string {
  return `http://${slug}.localhost:${port}${path}`;
}

/** The same server reached with a venue Host header (APIRequestContext: Node does not resolve *.localhost everywhere). */
export function venueHost(slug: string): string {
  return `${slug}.localhost:${port}`;
}

/**
 * The venue matrix (D-22): every venue in the registry × every language × quick menu, Keşfet and
 * information, plus its style tile, its own 404 and its offline page. A new venue joins the
 * responsive, accessibility, image and SEO checks without editing this file.
 */
export const venueRoutes: readonly string[] = venues.flatMap((venue) => [
  ...venue.locales.flatMap((locale) => {
    const home = locale === venue.defaultLocale ? "" : `/${locale}`;
    return [
      venueUrl(venue.slug, home || "/"),
      venueUrl(venue.slug, `${home}/kesfet`),
      venueUrl(venue.slug, `${home}/bilgi`),
    ];
  }),
  venueUrl(venue.slug, "/stil"),
  venueUrl(venue.slug, "/yok-boyle"), // the venue's own 404 (D-11)
  venueUrl(venue.slug, "/cevrimdisi"), // the offline page (D-13)
]);

/** The 404 check route: excluded from SEO and image checks. */
export const notFoundRoute = "/bu-sayfa-yok";

/** Routes whose job is to show many images; the same file may appear twice (thumbnail + large). */
export const galleryRoutes: readonly string[] = venues.map(
  // The style tile shows one photo in each card variant on purpose (SCR-007, noindex).
  (venue) => venueUrl(venue.slug, "/stil"),
);

/** Where tests/e2e/auth.setup.ts stores the demo session (panel specs, screenshots; from D-18). */
export const PANEL_STATE = "playwright/.auth/admin.json";

/** Widths from 07-mobil §3. */
export const widths = [360, 390, 768, 1024, 1280, 1536] as const;
