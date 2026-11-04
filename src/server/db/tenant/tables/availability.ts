import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  foreignKey,
  index,
  integer,
  jsonb,
  pgTable,
  smallint,
  text,
  time,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// Relative: drizzle-kit loads the schema without the tsconfig path alias.
import type { Translated } from "../../../../platform/i18n/fallback";
import type { MonthRange } from "../../../../platform/menu/availability";
import { id, instant, timestamps } from "../../columns";
import { tenantPolicy } from "../policy";
import { hasTurkish, optionalTurkish, venueColumn } from "./checks";
import { items, menus } from "./menu";

/**
 * Menu engine III (plan §9, D-06): availability (BR-MST-001…005) and relations between products
 * (BR-ILS-001). Tenant tables with composite foreign keys (ADR-0004).
 */

/** One row per product that has any availability data; no row = always available. */
export const itemAvailability = pgTable(
  "item_availability",
  {
    id: id(),
    venueId: venueColumn(),
    itemId: uuid().notNull(),
    soldOutUntil: instant(),
    soldOutIndefinitely: boolean().notNull().default(false),
    dailyLimit: integer(),
    remaining: integer(),
    /** Business date (P-01: the day ends at 04:00) the `remaining` count belongs to. */
    remainingOn: date({ mode: "string" }),
    releaseTimes: time()
      .array()
      .notNull()
      .default(sql`'{}'::time[]`),
    seasons: jsonb().$type<MonthRange[]>(),
    outsideSeason: text().notNull().default("dim"),
    ...timestamps,
  },
  (table) => [
    unique("ux_item_availability_venue_id_id").on(table.venueId, table.id),
    uniqueIndex("ux_item_availability_item").on(table.itemId),
    foreignKey({
      name: "fk_item_availability_item",
      columns: [table.venueId, table.itemId],
      foreignColumns: [items.venueId, items.id],
    }).onDelete("cascade"),
    check(
      "ck_item_availability_count",
      sql`(${table.dailyLimit} is null and ${table.remaining} is null and ${table.remainingOn} is null) or (${table.dailyLimit} is not null and ${table.dailyLimit} >= 1 and coalesce(${table.remaining}, 0) between 0 and ${table.dailyLimit})`,
    ),
    check(
      "ck_item_availability_mark",
      sql`not (${table.soldOutIndefinitely} and ${table.soldOutUntil} is not null)`,
    ),
    check("ck_item_availability_outside", sql`${table.outsideSeason} in ('dim', 'hide')`),
    tenantPolicy("item_availability", table.venueId),
  ],
);

/** Menu of the day (BR-MST-005): products of a daily menu per business date. */
export const dailyMenuEntries = pgTable(
  "daily_menu_entries",
  {
    id: id(),
    venueId: venueColumn(),
    menuId: uuid().notNull(),
    onDate: date({ mode: "string" }).notNull(),
    itemId: uuid().notNull(),
    sort: integer().notNull().default(0),
    ...timestamps,
  },
  (table) => [
    unique("ux_daily_menu_entries_venue_id_id").on(table.venueId, table.id),
    uniqueIndex("ux_daily_menu_entries_day_item").on(table.menuId, table.onDate, table.itemId),
    foreignKey({
      name: "fk_daily_menu_entries_menu",
      columns: [table.venueId, table.menuId],
      foreignColumns: [menus.venueId, menus.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "fk_daily_menu_entries_item",
      columns: [table.venueId, table.itemId],
      foreignColumns: [items.venueId, items.id],
    }).onDelete("cascade"),
    index("ix_daily_menu_entries_menu_date").on(table.venueId, table.menuId, table.onDate),
    tenantPolicy("daily_menu_entries", table.venueId),
  ],
);

/** "Yanına" pairings and suggestions (BR-ILS-001: never to itself, no duplicate pair per kind). */
export const itemRelations = pgTable(
  "item_relations",
  {
    id: id(),
    venueId: venueColumn(),
    fromItemId: uuid().notNull(),
    toItemId: uuid().notNull(),
    kind: text().notNull(),
    note: jsonb().$type<Translated>(),
    sort: integer().notNull().default(0),
    ...timestamps,
  },
  (table) => [
    unique("ux_item_relations_venue_id_id").on(table.venueId, table.id),
    uniqueIndex("ux_item_relations_pair").on(table.fromItemId, table.toItemId, table.kind),
    foreignKey({
      name: "fk_item_relations_from",
      columns: [table.venueId, table.fromItemId],
      foreignColumns: [items.venueId, items.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "fk_item_relations_to",
      columns: [table.venueId, table.toItemId],
      foreignColumns: [items.venueId, items.id],
    }).onDelete("cascade"),
    index("ix_item_relations_to").on(table.venueId, table.toItemId),
    check("ck_item_relations_kind", sql`${table.kind} in ('pairing', 'suggestion')`),
    check("ck_item_relations_not_self", sql`${table.fromItemId} <> ${table.toItemId}`),
    check("ck_item_relations_note", optionalTurkish(table.note)),
    tenantPolicy("item_relations", table.venueId),
  ],
);

/** What a set product contains (kind "set"). */
export const setComponents = pgTable(
  "set_components",
  {
    id: id(),
    venueId: venueColumn(),
    setItemId: uuid().notNull(),
    componentItemId: uuid().notNull(),
    qty: smallint().notNull().default(1),
    sort: integer().notNull().default(0),
    ...timestamps,
  },
  (table) => [
    unique("ux_set_components_venue_id_id").on(table.venueId, table.id),
    uniqueIndex("ux_set_components_pair").on(table.setItemId, table.componentItemId),
    foreignKey({
      name: "fk_set_components_set",
      columns: [table.venueId, table.setItemId],
      foreignColumns: [items.venueId, items.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "fk_set_components_component",
      columns: [table.venueId, table.componentItemId],
      foreignColumns: [items.venueId, items.id],
    }).onDelete("cascade"),
    check("ck_set_components_qty", sql`${table.qty} >= 1`),
    check("ck_set_components_not_self", sql`${table.setItemId} <> ${table.componentItemId}`),
    tenantPolicy("set_components", table.venueId),
  ],
);

/** The ordered courses of a tasting menu (kind "tasting"); a course may point at a product. */
export const tastingCourses = pgTable(
  "tasting_courses",
  {
    id: id(),
    venueId: venueColumn(),
    tastingItemId: uuid().notNull(),
    courseNo: smallint().notNull(),
    title: jsonb().$type<Translated>().notNull(),
    itemId: uuid(),
    description: jsonb().$type<Translated>(),
    ...timestamps,
  },
  (table) => [
    unique("ux_tasting_courses_venue_id_id").on(table.venueId, table.id),
    uniqueIndex("ux_tasting_courses_order").on(table.tastingItemId, table.courseNo),
    foreignKey({
      name: "fk_tasting_courses_tasting",
      columns: [table.venueId, table.tastingItemId],
      foreignColumns: [items.venueId, items.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "fk_tasting_courses_item",
      columns: [table.venueId, table.itemId],
      foreignColumns: [items.venueId, items.id],
    }).onDelete("cascade"),
    check("ck_tasting_courses_no", sql`${table.courseNo} >= 1`),
    check("ck_tasting_courses_title", hasTurkish(table.title)),
    check("ck_tasting_courses_description", optionalTurkish(table.description)),
    tenantPolicy("tasting_courses", table.venueId),
  ],
);
