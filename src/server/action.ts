import "server-only";

import { randomUUID } from "node:crypto";

import { z } from "zod";

import { isPlatformAdmin, type PlatformPermission } from "@/config/permissions";
import { fail, type Result } from "@/lib/result";
import { getSession, type Session } from "@/server/auth";
import { logger } from "@/server/logger";
import { consumeRateLimit, type RateLimitRule } from "@/server/rate-limit";
import { clientIp } from "@/server/request";

/**
 * Server action wrappers (05-sunucu-ve-api §3). Order: validate → session and permission →
 * rate limit → handler → catch. Handlers return Result and never throw to the client.
 *
 * - publicAction: venue visitors (e.g. the secret section password, D-37). No honeypot: there is
 *   no visitor form with personal data (K-15); the rate limit is the protection.
 * - platformAction: platform admin only (venues, domains, users; D-19).
 * - venueAction (D-02): panel member of the venue with a permission, run inside withVenue (ADR-0004).
 */

export type BaseContext = { requestId: string; ip: string; now: Date };
export type UserContext = BaseContext & { session: Session };

type Handler<S extends z.ZodType, T, C> = (input: z.output<S>, ctx: C) => Promise<Result<T>>;

type CommonOptions<S extends z.ZodType, T, C> = {
  schema: S;
  rateLimit?: RateLimitRule;
  handler: Handler<S, T, C>;
};

async function execute<S extends z.ZodType, T, C extends BaseContext>(
  raw: unknown,
  options: CommonOptions<S, T, C>,
  buildContext: (base: BaseContext) => Promise<C | Result<never>>,
): Promise<Result<T>> {
  const requestId = randomUUID();
  try {
    const parsed = options.schema.safeParse(raw);
    if (!parsed.success) {
      const { fieldErrors } = z.flattenError(parsed.error);
      return fail("validation", { fieldErrors });
    }

    const base: BaseContext = { requestId, ip: await clientIp(), now: new Date() };
    const ctx = await buildContext(base);
    if ("ok" in ctx) return ctx; // the context builder rejected the call

    if (options.rateLimit) {
      const subject = "session" in ctx ? (ctx as UserContext).session.user.id : base.ip;
      const limit = await consumeRateLimit(options.rateLimit, subject, base.now);
      if (!limit.allowed) {
        const minutes = Math.max(1, Math.ceil(limit.retryAfterSeconds / 60));
        return fail("rateLimited", {
          message: `Çok fazla deneme yapıldı. ${minutes} dakika sonra tekrar deneyin.`,
        });
      }
    }

    return await options.handler(parsed.data, ctx);
  } catch (error) {
    logger.error("action.unexpected", { requestId, error: String(error) });
    return fail("unexpected", {
      errorId: requestId.slice(0, 8),
      message: `Bir sorun oluştu. Lütfen tekrar deneyin. Destek kodu: ${requestId.slice(0, 8)}`,
    });
  }
}

/** Anyone can call it (venue visitors). Always pass a rate limit. */
export function publicAction<S extends z.ZodType, T>(options: CommonOptions<S, T, BaseContext>) {
  return async (raw: z.input<S>): Promise<Result<T>> =>
    execute(raw, options, (base) => Promise.resolve(base));
}

/** Platform admin with an explicit platform permission. Write audit_logs inside the handler. */
export function platformAction<S extends z.ZodType, T>(
  options: CommonOptions<S, T, UserContext> & { permission: PlatformPermission },
) {
  return async (raw: z.input<S>): Promise<Result<T>> =>
    execute(raw, options, async (base) => {
      const session = await getSession();
      if (!session) return fail("unauthorized");
      const platformRole = (session.user as { platformRole?: string | null }).platformRole;
      if (!isPlatformAdmin(platformRole)) {
        logger.warn("action.forbidden", {
          userId: session.user.id,
          permission: options.permission,
        });
        return fail("forbidden");
      }
      return { ...base, session };
    });
}
