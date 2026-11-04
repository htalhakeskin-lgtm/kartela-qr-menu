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
 * Venue pages on their own hosts. D-22 turns this list into the venue matrix (every venue × quick
 * menu, Keşfet, item, info).
 */
export const venueRoutes = [
  venueUrl("rakim"),
  venueUrl("ornek"),
  venueUrl("ornek", "/ar"),
] as const;

/** The 404 check route: excluded from SEO and image checks. */
export const notFoundRoute = "/bu-sayfa-yok";

/** Routes whose job is to show many images; the same file may appear twice (thumbnail + large). */
export const galleryRoutes: readonly string[] = [];

/** Where tests/e2e/auth.setup.ts stores the demo session (panel specs, screenshots; from D-18). */
export const PANEL_STATE = "playwright/.auth/admin.json";

/** Widths from 07-mobil §3. */
export const widths = [360, 390, 768, 1024, 1280, 1536] as const;
