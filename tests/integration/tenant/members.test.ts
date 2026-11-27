import { createHash } from "node:crypto";

import { eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import type { VenueRole } from "@/config/permissions";
import { getSession, type Session } from "@/server/auth";
import { db } from "@/server/db/client";
import { sessions } from "@/server/db/schema";
import {
  acceptInvitation,
  addMember,
  findInvitationByToken,
  loadSettings,
  withVenue,
} from "@/server/db/tenant";
import { auditLogs, venueMembers } from "@/server/db/tenant/tables";
import { parseSettings, saveVenueSettings, settingsFields } from "@/server/panel/settings";
import {
  cancelInvitation,
  changeMemberRole,
  inviteMember,
  removeMember,
} from "@/server/panel/team";

import { createUser, createVenue, removeUsers, removeVenues, type TestVenue } from "./fixtures";

/**
 * Team and settings actions (D-18b; BR-YTK-003, BR-KRC-003, plan §8). Session, client IP and the
 * request origin are stubbed (no Next.js request in Vitest); database, roles and row level
 * security are real.
 */
vi.mock("@/server/auth", () => ({ getSession: vi.fn() }));
vi.mock("@/server/request", () => ({
  clientIp: () => Promise.resolve("203.0.113.11"),
  hashIp: () => "ip-hash",
}));
vi.mock("@/server/platform-hosts", () => ({
  platformOrigin: () => Promise.resolve("http://localhost:3020"),
}));
vi.mock("next/cache", () => ({ updateTag: vi.fn(), revalidateTag: vi.fn() }));

const signIn = (userId: string) => {
  vi.mocked(getSession).mockResolvedValue({
    user: { id: userId, name: "Test Kişi", email: `${userId}@test.example.com` },
    session: {},
  } as unknown as Session);
};

describe("team (SCR-118)", () => {
  let venue: TestVenue;
  let other: TestVenue;
  const user = { owner: "", manager: "", staff: "", outsider: "" };
  const member: Record<string, string> = {};

  const join = async (venueId: string, userId: string, role: VenueRole) => {
    await addMember(venueId, userId, role);
    const [row] = await withVenue(venueId, (tx) =>
      tx.select({ id: venueMembers.id }).from(venueMembers).where(eq(venueMembers.userId, userId)),
    );
    return row!.id;
  };

  beforeAll(async () => {
    [venue, other] = [await createVenue("ekip-a"), await createVenue("ekip-b")];
    user.owner = await createUser();
    user.manager = await createUser();
    user.staff = await createUser();
    user.outsider = await createUser();
    member.owner = await join(venue.id, user.owner, "owner");
    member.manager = await join(venue.id, user.manager, "manager");
    member.staff = await join(venue.id, user.staff, "staff");
    await join(other.id, user.outsider, "owner");
  });

  afterAll(async () => {
    await removeVenues([venue.id, other.id]);
    await removeUsers(Object.values(user));
  });

  beforeEach(() => {
    signIn(user.owner);
  });

  it("only an owner manages the team; another venue's owner is refused", async () => {
    for (const id of [user.manager, user.staff, user.outsider]) {
      signIn(id);
      expect(
        await inviteMember({ venueId: venue.id, email: "yeni@test.example.com", role: "staff" }),
      ).toMatchObject({ ok: false, code: "forbidden" });
    }
  });

  it("an invitation is stored by its hash, opens once and is audited", async () => {
    const result = await inviteMember({
      venueId: venue.id,
      email: "Davetli@Test.Example.com",
      role: "manager",
    });
    if (!result.ok) throw new Error(result.message);
    const token = result.data.acceptUrl.split("/").at(-1)!;
    expect(result.data.to).toBe("davetli@test.example.com");
    const hash = createHash("sha256").update(token).digest("hex");

    const found = await findInvitationByToken(hash, new Date());
    expect(found).toMatchObject({ venueId: venue.id, role: "manager", venueSlug: venue.slug });
    expect(await findInvitationByToken(token, new Date())).toBeNull(); // the raw token is not stored

    const joiner = await createUser();
    try {
      expect(await acceptInvitation(found!, joiner, new Date())).toBe(true);
      expect(await acceptInvitation(found!, joiner, new Date())).toBe(false);
      expect(await findInvitationByToken(hash, new Date())).toBeNull();
      const actions = await withVenue(venue.id, (tx) =>
        tx.select({ action: auditLogs.action }).from(auditLogs),
      );
      expect(actions.map((row) => row.action)).toEqual(
        expect.arrayContaining(["members.invited", "members.joined"]),
      );
    } finally {
      await removeUsers([joiner]);
    }
  });

  it("an expired or revoked invitation does not open", async () => {
    const result = await inviteMember({
      venueId: venue.id,
      email: "geri@test.example.com",
      role: "staff",
    });
    if (!result.ok) throw new Error(result.message);
    const hash = createHash("sha256")
      .update(result.data.acceptUrl.split("/").at(-1)!)
      .digest("hex");
    const later = new Date(Date.now() + 8 * 86_400_000);
    expect(await findInvitationByToken(hash, later)).toBeNull();

    expect(
      await cancelInvitation({ venueId: venue.id, invitationId: result.data.invitationId }),
    ).toEqual({ ok: true, data: null });
    expect(await findInvitationByToken(hash, new Date())).toBeNull();
  });

  it("BR-YTK-003: the last owner cannot be demoted or removed", async () => {
    expect(
      await changeMemberRole({ venueId: venue.id, memberId: member.owner!, role: "manager" }),
    ).toMatchObject({ ok: false, code: "BR-YTK-003" });
    expect(await removeMember({ venueId: venue.id, memberId: member.owner! })).toMatchObject({
      ok: false,
      code: "BR-YTK-003",
    });
  });

  it("with a second owner the first may step down; the changed member's sessions end", async () => {
    await db.insert(sessions).values({
      id: `s-${user.manager}`,
      token: `t-${user.manager}`,
      userId: user.manager,
      expiresAt: new Date(Date.now() + 3_600_000),
    });
    expect(
      await changeMemberRole({ venueId: venue.id, memberId: member.manager!, role: "owner" }),
    ).toEqual({ ok: true, data: null });
    expect(await db.select().from(sessions).where(eq(sessions.userId, user.manager))).toHaveLength(
      0,
    );

    expect(
      await changeMemberRole({ venueId: venue.id, memberId: member.owner!, role: "manager" }),
    ).toEqual({ ok: true, data: null });
    signIn(user.manager); // the new owner
    expect(await removeMember({ venueId: venue.id, memberId: member.owner! })).toEqual({
      ok: true,
      data: null,
    });
  });

  it("BR-KRC-003: another venue's member is not found", async () => {
    signIn(user.outsider);
    expect(await removeMember({ venueId: other.id, memberId: member.staff! })).toMatchObject({
      ok: false,
      code: "notFound",
    });
  });
});

describe("settings (SCR-117)", () => {
  let venue: TestVenue;
  const user = { owner: "", manager: "" };

  beforeAll(async () => {
    venue = await createVenue("ayar");
    user.owner = await createUser();
    user.manager = await createUser();
    await addMember(venue.id, user.owner, "owner");
    await addMember(venue.id, user.manager, "manager");
    await withVenue(venue.id, async (tx) => {
      const { venueSettings } = await import("@/server/db/tenant/tables");
      await tx.insert(venueSettings).values({
        venueId: venue.id,
        contact: { address: "Moda, Kadıköy", phone: "+905423115888" },
        hours: { 1: [{ open: "08:00", close: "20:00" }] },
        seo: { description: { tr: "Kahve", en: "Coffee" } },
        wifi: { network: "Misafir", password: null },
      });
    });
  });

  afterAll(async () => {
    await removeVenues([venue.id]);
    await removeUsers(Object.values(user));
  });

  it("the form's fields read back into the same stored values", async () => {
    const row = await withVenue(venue.id, (tx) => loadSettings(tx, venue.id));
    const { values, errors } = parseSettings(settingsFields(row!, ["tr", "en"]));
    expect(errors).toEqual({});
    expect(values.contact).toEqual(row!.contact);
    expect(values.hours).toEqual(row!.hours);
    expect(values.seo).toEqual(row!.seo);
    expect(values.wifi).toEqual(row!.wifi);
  });

  it("a manager may not edit settings; a stale version is a conflict; a save is audited", async () => {
    const row = await withVenue(venue.id, (tx) => loadSettings(tx, venue.id));
    const fields = { ...settingsFields(row!, ["tr"]), venueId: venue.id };

    signIn(user.manager);
    expect(await saveVenueSettings({ ...fields, surum: row!.version })).toMatchObject({
      ok: false,
      code: "forbidden",
    });

    signIn(user.owner);
    expect(
      await saveVenueSettings({ ...fields, telefon: "123", surum: row!.version }),
    ).toMatchObject({
      ok: false,
      code: "validation",
      fieldErrors: { telefon: [expect.any(String)] },
    });
    expect(
      await saveVenueSettings({ ...fields, adres: "Yeni adres", surum: row!.version }),
    ).toMatchObject({ ok: true });
    expect(
      await saveVenueSettings({ ...fields, adres: "Daha yeni", surum: row!.version }),
    ).toMatchObject({ ok: false, code: "conflict" });

    const saved = await withVenue(venue.id, (tx) => loadSettings(tx, venue.id));
    expect(saved!.contact.address).toBe("Yeni adres");
    expect(saved!.version).toBe(row!.version + 1);
    const audit = await withVenue(venue.id, (tx) =>
      tx.select().from(auditLogs).where(eq(auditLogs.action, "settings.updated")),
    );
    expect(audit[0]?.changes?.contact).toMatchObject({
      from: { address: "Moda, Kadıköy" },
      to: { address: "Yeni adres" },
    });
  });
});
