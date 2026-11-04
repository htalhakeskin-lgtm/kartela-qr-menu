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

/**
 * Venue pages, reached through their theme tree. Faz 3: the Rakım measurement page, opened by its
 * internal path. From D-01 the proxy serves them on venue hosts (rakim.localhost:3020); D-22 turns
 * this list into the venue matrix (every venue × quick menu, Keşfet, item, info).
 */
export const venueRoutes = ["/tema-rakim/rakim/tr"] as const;

/** The 404 check route: excluded from SEO and image checks. */
export const notFoundRoute = "/bu-sayfa-yok";

/** Routes whose job is to show many images; the same file may appear twice (thumbnail + large). */
export const galleryRoutes: readonly string[] = [];

/** Where tests/e2e/auth.setup.ts stores the demo session (panel specs, screenshots; from D-18). */
export const PANEL_STATE = "playwright/.auth/admin.json";

/** Widths from 07-mobil §3. */
export const widths = [360, 390, 768, 1024, 1280, 1536] as const;
