import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  jsonb,
  pgTable,
  text,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// Relative: drizzle-kit loads the schema without the tsconfig path alias.
import type { Translated } from "../../../../platform/i18n/fallback";
import { id, instant, timestamps, version } from "../../columns";
import { users } from "../../schema/auth";
import { venues } from "../../schema/venues";
import { tenantPolicy } from "../policy";

/**
 * Venue core tenant tables (plan §9, D-02). Every table here carries venue_id and row level
 * security (ADR-0004); code reaches them only through withVenue() — ESLint blocks importing this
 * folder from anywhere else.
 */

/** Hosts of a venue. A host belongs to one venue only (BR-KRC-004): unique across all venues. */
export const venueDomains = pgTable(
  "venue_domains",
  {
    id: id(),
    venueId: uuid()
      .notNull()
      .references(() => venues.id, { onDelete: "cascade" }),
    host: text().notNull(),
    isPrimary: boolean().notNull().default(false),
    status: text().notNull().default("pending"),
    verifiedAt: instant(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("ux_venue_domains_host").on(table.host),
    uniqueIndex("ux_venue_domains_primary")
      .on(table.venueId)
      .where(sql`${table.isPrimary}`),
    check("ck_venue_domains_status", sql`${table.status} in ('pending', 'active', 'error')`),
    tenantPolicy("venue_domains", table.venueId),
  ],
);

/** Panel members of a venue (plan §8). A platform admin needs no membership. */
export const venueMembers = pgTable(
  "venue_members",
  {
    id: id(),
    venueId: uuid()
      .notNull()
      .references(() => venues.id, { onDelete: "cascade" }),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text().notNull(), // VENUE_ROLES (src/config/permissions.ts)
    ...timestamps,
  },
  (table) => [
    uniqueIndex("ux_venue_members_venue_user").on(table.venueId, table.userId),
    index("ix_venue_members_user").on(table.userId),
    check("ck_venue_members_role", sql`${table.role} in ('owner', 'manager', 'staff')`),
    tenantPolicy("venue_members", table.venueId),
  ],
);

export type VenueCompany = { legalName?: string; address?: string; taxOffice?: string };
/** Phones in E.164 (+905423115888); the address as written on the door, one language. */
export type VenueContact = {
  phone?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  mapUrl?: string;
};
/** Opening hours per ISO weekday (1 = Monday); "HH:MM" in the venue's time zone. */
export type VenueHours = Partial<
  Record<1 | 2 | 3 | 4 | 5 | 6 | 7, { open: string; close: string }[]>
>;
export type VenueLegal = {
  /** The venue's own allergen statement; without it the interface's general one is shown. */
  allergenStatement?: Translated;
  /** Allowed surcharges only: service / table / cover charges are refused (BR-YSL-001, K-11). */
  extraCharges?: { kind: string; label: string; amountMinor: number }[];
  alcoholPairings?: boolean;
};
/** P2 switches (waiter call, ordering); off until their slices. */
export type VenueFeatures = { waiterCall?: boolean; ordering?: boolean };
/** /bilgi questions (Z-10: 4–6 short ones). */
export type VenueFaq = { q: Translated; a: Translated }[];
export type VenueWifi = { network: string; password: string | null };

/** Venue information, one row per venue, edited in the panel (D-18) and versioned. */
export const venueSettings = pgTable(
  "venue_settings",
  {
    venueId: uuid()
      .primaryKey()
      .references(() => venues.id, { onDelete: "cascade" }),
    company: jsonb().$type<VenueCompany>().notNull().default({}),
    contact: jsonb().$type<VenueContact>().notNull().default({}),
    hours: jsonb().$type<VenueHours>().notNull().default({}),
    social: jsonb().$type<Record<string, string>>().notNull().default({}),
    seo: jsonb().$type<{ description?: Translated }>().notNull().default({}),
    legal: jsonb().$type<VenueLegal>().notNull().default({}),
    features: jsonb().$type<VenueFeatures>().notNull().default({}),
    faq: jsonb().$type<VenueFaq>().notNull().default([]),
    wifi: jsonb().$type<VenueWifi>(),
    ...version,
    ...timestamps,
  },
  (table) => [tenantPolicy("venue_settings", table.venueId)],
);
