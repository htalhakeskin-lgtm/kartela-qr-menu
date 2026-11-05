import "server-only";

import { and, asc, eq, isNotNull, type SQL } from "drizzle-orm";

import { VENUE_ROLES, type VenueRole } from "@/config/permissions";

import { venues } from "../schema/venues";
import { withPlatform, withVenue } from "./scope";
import { venueMembers } from "./tables";

/**
 * Panel memberships (plan §8, D-18). Listing a user's venues crosses venues, so it runs in the
 * platform scope — always filtered by the user, never a list of other people's memberships.
 */
export type PanelVenue = {
  id: string;
  slug: string;
  name: string;
  mode: "demo" | "live";
  timezone: string;
  defaultLocale: string;
  /** "platform": a platform admin without a membership in this venue. */
  role: VenueRole | "platform";
};

const asRole = (value: string | null | undefined): VenueRole | null =>
  (VENUE_ROLES as readonly string[]).includes(value ?? "") ? (value as VenueRole) : null;

async function queryVenues(
  userId: string,
  platformAdmin: boolean,
  filter?: SQL,
): Promise<PanelVenue[]> {
  return withPlatform(async (tx) => {
    const rows = await tx
      .select({
        id: venues.id,
        slug: venues.slug,
        name: venues.name,
        mode: venues.mode,
        timezone: venues.timezone,
        defaultLocale: venues.defaultLocale,
        role: venueMembers.role,
      })
      .from(venues)
      .leftJoin(
        venueMembers,
        and(eq(venueMembers.venueId, venues.id), eq(venueMembers.userId, userId)),
      )
      .where(
        and(
          eq(venues.status, "active"),
          platformAdmin ? undefined : isNotNull(venueMembers.id),
          filter,
        ),
      )
      .orderBy(asc(venues.name));
    return rows.flatMap((row) => {
      const role = asRole(row.role) ?? (platformAdmin ? ("platform" as const) : null);
      if (!role) return [];
      return [{ ...row, mode: row.mode === "live" ? "live" : "demo", role }];
    });
  });
}

/** The venues a panel user may open: every active venue for a platform admin. */
export async function panelVenues(userId: string, platformAdmin: boolean): Promise<PanelVenue[]> {
  return queryVenues(userId, platformAdmin);
}

/**
 * One venue by slug with the user's role in it; null when it does not exist or the user may not
 * open it — the panel answers both with the same 404 (BR-KRC-003).
 */
export async function panelVenue(
  slug: string,
  userId: string,
  platformAdmin: boolean,
): Promise<PanelVenue | null> {
  const [venue] = await queryVenues(userId, platformAdmin, eq(venues.slug, slug));
  return venue ?? null;
}

/** Seed: memberships of the demo accounts (config/demo-accounts.ts). Idempotent. */
export async function addMember(venueId: string, userId: string, role: VenueRole): Promise<void> {
  await withVenue(venueId, async (tx) => {
    await tx
      .insert(venueMembers)
      .values({ venueId, userId, role })
      .onConflictDoUpdate({
        target: [venueMembers.venueId, venueMembers.userId],
        set: { role, updatedAt: new Date() },
      });
  });
}
