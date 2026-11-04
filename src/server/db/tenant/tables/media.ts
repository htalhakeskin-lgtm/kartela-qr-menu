import { sql } from "drizzle-orm";
import {
  check,
  integer,
  jsonb,
  pgTable,
  smallint,
  text,
  unique,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// Relative: drizzle-kit loads the schema without the tsconfig path alias.
import type { Translated } from "../../../../platform/i18n/fallback";
import { id, timestamps } from "../../columns";
import { tenantPolicy } from "../policy";
import { hasTurkish, venueColumn } from "./checks";

/**
 * Image register of a venue (plan §9, 20-gorsel-kalite §5.4, D-04). Stock photos stay on their
 * CDN and are served through src/lib/image-loader.ts (K-16); the row records where a photo comes
 * from, who took it, its licence, its real pixel size (never shown larger) and its alt text.
 * `key` is the content file's name for it (content/mekanlar/{ad}/menu.ts → images).
 */
export const mediaAssets = pgTable(
  "media_assets",
  {
    id: id(),
    venueId: venueColumn(),
    key: text().notNull(),
    source: text().notNull(),
    url: text().notNull(),
    width: integer().notNull(),
    height: integer().notNull(),
    photographer: text(),
    sourcePage: text(),
    license: text(),
    alt: jsonb().$type<Translated>().notNull(),
    /** Focal point in percent; crops keep it in frame. */
    focalX: smallint().notNull().default(50),
    focalY: smallint().notNull().default(50),
    dominantColor: text(),
    /** Upload variants (D-28: 640 … 2560 px); stock photos have none. */
    variants: jsonb().$type<Record<string, unknown>>(),
    ...timestamps,
  },
  (table) => [
    unique("ux_media_assets_venue_id_id").on(table.venueId, table.id),
    uniqueIndex("ux_media_assets_venue_key").on(table.venueId, table.key),
    check("ck_media_assets_source", sql`${table.source} in ('unsplash', 'pexels', 'upload')`),
    check("ck_media_assets_size", sql`${table.width} > 0 and ${table.height} > 0`),
    check(
      "ck_media_assets_focal",
      sql`${table.focalX} between 0 and 100 and ${table.focalY} between 0 and 100`,
    ),
    check("ck_media_assets_alt", hasTurkish(table.alt)),
    tenantPolicy("media_assets", table.venueId),
  ],
);
