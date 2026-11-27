import { eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { getSession, type Session } from "@/server/auth";
import { db } from "@/server/db/client";
import { users, venues } from "@/server/db/schema";
import { addMember, withVenue } from "@/server/db/tenant";
import { venueDomains } from "@/server/db/tenant/tables";
import { setPlatformAdmin } from "@/server/platform/users";
import {
  addVenueDomain,
  removeVenueDomain,
  setVenueMode,
  verifyVenueDomain,
} from "@/server/platform/venues";

import { createUser, createVenue, removeUsers, removeVenues, type TestVenue } from "./fixtures";

/**
 * Platform admin actions (D-19, K-50; BR-KRC-004). No Vercel token in tests: the manual path
 * (the admin confirms the domain). Session, IP and cache refresh are stubbed.
 */
vi.mock("@/server/auth", () => ({ getSession: vi.fn() }));
vi.mock("@/server/request", () => ({
  clientIp: () => Promise.resolve("203.0.113.21"),
  hashIp: () => "ip-hash",
}));
vi.mock("next/cache", () => ({ updateTag: vi.fn(), revalidateTag: vi.fn() }));

const signIn = (userId: string, admin: boolean) => {
  vi.mocked(getSession).mockResolvedValue({
    user: {
      id: userId,
      email: `${userId}@test.example.com`,
      platformRole: admin ? "admin" : null,
      twoFactorEnabled: true,
    },
    session: {},
  } as unknown as Session);
};

describe("platform admin (SCR-130…132)", () => {
  let venue: TestVenue;
  let other: TestVenue;
  const user = { admin: "", owner: "", plain: "" };

  beforeAll(async () => {
    [venue, other] = [await createVenue("plat-a"), await createVenue("plat-b")];
    user.admin = await createUser("admin");
    user.owner = await createUser();
    user.plain = await createUser();
    await addMember(venue.id, user.owner, "owner");
    await withVenue(venue.id, (tx) =>
      tx.insert(venueDomains).values({
        venueId: venue.id,
        host: `${venue.slug}.test.example.com`,
        isPrimary: true,
        status: "active",
      }),
    );
  });

  afterAll(async () => {
    await removeVenues([venue.id, other.id]);
    await removeUsers(Object.values(user));
  });

  beforeEach(() => {
    signIn(user.admin, true);
  });

  it("a venue owner is not a platform admin", async () => {
    signIn(user.owner, false);
    expect(await setVenueMode({ mekan: venue.slug, mode: "live" })).toMatchObject({
      ok: false,
      code: "forbidden",
    });
    expect(await setPlatformAdmin({ userId: user.plain, admin: "evet" })).toMatchObject({
      ok: false,
      code: "forbidden",
    });
  });

  it("the mode changes in the database (the build carries it, K-50)", async () => {
    expect(await setVenueMode({ mekan: venue.slug, mode: "live" })).toEqual({
      ok: true,
      data: null,
    });
    const [row] = await db
      .select({ mode: venues.mode })
      .from(venues)
      .where(eq(venues.id, venue.id));
    expect(row?.mode).toBe("live");
  });

  it("BR-KRC-004: a domain is added pending, confirmed by hand, and belongs to one venue", async () => {
    const host = `menu-${venue.slug}.test.example.com`;
    expect(await addVenueDomain({ mekan: venue.slug, host: host.toUpperCase() })).toMatchObject({
      ok: true,
      data: { api: false, verified: false },
    });
    expect(await addVenueDomain({ mekan: other.slug, host })).toMatchObject({
      ok: false,
      code: "conflict",
    });
    const [domain] = await withVenue(venue.id, (tx) =>
      tx.select().from(venueDomains).where(eq(venueDomains.host, host)),
    );
    expect(domain?.status).toBe("pending");
    expect(await verifyVenueDomain({ mekan: venue.slug, domainId: domain!.id })).toEqual({
      ok: true,
      data: null,
    });
    expect(await removeVenueDomain({ mekan: venue.slug, domainId: domain!.id })).toEqual({
      ok: true,
      data: null,
    });
  });

  it("the primary domain is not removed from the panel; another venue's domain is not found", async () => {
    const [primary] = await withVenue(venue.id, (tx) =>
      tx.select().from(venueDomains).where(eq(venueDomains.isPrimary, true)),
    );
    expect(await removeVenueDomain({ mekan: venue.slug, domainId: primary!.id })).toMatchObject({
      ok: false,
      code: "forbidden",
    });
    expect(await removeVenueDomain({ mekan: other.slug, domainId: primary!.id })).toMatchObject({
      ok: false,
      code: "notFound",
    });
  });

  it("platform admin role: granted and taken, never one's own", async () => {
    expect(await setPlatformAdmin({ userId: user.admin, admin: "hayir" })).toMatchObject({
      ok: false,
      code: "forbidden",
    });
    expect(await setPlatformAdmin({ userId: user.plain, admin: "evet" })).toEqual({
      ok: true,
      data: null,
    });
    const [row] = await db
      .select({ role: users.platformRole })
      .from(users)
      .where(eq(users.id, user.plain));
    expect(row?.role).toBe("admin");
  });
});
