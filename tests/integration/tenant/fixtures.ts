import { inArray, sql } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";

import { db } from "@/server/db/client";
import { newId } from "@/server/db/columns";
import { users, venues } from "@/server/db/schema";
import { type TenantTx, withPlatform } from "@/server/db/tenant";
import * as tables from "@/server/db/tenant/tables";

/**
 * Tenant test suite helpers (ADR-0004). Every test creates its own venues and users with random
 * slugs / e-mails and removes only those (14-test: parallel runs, no TRUNCATE).
 */

export type TestVenue = { id: string; slug: string };

export async function createVenue(label: string): Promise<TestVenue> {
  const slug = `t-${label}-${newId().slice(-12)}`;
  const [row] = await db
    .insert(venues)
    .values({
      slug,
      name: `Test ${label}`,
      kind: "coffee",
      themeId: "sade",
      defaultLocale: "tr",
      locales: ["tr"],
    })
    .returning({ id: venues.id, slug: venues.slug });
  return row!;
}

export async function createUser(platformRole: string | null = null): Promise<string> {
  const id = newId();
  await db.insert(users).values({
    id,
    name: "Test Kullanıcı",
    email: `${id}@test.example.com`,
    emailVerified: true,
    platformRole,
  });
  return id;
}

/** Audit rows keep their venue (no cascade): remove them first, in the platform scope. */
export async function removeVenues(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await withPlatform((tx) =>
    tx.delete(tables.auditLogs).where(inArray(tables.auditLogs.venueId, ids)),
  );
  await db.delete(venues).where(inArray(venues.id, ids));
}

export async function removeUsers(ids: string[]): Promise<void> {
  if (ids.length > 0) await db.delete(users).where(inArray(users.id, ids));
}

/** Tables that carry venue_id, read from the database itself (not from the TypeScript schema). */
export async function tenantTableNames(): Promise<string[]> {
  const result = await db.execute<{ table_name: string }>(sql`
    select distinct c.table_name
    from information_schema.columns c
    join information_schema.tables t
      on t.table_schema = c.table_schema and t.table_name = c.table_name
    where c.table_schema = 'public' and c.column_name = 'venue_id' and t.table_type = 'BASE TABLE'
    order by 1`);
  return result.rows.map((row) => row.table_name);
}

/** Parent rows every menu fixture of one venue hangs under (created by createMenuBase). */
export type MenuBase = {
  menuId: string;
  sectionId: string;
  itemId: string;
  /** A second product, for relations (an item cannot relate to itself). */
  otherItemId: string;
  groupId: string;
  optionId: string;
  otherOptionId: string;
};

type FixtureContext = { userId: string; base: MenuBase };

/** One menu → section → item chain in the venue's own scope, for fixtures and FK tests. */
export async function createMenuBase(tx: TenantTx, venueId: string): Promise<MenuBase> {
  const suffix = newId().slice(-12);
  const [menu] = await tx
    .insert(tables.menus)
    .values({ venueId, slug: `menu-${suffix}`, name: { tr: "Temel menü" } })
    .returning({ id: tables.menus.id });
  const [section] = await tx
    .insert(tables.menuSections)
    .values({ venueId, menuId: menu!.id, name: { tr: "Temel bölüm" } })
    .returning({ id: tables.menuSections.id });
  const [item, otherItem] = await tx
    .insert(tables.items)
    .values([
      { venueId, slug: `item-${suffix}`, name: { tr: "Temel ürün" } },
      { venueId, slug: `item2-${suffix}`, name: { tr: "İkinci ürün" } },
    ])
    .returning({ id: tables.items.id });
  const [group] = await tx
    .insert(tables.optionGroups)
    .values({ venueId, key: `grup-${suffix}`, name: { tr: "Süt seçimi" }, minSelect: 1 })
    .returning({ id: tables.optionGroups.id });
  const [option, other] = await tx
    .insert(tables.options)
    .values([
      { venueId, groupId: group!.id, key: "inek", name: { tr: "İnek sütü" }, isDefault: true },
      {
        venueId,
        groupId: group!.id,
        key: "yulaf",
        name: { tr: "Yulaf sütü" },
        priceDeltaMinor: 2500,
      },
    ])
    .returning({ id: tables.options.id });
  return {
    menuId: menu!.id,
    sectionId: section!.id,
    itemId: item!.id,
    otherItemId: otherItem!.id,
    groupId: group!.id,
    optionId: option!.id,
    otherOptionId: other!.id,
  };
}
type Fixture<T extends PgTable = PgTable> = {
  table: T;
  row: (venueId: string, ctx: FixtureContext) => T["$inferInsert"];
};

const fixture = <T extends PgTable>(table: T, row: Fixture<T>["row"]): Fixture => ({
  table,
  row: row,
});

/**
 * One valid row per tenant table. rls.test.ts fails while a table with venue_id has no entry here,
 * so a new tenant table is covered by the leak tests as soon as it exists.
 */
export const tenantFixtures: Record<string, Fixture> = {
  venue_domains: fixture(tables.venueDomains, (venueId) => ({
    venueId,
    host: `${newId()}.test.example.com`,
  })),
  venue_members: fixture(tables.venueMembers, (venueId, { userId }) => ({
    venueId,
    userId,
    role: "staff",
  })),
  venue_settings: fixture(tables.venueSettings, (venueId) => ({ venueId })),
  audit_logs: fixture(tables.auditLogs, (venueId) => ({ venueId, action: "test.fixture" })),
  menus: fixture(tables.menus, (venueId) => ({
    venueId,
    slug: `fixture-${newId()}`,
    name: { tr: "Kahvaltı" },
    kind: "breakfast",
    schedule: { windows: [{ start: "08:00", end: "12:00" }] },
  })),
  menu_sections: fixture(tables.menuSections, (venueId, { base }) => ({
    venueId,
    menuId: base.menuId,
    parentId: base.sectionId,
    name: { tr: "Alt bölüm" },
  })),
  items: fixture(tables.items, (venueId) => ({
    venueId,
    slug: `fixture-${newId()}`,
    name: { tr: "Mercimek çorbası" },
    allergens: ["celery"],
    energyKcal: 210,
  })),
  section_items: fixture(tables.sectionItems, (venueId, { base }) => ({
    venueId,
    sectionId: base.sectionId,
    itemId: base.itemId,
  })),
  item_prices: fixture(tables.itemPrices, (venueId, { base }) => ({
    venueId,
    itemId: base.itemId,
    unit: "half",
    amountMinor: 14000,
  })),
  option_groups: fixture(tables.optionGroups, (venueId) => ({
    venueId,
    key: `fixture-${newId()}`,
    name: { tr: "Şurup" },
    maxSelect: 2,
  })),
  options: fixture(tables.options, (venueId, { base }) => ({
    venueId,
    groupId: base.groupId,
    key: `fixture-${newId()}`,
    name: { tr: "Laktozsuz süt" },
    priceDeltaMinor: 1500,
  })),
  item_option_groups: fixture(tables.itemOptionGroups, (venueId, { base }) => ({
    venueId,
    itemId: base.itemId,
    groupId: base.groupId,
  })),
  option_rules: fixture(tables.optionRules, (venueId, { base }) => ({
    venueId,
    whenOptionId: base.otherOptionId,
    effect: "excludes",
    targetOptionId: base.optionId,
    message: { tr: "Fikstür kuralı" },
  })),
  item_availability: fixture(tables.itemAvailability, (venueId, { base }) => ({
    venueId,
    itemId: base.itemId,
    dailyLimit: 12,
    remaining: 4,
    remainingOn: "2026-11-06",
    releaseTimes: ["07:00", "11:00"],
  })),
  daily_menu_entries: fixture(tables.dailyMenuEntries, (venueId, { base }) => ({
    venueId,
    menuId: base.menuId,
    onDate: "2026-11-09",
    itemId: base.itemId,
  })),
  item_relations: fixture(tables.itemRelations, (venueId, { base }) => ({
    venueId,
    fromItemId: base.itemId,
    toItemId: base.otherItemId,
    kind: "pairing",
  })),
  set_components: fixture(tables.setComponents, (venueId, { base }) => ({
    venueId,
    setItemId: base.itemId,
    componentItemId: base.otherItemId,
    qty: 2,
  })),
  tasting_courses: fixture(tables.tastingCourses, (venueId, { base }) => ({
    venueId,
    tastingItemId: base.itemId,
    courseNo: 1,
    title: { tr: "Çorba" },
    itemId: base.otherItemId,
  })),
  media_assets: fixture(tables.mediaAssets, (venueId) => ({
    venueId,
    key: `fixture-${newId()}`,
    source: "unsplash",
    url: "https://images.unsplash.com/photo-1610889556528-9a770e32642f",
    width: 7170,
    height: 4100,
    alt: { tr: "Test görseli" },
  })),
  demo_outbox: fixture(tables.demoOutbox, (venueId) => ({
    venueId,
    channel: "email",
    to: "test@example.com",
    template: "test",
    data: {},
  })),
};

export async function insertFixture(
  tx: TenantTx,
  name: string,
  venueId: string,
  ctx: FixtureContext,
): Promise<void> {
  const entry = tenantFixtures[name];
  if (!entry) throw new Error(`No tenant fixture for ${name}`);
  await tx.insert(entry.table).values(entry.row(venueId, ctx));
}
