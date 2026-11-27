import "server-only";

import { createHash, randomBytes } from "node:crypto";

import { APIError } from "better-auth/api";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";

import { INVITATION_DAYS, rateLimits } from "@/config/limits";
import { VENUE_ROLES, type VenueRole } from "@/config/permissions";
import { fail, type FieldErrors, ok } from "@/lib/result";
import { publicAction, venueAction, type VenueContext } from "@/server/action";
import { auth } from "@/server/auth";
import { send } from "@/server/channels";
import { venues } from "@/server/db/schema";
import {
  acceptInvitation,
  createInvitation,
  deleteMember,
  findInvitationByToken,
  findMember,
  findMemberByUser,
  type InvitationByToken,
  listTeam,
  type OpenInvitation,
  ownerCount,
  recordAudit,
  revokeInvitation,
  setMemberRole,
  withVenue,
} from "@/server/db/tenant";
import { isDemoAccount } from "@/server/demo-accounts";
import { platformOrigin } from "@/server/platform-hosts";
import { hashIp } from "@/server/request";

import {
  createPasswordUser,
  passwordIsBreached,
  revokeSessions,
  userDirectory,
  userIdByEmail,
} from "./users";

/**
 * Team (SCR-118, plan §8): invitations by e-mail, role changes and removal, owners only
 * (`members.manage`). The last owner stays (BR-YTK-003); a changed or removed member's sessions
 * end (11-guvenlik §4). A shared demo account changes nothing here.
 */
const DEMO_TEAM =
  "Demo hesabıyla ekip değiştirilemez: davet, rol değişikliği ve çıkarma gerçek hesaplarda çalışır.";
const INVALID_INVITATION = "Bu davet geçersiz, kullanılmış ya da süresi dolmuş.";

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

const email = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, "E-posta adresi çok uzun.")
  .pipe(z.email({ error: "Geçerli bir e-posta adresi girin." }));

export type TeamView = {
  members: {
    id: string;
    name: string;
    email: string;
    role: VenueRole;
    since: Date;
    you: boolean;
  }[];
  invitations: OpenInvitation[];
};

export async function teamView(venueId: string, userId: string, now: Date): Promise<TeamView> {
  const { members, invitations } = await withVenue(venueId, (tx) => listTeam(tx, venueId, now));
  const people = await userDirectory(members.map((member) => member.userId));
  return {
    members: members.map((member) => ({
      id: member.id,
      name: people.get(member.userId)?.name ?? "—",
      email: people.get(member.userId)?.email ?? "",
      role: member.role,
      since: member.since,
      you: member.userId === userId,
    })),
    invitations,
  };
}

function audit(
  ctx: VenueContext,
  action: string,
  entity: string,
  entityId: string,
  changes: Record<string, { from: unknown; to: unknown }>,
) {
  return recordAudit(ctx.tx, {
    venueId: ctx.venueId,
    actorId: ctx.session.user.id,
    action,
    entity,
    entityId,
    changes,
    ipHash: hashIp(ctx.ip),
  });
}

export type InvitationMail = {
  to: string;
  invitationId: string;
  venueName: string;
  inviterName: string;
  acceptUrl: string;
  expiresAt: string;
};

export const inviteMember = venueAction({
  permission: "members.manage",
  schema: z.object({ venueId: z.uuid(), email, role: z.enum(VENUE_ROLES) }),
  handler: async ({ venueId, email: address, role }, ctx) => {
    if (isDemoAccount(ctx.session.user.email)) return fail("forbidden", { message: DEMO_TEAM });
    const existing = await userIdByEmail(address);
    if (existing && (await findMemberByUser(ctx.tx, existing))) {
      return fail("conflict", { fieldErrors: { email: ["Bu kişi zaten ekipte."] } });
    }
    const [venue] = await ctx.tx
      .select({ name: venues.name })
      .from(venues)
      .where(eq(venues.id, venueId))
      .limit(1);
    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(ctx.now.getTime() + INVITATION_DAYS * 86_400_000);
    const invitationId = await createInvitation(
      ctx.tx,
      {
        venueId,
        email: address,
        role,
        tokenHash: hashToken(token),
        invitedBy: ctx.session.user.id,
        expiresAt,
      },
      ctx.now,
    );
    await audit(ctx, "members.invited", "venue_invitation", invitationId, {
      email: { from: null, to: address },
      role: { from: null, to: role },
    });
    return ok<InvitationMail>({
      to: address,
      invitationId,
      venueName: venue?.name ?? "",
      inviterName: ctx.session.user.name,
      acceptUrl: `${await platformOrigin()}/panel/giris/davet/${token}`,
      expiresAt: expiresAt.toISOString(),
    });
  },
});

/** After the invitation is committed: the e-mail (demo: the demo outbox), never inside the tx. */
export async function sendInvitation(mail: InvitationMail): Promise<void> {
  await send({
    channel: "email",
    to: mail.to,
    template: "panelInvitation",
    data: {
      venueName: mail.venueName,
      inviterName: mail.inviterName,
      acceptUrl: mail.acceptUrl,
      expiresAt: mail.expiresAt,
    },
    relatedId: mail.invitationId,
  });
}

export const cancelInvitation = venueAction({
  permission: "members.manage",
  schema: z.object({ venueId: z.uuid(), invitationId: z.uuid() }),
  handler: async ({ invitationId }, ctx) => {
    if (isDemoAccount(ctx.session.user.email)) return fail("forbidden", { message: DEMO_TEAM });
    const address = await revokeInvitation(ctx.tx, invitationId, ctx.now);
    if (!address) return fail("notFound");
    await audit(ctx, "members.invitation_revoked", "venue_invitation", invitationId, {
      email: { from: address, to: null },
    });
    return ok(null);
  },
});

export const changeMemberRole = venueAction({
  permission: "members.manage",
  schema: z.object({ venueId: z.uuid(), memberId: z.uuid(), role: z.enum(VENUE_ROLES) }),
  handler: async ({ memberId, role }, ctx) => {
    if (isDemoAccount(ctx.session.user.email)) return fail("forbidden", { message: DEMO_TEAM });
    const member = await findMember(ctx.tx, memberId);
    if (!member) return fail("notFound");
    if (member.role === role) return ok(null);
    if (member.role === "owner" && (await ownerCount(ctx.tx)) <= 1) return fail("BR-YTK-003");
    await setMemberRole(ctx.tx, memberId, role);
    await audit(ctx, "members.role_changed", "venue_member", member.userId, {
      role: { from: member.role, to: role },
    });
    await revokeSessions(member.userId);
    return ok(null);
  },
});

export const removeMember = venueAction({
  permission: "members.manage",
  schema: z.object({ venueId: z.uuid(), memberId: z.uuid() }),
  handler: async ({ memberId }, ctx) => {
    if (isDemoAccount(ctx.session.user.email)) return fail("forbidden", { message: DEMO_TEAM });
    const member = await findMember(ctx.tx, memberId);
    if (!member) return fail("notFound");
    if (member.role === "owner" && (await ownerCount(ctx.tx)) <= 1) return fail("BR-YTK-003");
    await deleteMember(ctx.tx, memberId);
    await audit(ctx, "members.removed", "venue_member", member.userId, {
      role: { from: member.role, to: null },
    });
    await revokeSessions(member.userId);
    return ok(null);
  },
});

/** The invitation a link opens, and whether its address already has an account. */
export async function invitationView(
  token: string,
  now: Date,
): Promise<{ invitation: InvitationByToken; hasAccount: boolean } | null> {
  if (!/^[A-Za-z0-9_-]{20,100}$/.test(token)) return null;
  const invitation = await findInvitationByToken(hashToken(token), now);
  if (!invitation) return null;
  return { invitation, hasAccount: Boolean(await userIdByEmail(invitation.email)) };
}

/**
 * Accepting an invitation: a new address sets its name and password (15+ characters, not in a
 * known breach); an existing account proves itself with its password. Then the membership, and
 * the user is signed in (or sent to the second step when the account has one).
 */
export const acceptInvitationWithPassword = publicAction({
  schema: z.object({
    belirtec: z.string().regex(/^[A-Za-z0-9_-]{20,100}$/),
    ad: z.string().trim().max(80).optional(),
    parola: z.string().min(1, "Parolanızı girin.").max(128, "Parola en çok 128 karakter."),
    tekrar: z.string().max(128).optional(),
  }),
  rateLimit: rateLimits.invitationAccept,
  handler: async ({ belirtec, ad, parola, tekrar }, ctx) => {
    const invitation = await findInvitationByToken(hashToken(belirtec), ctx.now);
    if (!invitation) return fail("notFound", { message: INVALID_INVITATION });

    let userId = await userIdByEmail(invitation.email);
    if (!userId) {
      const errors: FieldErrors = {};
      if (!ad || ad.length < 2) errors.ad = ["Adınızı ve soyadınızı girin."];
      if (parola.length < 15) errors.parola = ["Parola en az 15 karakter olmalı."];
      else if (await passwordIsBreached(parola)) {
        errors.parola = [
          "Bu parola sızdırılmış parola listelerinde geçiyor; başka bir parola seçin.",
        ];
      }
      if (tekrar !== parola) errors.tekrar = ["İki parola aynı değil."];
      if (Object.keys(errors).length > 0) return fail("validation", { fieldErrors: errors });
      userId = await createPasswordUser({
        email: invitation.email,
        name: ad ?? "",
        password: parola,
      });
    }

    let secondStep = false;
    try {
      const result = await auth.api.signInEmail({
        body: { email: invitation.email, password: parola, rememberMe: true },
        headers: await headers(),
      });
      secondStep = "twoFactorRedirect" in result;
    } catch (error) {
      if (!(error instanceof APIError)) throw error;
      return fail("validation", { fieldErrors: { parola: ["Parola hatalı."] } });
    }

    if (!(await acceptInvitation(invitation, userId, ctx.now))) {
      return fail("conflict", { message: INVALID_INVITATION });
    }
    const home = `/panel/${invitation.venueSlug}`;
    return ok({
      to: secondStep ? `/panel/giris/dogrula?donus=${encodeURIComponent(home)}` : home,
    });
  },
});
