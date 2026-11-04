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
import { ALLERGENS, DIETS } from "../../../../platform/menu/vocabulary";
import { id, money, timestamps } from "../../columns";
import { tenantPolicy } from "../policy";
import { hasTurkish, optionalTurkish, textArray, venueColumn } from "./checks";
import { items } from "./menu";

/**
 * Menu engine II: option groups and the product configurator (plan §9, D-05, BR-SCN-001…003).
 * Groups are venue-wide ("Süt seçimi" serves every milk drink) and linked to products, where the
 * limits can be overridden and the group limited to some price lines (extra shot only for "Büyük").
 * A group with min ≥ 1 is required; there is no separate flag.
 */

export const optionGroups = pgTable(
  "option_groups",
  {
    id: id(),
    venueId: venueColumn(),
    key: text().notNull(),
    name: jsonb().$type<Translated>().notNull(),
    minSelect: smallint().notNull().default(0),
    maxSelect: smallint().notNull().default(1),
    sort: integer().notNull().default(0),
    ...timestamps,
  },
  (table) => [
    unique("ux_option_groups_venue_id_id").on(table.venueId, table.id),
    uniqueIndex("ux_option_groups_venue_key").on(table.venueId, table.key),
    check("ck_option_groups_name", hasTurkish(table.name)),
    check(
      "ck_option_groups_limits",
      sql`${table.minSelect} >= 0 and ${table.maxSelect} >= 1 and ${table.minSelect} <= ${table.maxSelect}`,
    ),
    tenantPolicy("option_groups", table.venueId),
  ],
);

export const options = pgTable(
  "options",
  {
    id: id(),
    venueId: venueColumn(),
    groupId: uuid().notNull(),
    key: text().notNull(),
    name: jsonb().$type<Translated>().notNull(),
    /** May be negative; the configurator keeps the total at zero or above (BR-SCN-002). */
    priceDeltaMinor: money().notNull().default(0),
    allergens: text()
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    dietsRemoved: text()
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    isDefault: boolean().notNull().default(false),
    available: boolean().notNull().default(true),
    sort: integer().notNull().default(0),
    ...timestamps,
  },
  (table) => [
    unique("ux_options_venue_id_id").on(table.venueId, table.id),
    uniqueIndex("ux_options_group_key").on(table.groupId, table.key),
    foreignKey({
      name: "fk_options_group",
      columns: [table.venueId, table.groupId],
      foreignColumns: [optionGroups.venueId, optionGroups.id],
    }).onDelete("cascade"),
    index("ix_options_group").on(table.venueId, table.groupId, table.sort),
    check("ck_options_name", hasTurkish(table.name)),
    check("ck_options_allergens", sql`${table.allergens} <@ ${textArray(ALLERGENS)}`),
    check("ck_options_diets_removed", sql`${table.dietsRemoved} <@ ${textArray(DIETS)}`),
    tenantPolicy("options", table.venueId),
  ],
);

/** A group on a product: order, limit overrides, the price lines it applies to (null = all). */
export const itemOptionGroups = pgTable(
  "item_option_groups",
  {
    id: id(),
    venueId: venueColumn(),
    itemId: uuid().notNull(),
    groupId: uuid().notNull(),
    sort: integer().notNull().default(0),
    minOverride: smallint(),
    maxOverride: smallint(),
    /** item_prices ids of the same product; checked by the content schema (arrays have no FK). */
    appliesToPriceIds: uuid().array(),
    ...timestamps,
  },
  (table) => [
    unique("ux_item_option_groups_venue_id_id").on(table.venueId, table.id),
    uniqueIndex("ux_item_option_groups_item_group").on(table.itemId, table.groupId),
    foreignKey({
      name: "fk_item_option_groups_item",
      columns: [table.venueId, table.itemId],
      foreignColumns: [items.venueId, items.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "fk_item_option_groups_group",
      columns: [table.venueId, table.groupId],
      foreignColumns: [optionGroups.venueId, optionGroups.id],
    }).onDelete("cascade"),
    index("ix_item_option_groups_group").on(table.venueId, table.groupId),
    check(
      "ck_item_option_groups_limits",
      sql`coalesce(${table.minOverride}, 0) >= 0 and coalesce(${table.maxOverride}, 1) >= 1 and coalesce(${table.minOverride}, 0) <= coalesce(${table.maxOverride}, 32767)`,
    ),
    tenantPolicy("item_option_groups", table.venueId),
  ],
);

/**
 * Compatibility (BR-SCN-003): when `when_option` is chosen, the target option or any option of
 * the target group is excluded / required. item_id null = the rule holds for every product.
 */
export const optionRules = pgTable(
  "option_rules",
  {
    id: id(),
    venueId: venueColumn(),
    itemId: uuid(),
    whenOptionId: uuid().notNull(),
    effect: text().notNull(),
    targetOptionId: uuid(),
    targetGroupId: uuid(),
    message: jsonb().$type<Translated>(),
    ...timestamps,
  },
  (table) => [
    unique("ux_option_rules_venue_id_id").on(table.venueId, table.id),
    foreignKey({
      name: "fk_option_rules_item",
      columns: [table.venueId, table.itemId],
      foreignColumns: [items.venueId, items.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "fk_option_rules_when",
      columns: [table.venueId, table.whenOptionId],
      foreignColumns: [options.venueId, options.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "fk_option_rules_target_option",
      columns: [table.venueId, table.targetOptionId],
      foreignColumns: [options.venueId, options.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "fk_option_rules_target_group",
      columns: [table.venueId, table.targetGroupId],
      foreignColumns: [optionGroups.venueId, optionGroups.id],
    }).onDelete("cascade"),
    index("ix_option_rules_when").on(table.venueId, table.whenOptionId),
    check("ck_option_rules_effect", sql`${table.effect} in ('excludes', 'requires')`),
    check(
      "ck_option_rules_one_target",
      sql`(${table.targetOptionId} is null) <> (${table.targetGroupId} is null)`,
    ),
    check(
      "ck_option_rules_not_self",
      sql`${table.targetOptionId} is distinct from ${table.whenOptionId}`,
    ),
    check("ck_option_rules_message", optionalTurkish(table.message)),
    tenantPolicy("option_rules", table.venueId),
  ],
);
