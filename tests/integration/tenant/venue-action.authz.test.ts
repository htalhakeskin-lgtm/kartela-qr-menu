import { eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import type { VenueRole } from "@/config/permissions";
import { fail, ok } from "@/lib/result";
import { venueAction } from "@/server/action";
import { getSession, type Session } from "@/server/auth";
import { newId } from "@/server/db/columns";
import { withPlatform, withVenue } from "@/server/db/tenant";
import { venueDomains, venueMembers } from "@/server/db/tenant/tables";

import { createUser, createVenue, removeUsers, removeVenues, type TestVenue } from "./fixtures";

/**
 * BR-KRC-003 — a panel action reaches only the venues the user belongs to (ADR-0004). The session
 * and client IP come from the request (Next.js headers), which Vitest does not have: those two are
 * stubbed; the database, the roles and row level security are real.
 */
vi.mock("@/server/auth", () => ({ getSession: vi.fn() }));
vi.mock("@/server/request", () => ({ clientIp: () => Promise.resolve("203.0.113.7") }));

const signIn = (userId: string | null, platformRole: string | null = null) => {
  vi.mocked(getSession).mockResolvedValue(
    userId ? ({ user: { id: userId, platformRole }, session: {} } as unknown as Session) : null,
  );
};

/** Reads one domain by id: answers notFound when row level security hides it. */
const readDomain = venueAction({
  permission: "settings.edit",
  schema: z.object({ venueId: z.uuid(), domainId: z.uuid() }),
  handler: async ({ domainId }, { tx }) => {
    const [row] = await tx
      .select({ host: venueDomains.host })
      .from(venueDomains)
      .where(eq(venueDomains.id, domainId))
      .limit(1);
    return row ? ok(row.host) : fail("notFound");
  },
});

/** Writes, then fails: the write must not survive. */
const addDomainThenFail = venueAction({
  permission: "settings.edit",
  schema: z.object({ venueId: z.uuid(), host: z.string() }),
  handler: async ({ venueId, host }, { tx }) => {
    await tx.insert(venueDomains).values({ venueId, host });
    return fail("conflict");
  },
});

describe("BR-KRC-003: venueAction (session → membership → permission → venue scope)", () => {
  let a: TestVenue;
  let b: TestVenue;
  const domain = { a: "", b: "" };
  const user = { owner: "", staff: "", outsider: "", admin: "" };

  const addMember = (venueId: string, userId: string, role: VenueRole) =>
    withVenue(venueId, (tx) => tx.insert(venueMembers).values({ venueId, userId, role }));

  beforeAll(async () => {
    [a, b] = [await createVenue("act-a"), await createVenue("act-b")];
    user.owner = await createUser();
    user.staff = await createUser();
    user.outsider = await createUser();
    user.admin = await createUser("admin");
    await addMember(a.id, user.owner, "owner");
    await addMember(b.id, user.outsider, "owner"); // owner of B, outsider to A
    await addMember(a.id, user.staff, "staff");
    for (const venue of [a, b]) {
      const [row] = await withVenue(venue.id, (tx) =>
        tx
          .insert(venueDomains)
          .values({ venueId: venue.id, host: `${venue.slug}.test.example.com` })
          .returning({ id: venueDomains.id }),
      );
      domain[venue === a ? "a" : "b"] = row!.id;
    }
  });

  afterAll(async () => {
    await removeVenues([a.id, b.id]);
    await removeUsers(Object.values(user));
  });

  beforeEach(() => {
    signIn(null);
  });

  it("without a session the action answers unauthorized", async () => {
    expect(await readDomain({ venueId: a.id, domainId: domain.a })).toMatchObject({
      ok: false,
      code: "unauthorized",
    });
  });

  it("a member with the permission reads its own venue's record", async () => {
    signIn(user.owner);
    expect(await readDomain({ venueId: a.id, domainId: domain.a })).toEqual({
      ok: true,
      data: `${a.slug}.test.example.com`,
    });
  });

  it("another venue's record answers notFound, not the record and not forbidden", async () => {
    signIn(user.owner);
    expect(await readDomain({ venueId: a.id, domainId: domain.b })).toMatchObject({
      ok: false,
      code: "notFound",
    });
  });

  it("a user who is not a member of the venue is forbidden", async () => {
    signIn(user.outsider);
    expect(await readDomain({ venueId: a.id, domainId: domain.a })).toMatchObject({
      ok: false,
      code: "forbidden",
    });
    signIn(user.owner); // owner of A asking for B
    expect(await readDomain({ venueId: b.id, domainId: domain.b })).toMatchObject({
      ok: false,
      code: "forbidden",
    });
  });

  it("a venue that does not exist looks the same as one the user cannot enter", async () => {
    signIn(user.owner);
    expect(await readDomain({ venueId: newId(), domainId: domain.a })).toMatchObject({
      ok: false,
      code: "forbidden",
    });
  });

  it("a member whose role lacks the permission is forbidden (staff: availability only)", async () => {
    signIn(user.staff);
    expect(await readDomain({ venueId: a.id, domainId: domain.a })).toMatchObject({
      ok: false,
      code: "forbidden",
    });
  });

  it("a platform admin acts on any existing venue without a membership", async () => {
    signIn(user.admin, "admin");
    expect(await readDomain({ venueId: b.id, domainId: domain.b })).toMatchObject({ ok: true });
    expect(await readDomain({ venueId: newId(), domainId: domain.b })).toMatchObject({
      ok: false,
      code: "notFound",
    });
  });

  it("a failed result rolls back the handler's writes", async () => {
    signIn(user.owner);
    const host = `rollback-${newId()}.test.example.com`;
    expect(await addDomainThenFail({ venueId: a.id, host })).toMatchObject({ code: "conflict" });
    const rows = await withPlatform((tx) =>
      tx.select().from(venueDomains).where(eq(venueDomains.host, host)),
    );
    expect(rows).toHaveLength(0);
  });

  it("an id that is not a UUID is a validation error before any lookup", async () => {
    signIn(user.owner);
    expect(await readDomain({ venueId: "rakim", domainId: domain.a })).toMatchObject({
      code: "validation",
    });
  });
});
