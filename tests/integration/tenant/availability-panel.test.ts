import { eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { nextDayEnd } from "@/platform/menu/availability";
import { getSession, type Session } from "@/server/auth";
import { addMember, dailyItemIds, withVenue } from "@/server/db/tenant";
import { itemAvailability, menus } from "@/server/db/tenant/tables";
import {
  bringBack,
  changeCount,
  copyPreviousDay,
  markSoldOut,
  saveDailyMenu,
  setDailyLimit,
  setReleaseTimes,
} from "@/server/panel/availability";

import {
  createMenuBase,
  createUser,
  createVenue,
  type MenuBase,
  removeUsers,
  removeVenues,
  type TestVenue,
} from "./fixtures";

/**
 * Panel availability (D-20; REQ-022, BR-MST-001…005, BR-KRC-003). Session, IP and cache refresh
 * stubbed; database, roles and row level security real.
 */
vi.mock("@/server/auth", () => ({ getSession: vi.fn() }));
vi.mock("@/server/request", () => ({
  clientIp: () => Promise.resolve("203.0.113.31"),
  hashIp: () => "ip-hash",
}));
vi.mock("next/cache", () => ({ updateTag: vi.fn(), revalidateTag: vi.fn() }));

const signIn = (userId: string) => {
  vi.mocked(getSession).mockResolvedValue({
    user: { id: userId, email: `${userId}@test.example.com`, twoFactorEnabled: true },
    session: {},
  } as unknown as Session);
};

const row = (venueId: string, itemId: string) =>
  withVenue(venueId, async (tx) => {
    const [found] = await tx
      .select()
      .from(itemAvailability)
      .where(eq(itemAvailability.itemId, itemId));
    return found;
  });

describe("REQ-022: availability from the panel", () => {
  let venue: TestVenue;
  let other: TestVenue;
  let base: MenuBase;
  let otherBase: MenuBase;
  let dailyMenuId = "";
  const user = { staff: "", outsider: "" };

  beforeAll(async () => {
    [venue, other] = [await createVenue("mst-a"), await createVenue("mst-b")];
    base = await withVenue(venue.id, (tx) => createMenuBase(tx, venue.id));
    otherBase = await withVenue(other.id, (tx) => createMenuBase(tx, other.id));
    dailyMenuId = await withVenue(venue.id, async (tx) => {
      const [menu] = await tx
        .insert(menus)
        .values({ venueId: venue.id, slug: "gunun", name: { tr: "Günün menüsü" }, kind: "daily" })
        .returning({ id: menus.id });
      return menu!.id;
    });
    user.staff = await createUser();
    user.outsider = await createUser();
    await addMember(venue.id, user.staff, "staff");
    await addMember(other.id, user.outsider, "staff");
  });

  afterAll(async () => {
    await removeVenues([venue.id, other.id]);
    await removeUsers(Object.values(user));
  });

  beforeEach(() => {
    signIn(user.staff);
  });

  it("BR-MST-001: one tap marks sold out until the day ends; bringing back clears it", async () => {
    const before = new Date();
    expect(
      await markSoldOut({ venueId: venue.id, itemId: base.itemId, sure: "gun" }),
    ).toMatchObject({
      ok: true,
    });
    const marked = await row(venue.id, base.itemId);
    expect(marked?.soldOutUntil?.getTime()).toBe(nextDayEnd(before, "Europe/Istanbul").getTime());
    expect(await bringBack({ venueId: venue.id, itemId: base.itemId })).toMatchObject({ ok: true });
    expect((await row(venue.id, base.itemId))?.soldOutUntil).toBeNull();
  });

  it("BR-KRC-003: another venue's staff is refused; another venue's product is not found", async () => {
    signIn(user.outsider);
    expect(
      await markSoldOut({ venueId: venue.id, itemId: base.itemId, sure: "gun" }),
    ).toMatchObject({
      ok: false,
      code: "forbidden",
    });
    signIn(user.staff);
    expect(
      await markSoldOut({ venueId: venue.id, itemId: otherBase.itemId, sure: "suresiz" }),
    ).toMatchObject({ ok: false, code: "notFound" });
  });

  it("the daily count stays between 0 and the limit", async () => {
    expect(
      await changeCount({ venueId: venue.id, itemId: base.otherItemId, fark: "-1" }),
    ).toMatchObject({
      ok: false,
    });
    await setDailyLimit({ venueId: venue.id, itemId: base.otherItemId, adet: "2" });
    for (const fark of ["-1", "-1", "-1"] as const) {
      await changeCount({ venueId: venue.id, itemId: base.otherItemId, fark });
    }
    expect((await row(venue.id, base.otherItemId))?.remaining).toBe(0);
    for (const fark of ["1", "1", "1"] as const) {
      await changeCount({ venueId: venue.id, itemId: base.otherItemId, fark });
    }
    expect((await row(venue.id, base.otherItemId))?.remaining).toBe(2);
  });

  it("oven times are validated and stored sorted", async () => {
    expect(
      await setReleaseTimes({ venueId: venue.id, itemId: base.itemId, saatler: "sabah 8" }),
    ).toMatchObject({ ok: false, code: "validation" });
    await setReleaseTimes({ venueId: venue.id, itemId: base.itemId, saatler: "11:30, 8:00" });
    expect(
      (await row(venue.id, base.itemId))?.releaseTimes.map((time) => time.slice(0, 5)),
    ).toEqual(["08:00", "11:30"]);
  });

  it("BR-MST-005: the menu of the day is replaced per date and copied from the day before", async () => {
    await saveDailyMenu({
      venueId: venue.id,
      menuId: dailyMenuId,
      onDate: "2030-01-01",
      urunler: [base.otherItemId, base.itemId],
    });
    expect(
      await copyPreviousDay({ venueId: venue.id, menuId: dailyMenuId, onDate: "2030-01-02" }),
    ).toMatchObject({
      ok: true,
      data: { count: 2 },
    });
    const copied = await withVenue(venue.id, (tx) => dailyItemIds(tx, dailyMenuId, "2030-01-02"));
    expect(copied).toEqual([base.otherItemId, base.itemId]);
    expect(
      await saveDailyMenu({
        venueId: venue.id,
        menuId: base.menuId,
        onDate: "2030-01-01",
        urunler: [],
      }),
    ).toMatchObject({ ok: false, code: "notFound" }); // not a daily menu
  });
});
