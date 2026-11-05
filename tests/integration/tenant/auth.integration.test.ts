import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import type { VenueRole } from "@/config/permissions";
import { ok } from "@/lib/result";
import { platformAction, venueAction } from "@/server/action";
import { getSession, type Session } from "@/server/auth";
import { addMember, panelVenue, panelVenues } from "@/server/db/tenant";

import { createUser, createVenue, removeUsers, removeVenues, type TestVenue } from "./fixtures";

/**
 * BR-YTK-002 on the server, and the panel's membership queries (D-18). The live platform is
 * simulated (PLATFORM_DEMO=false); the session is stubbed like in venue-action.authz.test.ts, the
 * database, roles and row level security are real.
 */
vi.mock("@/lib/env", async (original) => {
  const actual = await original<typeof import("@/lib/env")>();
  return { ...actual, env: { ...actual.env, PLATFORM_DEMO: false } };
});
vi.mock("@/server/auth", () => ({ getSession: vi.fn() }));
vi.mock("@/server/request", () => ({ clientIp: () => Promise.resolve("203.0.113.9") }));
vi.mock("next/cache", () => ({ updateTag: vi.fn(), revalidateTag: vi.fn() }));

const signIn = (userId: string, options: { admin?: boolean; twoFactor?: boolean } = {}) => {
  vi.mocked(getSession).mockResolvedValue({
    user: {
      id: userId,
      platformRole: options.admin ? "admin" : null,
      twoFactorEnabled: options.twoFactor ?? false,
    },
    session: {},
  } as unknown as Session);
};

const touchVenue = venueAction({
  permission: "availability.edit",
  schema: z.object({ venueId: z.uuid() }),
  handler: () => Promise.resolve(ok("done")),
});

const touchPlatform = platformAction({
  permission: "platform.venues",
  schema: z.object({}),
  handler: () => Promise.resolve(ok("done")),
});

describe("BR-YTK-002: a second step before work on the live platform", () => {
  let venue: TestVenue;
  let other: TestVenue;
  const user = { owner: "", manager: "", admin: "" };

  const member = (venueId: string, userId: string, role: VenueRole) =>
    addMember(venueId, userId, role);

  beforeAll(async () => {
    [venue, other] = [await createVenue("ytk-a"), await createVenue("ytk-b")];
    user.owner = await createUser();
    user.manager = await createUser();
    user.admin = await createUser("admin");
    await member(venue.id, user.owner, "owner");
    await member(venue.id, user.manager, "manager");
  });

  afterAll(async () => {
    await removeVenues([venue.id, other.id]);
    await removeUsers(Object.values(user));
  });

  it("an owner without a second step is refused, with one it may act", async () => {
    signIn(user.owner);
    expect(await touchVenue({ venueId: venue.id })).toMatchObject({ ok: false, code: "forbidden" });
    signIn(user.owner, { twoFactor: true });
    expect(await touchVenue({ venueId: venue.id })).toEqual({ ok: true, data: "done" });
  });

  it("a manager needs no second step", async () => {
    signIn(user.manager);
    expect(await touchVenue({ venueId: venue.id })).toEqual({ ok: true, data: "done" });
  });

  it("a platform admin without a second step is refused on venues and platform actions", async () => {
    signIn(user.admin, { admin: true });
    expect(await touchVenue({ venueId: venue.id })).toMatchObject({ ok: false, code: "forbidden" });
    expect(await touchPlatform({})).toMatchObject({ ok: false, code: "forbidden" });
    signIn(user.admin, { admin: true, twoFactor: true });
    expect(await touchPlatform({})).toEqual({ ok: true, data: "done" });
  });

  it("BR-KRC-003: the panel lists only the user's venues; an admin sees every venue", async () => {
    const mine = await panelVenues(user.manager, false);
    expect(mine.map((v) => v.slug)).toContain(venue.slug);
    expect(mine.map((v) => v.slug)).not.toContain(other.slug);
    expect(mine.find((v) => v.slug === venue.slug)?.role).toBe("manager");

    expect(await panelVenue(other.slug, user.manager, false)).toBeNull();
    expect((await panelVenue(other.slug, user.admin, true))?.role).toBe("platform");
  });
});
