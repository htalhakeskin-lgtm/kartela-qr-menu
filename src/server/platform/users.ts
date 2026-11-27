import "server-only";

import { asc, eq } from "drizzle-orm";
import { z } from "zod";

import { ROLE_LABELS, type VenueRole } from "@/config/permissions";
import { fail, ok } from "@/lib/result";
import { platformAction } from "@/server/action";
import { db } from "@/server/db/client";
import { users } from "@/server/db/schema";
import { allMemberships, recordPlatformAudit } from "@/server/db/tenant";
import { isDemoAccount } from "@/server/demo-accounts";
import { revokeSessions } from "@/server/panel/users";
import { hashIp } from "@/server/request";

/**
 * Platform users (SCR-132; plan §8): every panel account with its memberships, and the platform
 * admin role. Venue roles are given from each venue's team page (an admin may open any venue);
 * a changed account's sessions end. An admin cannot change their own role; a demo account
 * changes nothing.
 */
export type PlatformUserRow = {
  id: string;
  name: string;
  email: string;
  platformAdmin: boolean;
  twoFactor: boolean;
  memberships: string[];
};

export async function platformUsers(): Promise<PlatformUserRow[]> {
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      platformRole: users.platformRole,
      twoFactorEnabled: users.twoFactorEnabled,
    })
    .from(users)
    .orderBy(asc(users.name));
  const memberships = await allMemberships();
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    platformAdmin: row.platformRole === "admin",
    twoFactor: row.twoFactorEnabled === true,
    memberships: memberships
      .filter((entry) => entry.userId === row.id)
      .map((entry) => `${entry.venueName} · ${ROLE_LABELS[entry.role as VenueRole]}`),
  }));
}

export const setPlatformAdmin = platformAction({
  permission: "platform.users",
  schema: z.object({ userId: z.string().min(1).max(64), admin: z.enum(["evet", "hayir"]) }),
  handler: async ({ userId, admin }, ctx) => {
    if (isDemoAccount(ctx.session.user.email)) {
      return fail("forbidden", {
        message: "Demo hesabıyla platform değiştirilemez; burada yalnızca görüntülenir.",
      });
    }
    if (userId === ctx.session.user.id) {
      return fail("forbidden", { message: "Kendi platform rolünüzü değiştiremezsiniz." });
    }
    const [target] = await db
      .select({ platformRole: users.platformRole })
      .from(users)
      .where(eq(users.id, userId));
    if (!target) return fail("notFound");
    const next = admin === "evet" ? "admin" : null;
    if (target.platformRole === next) return ok(null);
    await db
      .update(users)
      .set({ platformRole: next, updatedAt: new Date() })
      .where(eq(users.id, userId));
    await revokeSessions(userId);
    await recordPlatformAudit({
      actorId: ctx.session.user.id,
      action: "platform.admin_changed",
      entity: "user",
      entityId: userId,
      changes: { platformRole: { from: target.platformRole, to: next } },
      ipHash: hashIp(ctx.ip),
    });
    return ok(null);
  },
});
