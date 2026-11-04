import "server-only";

import { lt, sql } from "drizzle-orm";

import { db } from "@/server/db/client";
import { actionRateLimits } from "@/server/db/schema";

export type RateLimitRule = { key: string; limit: number; windowSeconds: number };
export type RateLimitResult = { allowed: boolean; retryAfterSeconds: number };

/**
 * Fixed-window counter in PostgreSQL: one upsert per call, no extra service
 * (01-teknoloji-yigini). Move to Redis only if traffic requires it.
 */
export async function consumeRateLimit(
  rule: RateLimitRule,
  subject: string,
  now: Date = new Date(),
): Promise<RateLimitResult> {
  const windowMs = rule.windowSeconds * 1000;
  const windowStart = Math.floor(now.getTime() / windowMs) * windowMs;
  const expiresAt = new Date(windowStart + windowMs);
  const key = `${rule.key}:${subject}:${windowStart}`;

  const [row] = await db
    .insert(actionRateLimits)
    .values({ key, count: 1, expiresAt })
    .onConflictDoUpdate({
      target: actionRateLimits.key,
      set: { count: sql`${actionRateLimits.count} + 1` },
    })
    .returning({ count: actionRateLimits.count });

  const allowed = (row?.count ?? 1) <= rule.limit;
  const retryAfterSeconds = allowed ? 0 : Math.ceil((expiresAt.getTime() - now.getTime()) / 1000);
  return { allowed, retryAfterSeconds };
}

/** Called by the daily cleanup cron. */
export async function purgeExpiredRateLimits(now: Date = new Date()): Promise<void> {
  await db.delete(actionRateLimits).where(lt(actionRateLimits.expiresAt, now));
}
