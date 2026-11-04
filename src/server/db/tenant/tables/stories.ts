import { sql } from "drizzle-orm";
import {
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
import { STORY_KINDS } from "../../../../platform/menu/vocabulary";
import { id, timestamps, version } from "../../columns";
import { tenantPolicy } from "../policy";
import { hasTurkish, list, optionalTurkish, venueColumn } from "./checks";
import { mediaAssets } from "./media";
import { items } from "./menu";

/**
 * Keşfet (plan §9, D-07, REQ-010): the venue's stories — product stories, chef notes, suppliers,
 * and numbered stops of a collection (chapters of a story, steps of a brewing guide). The body is
 * Markdown per language, rendered on the server only (K-34). Images come from the venue's image
 * register: a cover and a gallery, never inline Markdown images.
 */
export const stories = pgTable(
  "stories",
  {
    id: id(),
    venueId: venueColumn(),
    slug: text().notNull(),
    kind: text().notNull(),
    /** Stops of one collection share it and are ordered by chapter_no. */
    collection: text(),
    chapterNo: smallint(),
    title: jsonb().$type<Translated>().notNull(),
    summary: jsonb().$type<Translated>(),
    bodyMd: jsonb().$type<Translated>().notNull(),
    coverId: uuid(),
    /** media_assets ids of the same venue, in order (checked by the content schema). */
    galleryIds: uuid()
      .array()
      .notNull()
      .default(sql`'{}'::uuid[]`),
    status: text().notNull().default("published"),
    sort: integer().notNull().default(0),
    ...version,
    ...timestamps,
  },
  (table) => [
    unique("ux_stories_venue_id_id").on(table.venueId, table.id),
    uniqueIndex("ux_stories_venue_slug").on(table.venueId, table.slug),
    uniqueIndex("ux_stories_collection_stop")
      .on(table.venueId, table.collection, table.chapterNo)
      .where(sql`${table.collection} is not null and ${table.chapterNo} is not null`),
    foreignKey({
      name: "fk_stories_cover",
      columns: [table.venueId, table.coverId],
      foreignColumns: [mediaAssets.venueId, mediaAssets.id],
    }),
    check("ck_stories_kind", sql`${table.kind} in (${list(STORY_KINDS)})`),
    check("ck_stories_status", sql`${table.status} in ('draft', 'published', 'archived')`),
    check("ck_stories_title", hasTurkish(table.title)),
    check("ck_stories_summary", optionalTurkish(table.summary)),
    check("ck_stories_body", hasTurkish(table.bodyMd)),
    check(
      "ck_stories_stop",
      sql`${table.chapterNo} is null or (${table.collection} is not null and ${table.chapterNo} >= 1)`,
    ),
    tenantPolicy("stories", table.venueId),
  ],
);

/** Products a story is about; the theme links the story card to the product and back. */
export const storyItems = pgTable(
  "story_items",
  {
    id: id(),
    venueId: venueColumn(),
    storyId: uuid().notNull(),
    itemId: uuid().notNull(),
    sort: integer().notNull().default(0),
    ...timestamps,
  },
  (table) => [
    unique("ux_story_items_venue_id_id").on(table.venueId, table.id),
    uniqueIndex("ux_story_items_story_item").on(table.storyId, table.itemId),
    foreignKey({
      name: "fk_story_items_story",
      columns: [table.venueId, table.storyId],
      foreignColumns: [stories.venueId, stories.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "fk_story_items_item",
      columns: [table.venueId, table.itemId],
      foreignColumns: [items.venueId, items.id],
    }).onDelete("cascade"),
    index("ix_story_items_item").on(table.venueId, table.itemId),
    tenantPolicy("story_items", table.venueId),
  ],
);
