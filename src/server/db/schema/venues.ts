import { sql } from "drizzle-orm";
import { check, jsonb, pgTable, text, uniqueIndex } from "drizzle-orm/pg-core";

// Relative: drizzle-kit loads the schema without the tsconfig path alias.
import { VENUE_KINDS } from "../../../platform/tenant/registry-schema";
import { id, timestamps, version } from "../columns";

const kinds = sql.raw(VENUE_KINDS.map((kind) => `'${kind}'`).join(", "));

/**
 * The tenant root (plan §9, ADR-0004). Not a tenant table itself: it has no venue_id and no row
 * level security. Its columns are public facts every venue page shows anyway (name, theme,
 * languages), and the static pages resolve a slug to an id before any venue scope exists.
 * The app role (app_rw) may only read it; venues are created and changed by the platform
 * (pnpm db:seed from content/mekanlar, the platform admin in D-19).
 *
 * Every table that belongs to one venue lives in src/server/db/tenant/tables/ and is reached only
 * through withVenue() (src/server/db/tenant).
 */
export const venues = pgTable(
  "venues",
  {
    id: id(),
    slug: text().notNull(),
    name: text().notNull(),
    kind: text().notNull(), // VENUE_KINDS (registry-schema.ts)
    mode: text().notNull().default("demo"),
    themeId: text().notNull(),
    themeConfig: jsonb().$type<Record<string, unknown>>().notNull().default({}),
    defaultLocale: text().notNull(),
    locales: text().array().notNull(),
    timezone: text().notNull().default("Europe/Istanbul"),
    status: text().notNull().default("active"),
    ...version,
    ...timestamps,
  },
  (table) => [
    uniqueIndex("ux_venues_slug").on(table.slug),
    check("ck_venues_kind", sql`${table.kind} in (${kinds})`),
    check("ck_venues_mode", sql`${table.mode} in ('demo', 'live')`),
    check("ck_venues_status", sql`${table.status} in ('active', 'archived')`),
    check("ck_venues_default_locale", sql`${table.defaultLocale} = any(${table.locales})`),
  ],
);

export type Venue = typeof venues.$inferSelect;
