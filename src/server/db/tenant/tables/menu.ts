import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  pgTable,
  smallint,
  text,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// Relative: drizzle-kit loads the schema without the tsconfig path alias.
import type { Translated } from "../../../../platform/i18n/fallback";
import { PRICE_UNITS } from "../../../../platform/menu/price";
import type { MenuSchedule } from "../../../../platform/menu/schedule";
import type { Alcohol, Nutrition } from "../../../../platform/menu/types";
import {
  ALLERGENS,
  DIETS,
  ITEM_KINDS,
  ITEM_STATUSES,
  MENU_KINDS,
} from "../../../../platform/menu/vocabulary";
import { id, money, timestamps, version } from "../../columns";
import { tenantPolicy } from "../policy";
import { hasTurkish, list, optionalTurkish, textArray, venueColumn } from "./checks";
import { mediaAssets } from "./media";

/**
 * Menu engine I (plan §9, D-03). Tenant tables: venue_id + row level security (ADR-0004). Every
 * parent has a (venue_id, id) unique key and every child points at it with (venue_id, parent_id),
 * so a row of venue A can never hang under a row of venue B (BR-KRC-002), not even in the
 * platform scope.
 *
 * Translated fields are jsonb { tr, en, ar, … } with Turkish required (BR-MNU-003).
 */

export const menus = pgTable(
  "menus",
  {
    id: id(),
    venueId: venueColumn(),
    slug: text().notNull(),
    name: jsonb().$type<Translated>().notNull(),
    kind: text().notNull().default("all_day"),
    /** Null: always open. */
    schedule: jsonb().$type<MenuSchedule>(),
    outsideWindow: text().notNull().default("dim"),
    access: text().notNull().default("public"),
    passwordHash: text(),
    /** Context codes (table, room, zone) this menu is limited to; empty = everywhere (D-36). */
    contexts: text()
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    sort: integer().notNull().default(0),
    ...version,
    ...timestamps,
  },
  (table) => [
    unique("ux_menus_venue_id_id").on(table.venueId, table.id),
    uniqueIndex("ux_menus_venue_slug").on(table.venueId, table.slug),
    check("ck_menus_name", hasTurkish(table.name)),
    check("ck_menus_kind", sql`${table.kind} in (${list(MENU_KINDS)})`),
    check("ck_menus_outside_window", sql`${table.outsideWindow} in ('dim', 'hide')`),
    check(
      "ck_menus_access",
      sql`(${table.access} = 'public' and ${table.passwordHash} is null) or (${table.access} = 'password' and ${table.passwordHash} is not null)`,
    ),
    tenantPolicy("menus", table.venueId),
  ],
);

/** Sections and sub-sections (at most two levels: the content schema enforces it, D-04). */
export const menuSections = pgTable(
  "menu_sections",
  {
    id: id(),
    venueId: venueColumn(),
    menuId: uuid().notNull(),
    parentId: uuid(),
    name: jsonb().$type<Translated>().notNull(),
    description: jsonb().$type<Translated>(),
    /** A theme's hint (list, cards, grid, featured); themes may ignore it. */
    layoutHint: text(),
    sort: integer().notNull().default(0),
    ...timestamps,
  },
  (table) => [
    unique("ux_menu_sections_venue_id_id").on(table.venueId, table.id),
    foreignKey({
      name: "fk_menu_sections_menu",
      columns: [table.venueId, table.menuId],
      foreignColumns: [menus.venueId, menus.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "fk_menu_sections_parent",
      columns: [table.venueId, table.parentId],
      foreignColumns: [table.venueId, table.id],
    }).onDelete("cascade"),
    index("ix_menu_sections_menu").on(table.venueId, table.menuId, table.sort),
    check("ck_menu_sections_name", hasTurkish(table.name)),
    check("ck_menu_sections_description", optionalTurkish(table.description)),
    check("ck_menu_sections_not_own_parent", sql`${table.parentId} is distinct from ${table.id}`),
    tenantPolicy("menu_sections", table.venueId),
  ],
);

export const items = pgTable(
  "items",
  {
    id: id(),
    venueId: venueColumn(),
    slug: text().notNull(),
    kind: text().notNull().default("dish"),
    name: jsonb().$type<Translated>().notNull(),
    description: jsonb().$type<Translated>(),
    ingredients: jsonb().$type<Translated>(),
    allergens: text()
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    mayContain: text()
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    diets: text()
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    spiceLevel: smallint().notNull().default(0),
    energyKcal: integer(),
    nutrition: jsonb().$type<Nutrition>(),
    portionG: integer(),
    volumeMl: integer(),
    origin: jsonb().$type<Translated>(),
    /** Kind-specific facts, validated per kind by the content schema (bean: origin, altitude …). */
    attributes: jsonb().$type<Record<string, unknown>>().notNull().default({}),
    alcohol: jsonb().$type<Alcohol>(),
    /** media_assets of the same venue; null = no photo, a first-class state (K-23). */
    imageId: uuid(),
    status: text().notNull().default("published"),
    ...version,
    ...timestamps,
  },
  (table) => [
    unique("ux_items_venue_id_id").on(table.venueId, table.id),
    uniqueIndex("ux_items_venue_slug").on(table.venueId, table.slug),
    foreignKey({
      name: "fk_items_image",
      columns: [table.venueId, table.imageId],
      foreignColumns: [mediaAssets.venueId, mediaAssets.id],
    }),
    check("ck_items_kind", sql`${table.kind} in (${list(ITEM_KINDS)})`),
    check("ck_items_status", sql`${table.status} in (${list(ITEM_STATUSES)})`),
    check("ck_items_name", hasTurkish(table.name)),
    check("ck_items_description", optionalTurkish(table.description)),
    check("ck_items_ingredients", optionalTurkish(table.ingredients)),
    check("ck_items_allergens", sql`${table.allergens} <@ ${textArray(ALLERGENS)}`),
    check("ck_items_may_contain", sql`${table.mayContain} <@ ${textArray(ALLERGENS)}`),
    check("ck_items_diets", sql`${table.diets} <@ ${textArray(DIETS)}`),
    check("ck_items_spice_level", sql`${table.spiceLevel} between 0 and 3`),
    check(
      "ck_items_amounts",
      sql`coalesce(${table.energyKcal}, 0) >= 0 and coalesce(${table.portionG}, 0) >= 0 and coalesce(${table.volumeMl}, 0) >= 0`,
    ),
    tenantPolicy("items", table.venueId),
  ],
);

/** A product in a section; one product may sit in several sections (and menus). */
export const sectionItems = pgTable(
  "section_items",
  {
    id: id(),
    venueId: venueColumn(),
    sectionId: uuid().notNull(),
    itemId: uuid().notNull(),
    sort: integer().notNull().default(0),
    featured: boolean().notNull().default(false),
    ...timestamps,
  },
  (table) => [
    unique("ux_section_items_venue_id_id").on(table.venueId, table.id),
    uniqueIndex("ux_section_items_section_item").on(table.sectionId, table.itemId),
    foreignKey({
      name: "fk_section_items_section",
      columns: [table.venueId, table.sectionId],
      foreignColumns: [menuSections.venueId, menuSections.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "fk_section_items_item",
      columns: [table.venueId, table.itemId],
      foreignColumns: [items.venueId, items.id],
    }).onDelete("cascade"),
    index("ix_section_items_item").on(table.venueId, table.itemId),
    tenantPolicy("section_items", table.venueId),
  ],
);

/** Price lines (REQ-004); price_changes (D-24) references (venue_id, id). */
export const itemPrices = pgTable(
  "item_prices",
  {
    id: id(),
    venueId: venueColumn(),
    itemId: uuid().notNull(),
    unit: text().notNull().default("portion"),
    label: jsonb().$type<Translated>(),
    amountMinor: money().notNull(),
    isDefault: boolean().notNull().default(false),
    sort: integer().notNull().default(0),
    ...timestamps,
  },
  (table) => [
    unique("ux_item_prices_venue_id_id").on(table.venueId, table.id),
    foreignKey({
      name: "fk_item_prices_item",
      columns: [table.venueId, table.itemId],
      foreignColumns: [items.venueId, items.id],
    }).onDelete("cascade"),
    index("ix_item_prices_item").on(table.venueId, table.itemId, table.sort),
    uniqueIndex("ux_item_prices_default")
      .on(table.itemId)
      .where(sql`${table.isDefault}`),
    check("ck_item_prices_unit", sql`${table.unit} in (${list(PRICE_UNITS)})`),
    check("ck_item_prices_amount", sql`${table.amountMinor} >= 0`),
    check("ck_item_prices_label", optionalTurkish(table.label)),
    tenantPolicy("item_prices", table.venueId),
  ],
);
