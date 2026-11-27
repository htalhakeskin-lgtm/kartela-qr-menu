import "server-only";

import { and, asc, count, eq } from "drizzle-orm";

import { venues } from "../schema/venues";
import { withPlatform, withVenue } from "./scope";
import { venueDomains, venueMembers } from "./tables";

/**
 * Platform admin's reads and writes across venues (D-19, K-50): the venue list with domains and
 * member counts, and a venue's domain rows. Callers live in src/server/platform/ (ESLint).
 */
export type DomainStatus = "pending" | "active" | "error";
export type DomainRow = { id: string; host: string; isPrimary: boolean; status: DomainStatus };

export type PlatformVenueRow = {
  id: string;
  slug: string;
  name: string;
  kind: string;
  themeId: string;
  mode: "demo" | "live";
  locales: string[];
  members: number;
  domains: DomainRow[];
};

export async function platformVenueRows(): Promise<PlatformVenueRow[]> {
  return withPlatform(async (tx) => {
    const rows = await tx
      .select({
        id: venues.id,
        slug: venues.slug,
        name: venues.name,
        kind: venues.kind,
        themeId: venues.themeId,
        mode: venues.mode,
        locales: venues.locales,
      })
      .from(venues)
      .where(eq(venues.status, "active"))
      .orderBy(asc(venues.name));
    const domains = await tx
      .select({
        id: venueDomains.id,
        venueId: venueDomains.venueId,
        host: venueDomains.host,
        isPrimary: venueDomains.isPrimary,
        status: venueDomains.status,
      })
      .from(venueDomains)
      .orderBy(asc(venueDomains.createdAt));
    const members = await tx
      .select({ venueId: venueMembers.venueId, n: count() })
      .from(venueMembers)
      .groupBy(venueMembers.venueId);
    return rows.map((row) => ({
      ...row,
      mode: row.mode === "live" ? ("live" as const) : ("demo" as const),
      members: members.find((entry) => entry.venueId === row.id)?.n ?? 0,
      domains: domains
        .filter((domain) => domain.venueId === row.id)
        .map((domain) => ({
          id: domain.id,
          host: domain.host,
          isPrimary: domain.isPrimary,
          status: domain.status as DomainStatus,
        })),
    }));
  });
}

/** BR-KRC-004: a host belongs to one venue only. */
export async function hostTaken(host: string): Promise<boolean> {
  const rows = await withPlatform((tx) =>
    tx.select({ id: venueDomains.id }).from(venueDomains).where(eq(venueDomains.host, host)),
  );
  return rows.length > 0;
}

export async function insertDomain(venueId: string, host: string): Promise<string> {
  const [row] = await withVenue(venueId, (tx) =>
    tx
      .insert(venueDomains)
      .values({ venueId, host, status: "pending" })
      .returning({ id: venueDomains.id }),
  );
  if (!row) throw new Error("domain not written");
  return row.id;
}

export async function setDomainStatus(venueId: string, domainId: string, status: DomainStatus) {
  await withVenue(venueId, (tx) =>
    tx
      .update(venueDomains)
      .set({ status, verifiedAt: status === "active" ? new Date() : null, updatedAt: new Date() })
      .where(eq(venueDomains.id, domainId)),
  );
}

export async function findDomain(
  venueId: string,
  domainId: string,
): Promise<{ id: string; host: string; isPrimary: boolean } | null> {
  const [row] = await withVenue(venueId, (tx) =>
    tx
      .select({ id: venueDomains.id, host: venueDomains.host, isPrimary: venueDomains.isPrimary })
      .from(venueDomains)
      .where(and(eq(venueDomains.id, domainId), eq(venueDomains.venueId, venueId))),
  );
  return row ?? null;
}

export async function deleteDomain(venueId: string, domainId: string) {
  await withVenue(venueId, (tx) => tx.delete(venueDomains).where(eq(venueDomains.id, domainId)));
}

/** Every membership, for the platform's user list. */
export async function allMemberships(): Promise<
  { userId: string; venueName: string; role: string }[]
> {
  return withPlatform((tx) =>
    tx
      .select({ userId: venueMembers.userId, venueName: venues.name, role: venueMembers.role })
      .from(venueMembers)
      .innerJoin(venues, eq(venues.id, venueMembers.venueId))
      .orderBy(asc(venues.name)),
  );
}
