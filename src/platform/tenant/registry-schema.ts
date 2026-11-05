import { z } from "zod";

/**
 * Venue registry record (ADR-0002 v2). One file per venue in content/mekanlar/{ad}/mekan.ts,
 * listed in content/mekanlar/index.ts (pnpm mekan:yeni appends, D-21). Read at build time by
 * next.config.ts (host rewrites) and by the theme trees (static params). pnpm db:seed writes the
 * venues table from these records (D-02); D-19 lets the platform admin bind domains in the database.
 *
 * Plain module on purpose: no "server-only", no env.ts — next.config.ts imports it.
 */
// Client components import these from ./locales directly (no zod in their bundle).
import { type Locale, LOCALES, RTL_LOCALES } from "./locales";

export { type Locale, LOCALES, RTL_LOCALES };

/** One entry per theme tree under src/app/tema-{theme}/ (ADR-0003). */
export const THEMES = ["rakim", "sade"] as const;
export type ThemeId = (typeof THEMES)[number];

/** The 16 venue types the menu engine serves (brief); stored in venues.kind. */
export const VENUE_KINDS = [
  "coffee",
  "pasta",
  "restaurant",
  "sushi",
  "concept",
  "lokanta",
  "fish",
  "meyhane",
  "ocakbasi",
  "cocktail_bar",
  "bakery",
  "breakfast",
  "burger",
  "beach_bar",
  "room_service",
  "plant_based",
] as const;
export type VenueKind = (typeof VENUE_KINDS)[number];

/** Words the routing itself uses (?mekan=platform leaves the preview; /panel, /api, /m/ …). */
const RESERVED_SLUGS: readonly string[] = ["platform", "panel", "api", "tema", "kartela", "www"];

const hostname = z
  .string()
  .regex(
    /^(?=.{1,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/,
    "Küçük harfli, noktalı bir alan adı olmalı (ör. rakim-kahve.vercel.app)",
  );

export const venueRecordSchema = z
  .object({
    /** URL- and subdomain-safe id: rakim → rakim.localhost, /m/rakim, /tema-rakim/rakim/… */
    slug: z
      .string()
      .regex(/^[a-z][a-z0-9-]{1,30}$/, "küçük harf, rakam ve tire; harfle başlar")
      .refine((slug) => !RESERVED_SLUGS.includes(slug), "ayrılmış ad (platform, panel, api …)"),
    name: z.string().min(2).max(80),
    kind: z.enum(VENUE_KINDS),
    theme: z.enum(THEMES),
    /** First entry is not special; defaultLocale decides the unprefixed URLs. */
    locales: z.array(z.enum(LOCALES)).min(1),
    defaultLocale: z.enum(LOCALES),
    /** Production hosts; the first is the canonical one (metadataBase, sitemap). */
    domains: z.array(hostname),
    /** Visitor-facing mode (plan K-06): demo = noindex + demo note. */
    mode: z.enum(["demo", "live"]),
    /** Test fixture: never in the production build's host map. */
    fixture: z.boolean().default(false),
  })
  .refine((venue) => venue.locales.includes(venue.defaultLocale), {
    message: "defaultLocale, locales listesinde olmalı",
    path: ["defaultLocale"],
  })
  .refine((venue) => new Set(venue.locales).size === venue.locales.length, {
    message: "locales tekrar içeremez",
    path: ["locales"],
  });

export type VenueRecordInput = z.input<typeof venueRecordSchema>;
export type VenueRecord = z.output<typeof venueRecordSchema>;

/** Typed helper for content/mekanlar/{ad}/mekan.ts; validation happens in registry.ts. */
export function defineVenue(record: VenueRecordInput): VenueRecordInput {
  return record;
}

/**
 * Validates the whole registry: each record, unique slugs, and each host bound to one venue only.
 * Throws with every problem listed, so a broken record stops the build instead of mis-routing.
 */
export function parseRegistry(input: readonly VenueRecordInput[]): VenueRecord[] {
  const problems: string[] = [];
  const venues: VenueRecord[] = [];
  for (const [index, raw] of input.entries()) {
    const parsed = venueRecordSchema.safeParse(raw);
    if (parsed.success) venues.push(parsed.data);
    else problems.push(`#${String(index)} ${z.prettifyError(parsed.error)}`);
  }
  const seenSlugs = new Set<string>();
  const seenHosts = new Map<string, string>();
  for (const venue of venues) {
    if (seenSlugs.has(venue.slug)) problems.push(`slug tekrarlandı: ${venue.slug}`);
    seenSlugs.add(venue.slug);
    for (const host of venue.domains) {
      const owner = seenHosts.get(host);
      if (owner) problems.push(`${host} hem ${owner} hem ${venue.slug} için tanımlı`);
      seenHosts.set(host, venue.slug);
    }
  }
  if (problems.length > 0) throw new Error(`Mekân kaydı geçersiz:\n${problems.join("\n")}`);
  return venues;
}
