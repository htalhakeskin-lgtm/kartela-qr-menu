import "server-only";

import { eq } from "drizzle-orm";
import { z } from "zod";

import { fail, ok } from "@/lib/result";
import {
  availabilityStatus,
  businessDate,
  type ItemAvailability,
  nextDayEnd,
} from "@/platform/menu/availability";
import { venueAction, type VenueContext } from "@/server/action";
import { venues } from "@/server/db/schema";
import {
  type AvailabilityPatch,
  dailyItemIds,
  dailyMenus,
  itemWithAvailability,
  recordAudit,
  replaceDailyItems,
  saveAvailability,
  withVenue,
} from "@/server/db/tenant";
import { getVenueView } from "@/server/menu/venue-view";
import { hashIp } from "@/server/request";

/**
 * Availability from the phone (SCR-108, SCR-109; REQ-022, BR-MST-001…005): one tap sold out
 * (until the day ends at 04:00, P-01, or indefinitely), daily count ±, oven release times, the
 * menu of the day. Staff and up (`availability.edit`); every write refreshes only this venue's
 * menu pages (REQ-016) and lands in the audit log.
 */
export type AvailabilityItem = {
  id: string;
  name: string;
  soldOut: null | "day" | "indefinite" | "count";
  dailyLimit: number | null;
  remaining: number | null;
  releaseTimes: string[];
};
export type AvailabilityGroup = { title: string; items: AvailabilityItem[] };

export async function availabilityView(
  slug: string,
  now: Date,
): Promise<AvailabilityGroup[] | null> {
  const view = await getVenueView(slug, "tr");
  if (!view) return null;
  const byId = new Map(view.items.map((item) => [item.id, item]));
  const seen = new Set<string>();
  const groups: AvailabilityGroup[] = [];
  const collect = (title: string, ids: readonly string[]) => {
    const list: AvailabilityItem[] = [];
    for (const id of ids) {
      const item = byId.get(id);
      if (!item || seen.has(id)) continue;
      seen.add(id);
      const status = availabilityStatus(item.availability, now, view.timeZone);
      const mark = item.availability;
      list.push({
        id,
        name: item.name.text,
        soldOut: !status.soldOut
          ? null
          : status.soldOut.reason === "count"
            ? "count"
            : status.soldOut.until
              ? "day"
              : "indefinite",
        dailyLimit: mark?.dailyLimit ?? null,
        remaining: status.remaining,
        releaseTimes: mark?.releaseTimes ?? [],
      });
    }
    if (list.length > 0) groups.push({ title, items: list });
  };
  for (const menu of view.menus) {
    const walk = (sections: typeof menu.sections) => {
      for (const section of sections) {
        collect(
          section.name.text,
          section.items.map((entry) => entry.itemId),
        );
        walk(section.children);
      }
    };
    walk(menu.sections);
  }
  collect(
    "Diğer",
    view.items.map((item) => item.id),
  );
  return groups;
}

async function venueZone(ctx: VenueContext): Promise<string> {
  const [row] = await ctx.tx
    .select({ timezone: venues.timezone })
    .from(venues)
    .where(eq(venues.id, ctx.venueId));
  return row?.timezone ?? "Europe/Istanbul";
}

const itemInput = { venueId: z.uuid(), itemId: z.uuid() };

async function change(
  ctx: VenueContext,
  itemId: string,
  action: string,
  build: (current: ItemAvailability | null, zone: string) => AvailabilityPatch | string,
) {
  const item = await itemWithAvailability(ctx.tx, itemId);
  if (!item) return fail("notFound");
  const zone = await venueZone(ctx);
  const current = item.availability
    ? {
        ...item.availability,
        soldOutUntil: item.availability.soldOutUntil?.toISOString() ?? null,
      }
    : null;
  const patch = build(current as ItemAvailability | null, zone);
  if (typeof patch === "string") return fail("validation", { message: patch });
  await saveAvailability(ctx.tx, ctx.venueId, itemId, patch);
  await recordAudit(ctx.tx, {
    venueId: ctx.venueId,
    actorId: ctx.session.user.id,
    action,
    entity: "item",
    entityId: itemId,
    changes: Object.fromEntries(
      Object.entries(patch).map(([key, value]) => [
        key,
        { from: (item.availability as Record<string, unknown> | null)?.[key] ?? null, to: value },
      ]),
    ),
    ipHash: hashIp(ctx.ip),
  });
  return ok({ name: item.name });
}

const options = { permission: "availability.edit" as const, refresh: ["menu"] as const };

export const markSoldOut = venueAction({
  ...options,
  schema: z.object({ ...itemInput, sure: z.enum(["gun", "suresiz"]) }),
  handler: ({ itemId, sure }, ctx) =>
    change(ctx, itemId, "availability.sold_out", (_, zone) =>
      sure === "gun"
        ? { soldOutUntil: nextDayEnd(ctx.now, zone), soldOutIndefinitely: false }
        : { soldOutUntil: null, soldOutIndefinitely: true },
    ),
});

export const bringBack = venueAction({
  ...options,
  schema: z.object(itemInput),
  handler: ({ itemId }, ctx) =>
    change(ctx, itemId, "availability.back", () => ({
      soldOutUntil: null,
      soldOutIndefinitely: false,
    })),
});

export const changeCount = venueAction({
  ...options,
  schema: z.object({ ...itemInput, fark: z.enum(["-1", "1"]) }),
  handler: ({ itemId, fark }, ctx) =>
    change(ctx, itemId, "availability.count", (current, zone) => {
      if (!current?.dailyLimit) return "Bu üründe günlük adet tanımlı değil.";
      const today = businessDate(ctx.now, zone);
      const base =
        current.remainingOn === today && current.remaining !== null
          ? current.remaining
          : current.dailyLimit;
      const remaining = Math.min(current.dailyLimit, Math.max(0, base + Number(fark)));
      return { remaining, remainingOn: today };
    }),
});

export const setDailyLimit = venueAction({
  ...options,
  schema: z.object({
    ...itemInput,
    adet: z.union([z.literal(""), z.coerce.number().int().min(1).max(999)]),
  }),
  handler: ({ itemId, adet }, ctx) =>
    change(ctx, itemId, "availability.daily_limit", (_, zone) =>
      adet === ""
        ? { dailyLimit: null, remaining: null, remainingOn: null }
        : { dailyLimit: adet, remaining: adet, remainingOn: businessDate(ctx.now, zone) },
    ),
});

const CLOCK = /^([01]\d|2[0-3]):[0-5]\d$/;

export const setReleaseTimes = venueAction({
  ...options,
  schema: z.object({ ...itemInput, saatler: z.string().max(100) }),
  handler: ({ itemId, saatler }, ctx) =>
    change(ctx, itemId, "availability.release_times", () => {
      const times = saatler
        .split(/[\s,]+/)
        .filter(Boolean)
        .map((time) => (/^\d:\d\d$/.test(time) ? `0${time}` : time));
      if (times.some((time) => !CLOCK.test(time))) {
        return "Saatleri 08:00, 11:30 biçiminde, virgülle ayırarak girin.";
      }
      return { releaseTimes: [...new Set(times)].sort() };
    }),
});

// --- menu of the day ---------------------------------------------------------------------

export type DailyView = {
  menus: { id: string; name: string }[];
  menuId: string | null;
  onDate: string;
  selected: string[];
  items: { id: string; name: string }[];
};

export async function dailyView(
  venueId: string,
  slug: string,
  options: { menuId?: string; onDate?: string; now: Date; timeZone: string },
): Promise<DailyView> {
  const today = businessDate(options.now, options.timeZone);
  const onDate =
    options.onDate && /^\d{4}-\d{2}-\d{2}$/.test(options.onDate) ? options.onDate : today;
  const view = await getVenueView(slug, "tr");
  return withVenue(venueId, async (tx) => {
    const list = await dailyMenus(tx);
    const menu = list.find((entry) => entry.id === options.menuId) ?? list[0];
    return {
      menus: list,
      menuId: menu?.id ?? null,
      onDate,
      selected: menu ? await dailyItemIds(tx, menu.id, onDate) : [],
      items: (view?.items ?? []).map((item) => ({ id: item.id, name: item.name.text })),
    };
  });
}

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const saveDailyMenu = venueAction({
  ...options,
  schema: z.object({
    venueId: z.uuid(),
    menuId: z.uuid(),
    onDate: dateString,
    urunler: z.array(z.uuid()).max(100),
  }),
  handler: async ({ venueId, menuId, onDate, urunler }, ctx) => {
    if (!(await dailyMenus(ctx.tx)).some((menu) => menu.id === menuId)) return fail("notFound");
    const before = await dailyItemIds(ctx.tx, menuId, onDate);
    await replaceDailyItems(ctx.tx, venueId, menuId, onDate, [...new Set(urunler)]);
    await recordAudit(ctx.tx, {
      venueId,
      actorId: ctx.session.user.id,
      action: "availability.daily_menu",
      entity: "menu",
      entityId: menuId,
      changes: { [onDate]: { from: before.length, to: urunler.length } },
      ipHash: hashIp(ctx.ip),
    });
    return ok({ count: urunler.length });
  },
});

export const copyPreviousDay = venueAction({
  ...options,
  schema: z.object({ venueId: z.uuid(), menuId: z.uuid(), onDate: dateString }),
  handler: async ({ venueId, menuId, onDate }, ctx) => {
    if (!(await dailyMenus(ctx.tx)).some((menu) => menu.id === menuId)) return fail("notFound");
    const previous = new Date(`${onDate}T12:00:00Z`);
    previous.setUTCDate(previous.getUTCDate() - 1);
    const items = await dailyItemIds(ctx.tx, menuId, previous.toISOString().slice(0, 10));
    if (items.length === 0) return fail("notFound", { message: "Önceki günün menüsü boş." });
    await replaceDailyItems(ctx.tx, venueId, menuId, onDate, items);
    await recordAudit(ctx.tx, {
      venueId,
      actorId: ctx.session.user.id,
      action: "availability.daily_menu",
      entity: "menu",
      entityId: menuId,
      changes: { [onDate]: { from: "önceki gün", to: items.length } },
      ipHash: hashIp(ctx.ip),
    });
    return ok({ count: items.length });
  },
});
