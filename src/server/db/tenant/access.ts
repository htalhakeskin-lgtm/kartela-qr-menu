import "server-only";

import { and, eq } from "drizzle-orm";

import { VENUE_ROLES, type VenueRole } from "@/config/permissions";

import { venues } from "../schema/venues";
import { withVenue } from "./scope";
import { venueMembers } from "./tables";

export type VenueAccess = { exists: boolean; role: VenueRole | null };

/** Does the venue exist, and which role does the user hold in it (BR-KRC-003)? */
export async function venueAccess(venueId: string, userId: string): Promise<VenueAccess> {
  return withVenue(venueId, async (tx) => {
    const [venue] = await tx
      .select({ id: venues.id })
      .from(venues)
      .where(eq(venues.id, venueId))
      .limit(1);
    if (!venue) return { exists: false, role: null };
    const [member] = await tx
      .select({ role: venueMembers.role })
      .from(venueMembers)
      .where(and(eq(venueMembers.venueId, venueId), eq(venueMembers.userId, userId)))
      .limit(1);
    const role = (VENUE_ROLES as readonly string[]).includes(member?.role ?? "")
      ? (member?.role as VenueRole)
      : null;
    return { exists: true, role };
  });
}
