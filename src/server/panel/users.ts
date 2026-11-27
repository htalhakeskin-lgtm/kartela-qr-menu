import "server-only";

import { createHash } from "node:crypto";

import { hashPassword } from "better-auth/crypto";
import { eq, inArray } from "drizzle-orm";

import { db } from "@/server/db/client";
import { newId } from "@/server/db/columns";
import { accounts, sessions, users } from "@/server/db/schema";
import { logger } from "@/server/logger";

/**
 * Panel users outside Better Auth's own endpoints (D-18b): names for the team and the audit log,
 * revoking sessions after a role change (11-guvenlik §4), and the account an accepted invitation
 * creates (there is no open sign-up).
 */
export type UserCard = { name: string; email: string };

export async function userDirectory(ids: readonly string[]): Promise<Map<string, UserCard>> {
  const unique = [...new Set(ids)];
  if (unique.length === 0) return new Map();
  const rows = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(inArray(users.id, unique));
  return new Map(rows.map((row) => [row.id, { name: row.name, email: row.email }]));
}

export async function userIdByEmail(email: string): Promise<string | null> {
  const [row] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);
  return row?.id ?? null;
}

/** Every session of the user ends (role change, removal from a venue). */
export async function revokeSessions(userId: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.userId, userId));
}

/** A new password account for an accepted invitation; the e-mail is proven by the link. */
export async function createPasswordUser(values: {
  email: string;
  name: string;
  password: string;
}): Promise<string> {
  const id = newId();
  const hash = await hashPassword(values.password);
  await db.transaction(async (tx) => {
    await tx.insert(users).values({
      id,
      name: values.name,
      email: values.email.toLowerCase(),
      emailVerified: true,
    });
    await tx.insert(accounts).values({
      id: newId(),
      userId: id,
      accountId: id,
      providerId: "credential",
      password: hash,
    });
  });
  return id;
}

/**
 * Known-breached password check with k-anonymity (11-guvenlik §4, the same service as Better
 * Auth's haveIBeenPwned plugin, which only guards its own endpoints): only the first five hex
 * characters of the SHA-1 leave the server. If the service cannot be reached the password is
 * accepted and the miss is logged — the 15-character minimum still holds.
 */
export async function passwordIsBreached(password: string): Promise<boolean> {
  const digest = createHash("sha1").update(password).digest("hex").toUpperCase();
  const prefix = digest.slice(0, 5);
  const suffix = digest.slice(5);
  try {
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { "Add-Padding": "true", "User-Agent": "Kartela panel" },
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) throw new Error(`status ${String(response.status)}`);
    const body = await response.text();
    return body.split("\n").some((line) => {
      const [hashSuffix, times] = line.trim().split(":");
      return hashSuffix === suffix && Number(times) > 0;
    });
  } catch (error) {
    logger.warn("pwned.unreachable", { error: String(error) });
    return false;
  }
}
