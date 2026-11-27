import "server-only";

import { and, desc, eq, gt, isNull, like, lt, type SQL } from "drizzle-orm";

import type { VenueRole } from "@/config/permissions";

import { venues } from "../schema/venues";
import { type TenantTx, withPlatform, withVenue } from "./scope";
import { auditLogs, venueInvitations, venueMembers, venueSettings } from "./tables";

/**
 * Panel data of one venue (D-18b): team and invitations, settings, audit log. Every function but
 * the invitation lookup runs inside the caller's venue scope (a venueAction's tx); the lookup by
 * token crosses venues because the link does not say which venue it belongs to.
 */

// --- team -------------------------------------------------------------------------------------

export type TeamMember = { id: string; userId: string; role: VenueRole; since: Date };
export type OpenInvitation = { id: string; email: string; role: VenueRole; expiresAt: Date };

export async function listTeam(
  tx: TenantTx,
  venueId: string,
  now: Date,
): Promise<{ members: TeamMember[]; invitations: OpenInvitation[] }> {
  const members = await tx
    .select({
      id: venueMembers.id,
      userId: venueMembers.userId,
      role: venueMembers.role,
      since: venueMembers.createdAt,
    })
    .from(venueMembers)
    .where(eq(venueMembers.venueId, venueId))
    .orderBy(venueMembers.createdAt);
  const invitations = await tx
    .select({
      id: venueInvitations.id,
      email: venueInvitations.email,
      role: venueInvitations.role,
      expiresAt: venueInvitations.expiresAt,
    })
    .from(venueInvitations)
    .where(
      and(
        eq(venueInvitations.venueId, venueId),
        isNull(venueInvitations.acceptedAt),
        isNull(venueInvitations.revokedAt),
        gt(venueInvitations.expiresAt, now),
      ),
    )
    .orderBy(desc(venueInvitations.createdAt));
  return {
    members: members.map((row) => ({ ...row, role: row.role as VenueRole })),
    invitations: invitations.map((row) => ({ ...row, role: row.role as VenueRole })),
  };
}

export async function findMember(
  tx: TenantTx,
  memberId: string,
): Promise<{ id: string; userId: string; role: VenueRole } | null> {
  const [row] = await tx
    .select({ id: venueMembers.id, userId: venueMembers.userId, role: venueMembers.role })
    .from(venueMembers)
    .where(eq(venueMembers.id, memberId))
    .limit(1);
  return row ? { ...row, role: row.role as VenueRole } : null;
}

export async function findMemberByUser(tx: TenantTx, userId: string): Promise<boolean> {
  const [row] = await tx
    .select({ id: venueMembers.id })
    .from(venueMembers)
    .where(eq(venueMembers.userId, userId))
    .limit(1);
  return Boolean(row);
}

/**
 * BR-YTK-003: how many owners the venue has (row level security limits it to this venue). The
 * owner rows stay locked until the transaction ends, so two owners demoting each other at the
 * same moment cannot both pass the check.
 */
export async function ownerCount(tx: TenantTx): Promise<number> {
  const rows = await tx
    .select({ id: venueMembers.id })
    .from(venueMembers)
    .where(eq(venueMembers.role, "owner"))
    .for("update");
  return rows.length;
}

export async function setMemberRole(tx: TenantTx, memberId: string, role: VenueRole) {
  await tx
    .update(venueMembers)
    .set({ role, updatedAt: new Date() })
    .where(eq(venueMembers.id, memberId));
}

export async function deleteMember(tx: TenantTx, memberId: string) {
  await tx.delete(venueMembers).where(eq(venueMembers.id, memberId));
}

/** A new invitation replaces the address's open one (ux_venue_invitations_open). */
export async function createInvitation(
  tx: TenantTx,
  values: {
    venueId: string;
    email: string;
    role: VenueRole;
    tokenHash: string;
    invitedBy: string;
    expiresAt: Date;
  },
  now: Date,
): Promise<string> {
  await tx
    .update(venueInvitations)
    .set({ revokedAt: now })
    .where(
      and(
        eq(venueInvitations.email, values.email),
        isNull(venueInvitations.acceptedAt),
        isNull(venueInvitations.revokedAt),
      ),
    );
  const [row] = await tx
    .insert(venueInvitations)
    .values(values)
    .returning({ id: venueInvitations.id });
  if (!row) throw new Error("invitation not written");
  return row.id;
}

export async function revokeInvitation(
  tx: TenantTx,
  invitationId: string,
  now: Date,
): Promise<string | null> {
  const [row] = await tx
    .update(venueInvitations)
    .set({ revokedAt: now })
    .where(
      and(
        eq(venueInvitations.id, invitationId),
        isNull(venueInvitations.acceptedAt),
        isNull(venueInvitations.revokedAt),
      ),
    )
    .returning({ email: venueInvitations.email });
  return row?.email ?? null;
}

export type InvitationByToken = {
  id: string;
  venueId: string;
  venueSlug: string;
  venueName: string;
  email: string;
  role: VenueRole;
  expiresAt: Date;
};

/** The open, unexpired invitation a link points at; null for anything else. */
export async function findInvitationByToken(
  tokenHash: string,
  now: Date,
): Promise<InvitationByToken | null> {
  return withPlatform(async (tx) => {
    const [row] = await tx
      .select({
        id: venueInvitations.id,
        venueId: venueInvitations.venueId,
        venueSlug: venues.slug,
        venueName: venues.name,
        email: venueInvitations.email,
        role: venueInvitations.role,
        expiresAt: venueInvitations.expiresAt,
      })
      .from(venueInvitations)
      .innerJoin(venues, eq(venues.id, venueInvitations.venueId))
      .where(
        and(
          eq(venueInvitations.tokenHash, tokenHash),
          isNull(venueInvitations.acceptedAt),
          isNull(venueInvitations.revokedAt),
          gt(venueInvitations.expiresAt, now),
          eq(venues.status, "active"),
        ),
      )
      .limit(1);
    return row ? { ...row, role: row.role as VenueRole } : null;
  });
}

/**
 * Accepting: the membership (an existing one takes the invited role) and the invitation's
 * acceptance in one transaction of the invitation's venue. False when someone else accepted or
 * revoked it in the meantime.
 */
export async function acceptInvitation(
  invitation: Pick<InvitationByToken, "id" | "venueId" | "role">,
  userId: string,
  now: Date,
): Promise<boolean> {
  return withVenue(invitation.venueId, async (tx) => {
    const [taken] = await tx
      .update(venueInvitations)
      .set({ acceptedAt: now })
      .where(
        and(
          eq(venueInvitations.id, invitation.id),
          isNull(venueInvitations.acceptedAt),
          isNull(venueInvitations.revokedAt),
        ),
      )
      .returning({ id: venueInvitations.id });
    if (!taken) return false;
    await tx
      .insert(venueMembers)
      .values({ venueId: invitation.venueId, userId, role: invitation.role })
      .onConflictDoUpdate({
        target: [venueMembers.venueId, venueMembers.userId],
        set: { role: invitation.role, updatedAt: now },
      });
    await tx.insert(auditLogs).values({
      venueId: invitation.venueId,
      actorId: userId,
      action: "members.joined",
      entity: "venue_member",
      entityId: userId,
      changes: { role: { from: null, to: invitation.role } },
    });
    return true;
  });
}

// --- settings ---------------------------------------------------------------------------------

export type VenueSettingsRow = typeof venueSettings.$inferSelect;

export async function loadSettings(
  tx: TenantTx,
  venueId: string,
): Promise<VenueSettingsRow | null> {
  const [row] = await tx
    .select()
    .from(venueSettings)
    .where(eq(venueSettings.venueId, venueId))
    .limit(1);
  return row ?? null;
}

/** Optimistic lock (05-sunucu-ve-api §6): false when the row changed since `version` was read. */
export async function saveSettings(
  tx: TenantTx,
  venueId: string,
  version: number,
  values: Pick<VenueSettingsRow, "contact" | "hours" | "seo" | "legal" | "wifi">,
): Promise<boolean> {
  const rows = await tx
    .update(venueSettings)
    .set({ ...values, version: version + 1, updatedAt: new Date() })
    .where(and(eq(venueSettings.venueId, venueId), eq(venueSettings.version, version)))
    .returning({ venueId: venueSettings.venueId });
  return rows.length === 1;
}

// --- audit log --------------------------------------------------------------------------------

export type AuditRow = {
  id: string;
  actorId: string | null;
  action: string;
  entity: string | null;
  entityId: string | null;
  changes: Record<string, { from: unknown; to: unknown }> | null;
  createdAt: Date;
};

export async function listAudit(
  tx: TenantTx,
  options: { limit: number; before?: Date; actionPrefix?: string },
): Promise<AuditRow[]> {
  const filters: (SQL | undefined)[] = [
    options.before ? lt(auditLogs.createdAt, options.before) : undefined,
    // The prefix comes from a fixed list of groups (members, settings …), never free text.
    options.actionPrefix ? like(auditLogs.action, `${options.actionPrefix}.%`) : undefined,
  ];
  const rows = await tx
    .select({
      id: auditLogs.id,
      actorId: auditLogs.actorId,
      action: auditLogs.action,
      entity: auditLogs.entity,
      entityId: auditLogs.entityId,
      changes: auditLogs.changes,
      createdAt: auditLogs.createdAt,
    })
    .from(auditLogs)
    .where(and(...filters))
    .orderBy(desc(auditLogs.createdAt))
    .limit(options.limit);
  return rows;
}
