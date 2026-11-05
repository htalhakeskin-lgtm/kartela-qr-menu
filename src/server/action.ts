import "server-only";

import { randomUUID } from "node:crypto";

import { z } from "zod";

import {
  hasVenuePermission,
  isPlatformAdmin,
  type PlatformPermission,
  secondStepRequired,
  type VenuePermission,
  type VenueRole,
} from "@/config/permissions";
import { env } from "@/lib/env";
import { fail, type Result } from "@/lib/result";
import type { CacheKind } from "@/platform/tenant/cache-tags";
import { getSession, type Session } from "@/server/auth";
import { type TenantTx, venueAccess, withVenue } from "@/server/db/tenant";
import { logger } from "@/server/logger";
import { refreshAfterWrite } from "@/server/menu/cache";
import { consumeRateLimit, type RateLimitRule } from "@/server/rate-limit";
import { clientIp } from "@/server/request";

/**
 * Server action wrappers (05-sunucu-ve-api §3). Order: validate → session and permission →
 * rate limit → handler → catch. Handlers return Result and never throw to the client.
 *
 * - publicAction: venue visitors (e.g. the secret section password, D-37) and the panel sign-in.
 *   No honeypot: there is no visitor form with personal data (K-15); the rate limit protects.
 * - userAction: any signed-in panel user acting on their own account (password, second step).
 * - platformAction: platform admin only (venues, domains, users; D-19).
 * - venueAction: panel member of the venue (or platform admin) with a venue permission; the handler
 *   runs inside withVenue (ADR-0004) and a failed Result rolls its writes back.
 */

export type BaseContext = { requestId: string; ip: string; now: Date };
export type UserContext = BaseContext & { session: Session };
export type VenueContext = UserContext & {
  venueId: string;
  /** The venue's slug: its cache tags carry it (BR-KRC-005). */
  slug: string;
  /** "platform": a platform admin acting on the venue without a membership. */
  role: VenueRole | "platform";
  /** The venue-scoped transaction: tenant queries see only this venue's rows. */
  tx: TenantTx;
};

type Handler<S extends z.ZodType, T, C> = (input: z.output<S>, ctx: C) => Promise<Result<T>>;

type CommonOptions<S extends z.ZodType, T, C> = {
  schema: S;
  rateLimit?: RateLimitRule;
  handler: Handler<S, T, C>;
};

async function execute<S extends z.ZodType, T, C extends BaseContext>(
  raw: unknown,
  options: CommonOptions<S, T, C>,
  buildContext: (base: BaseContext, input: z.output<S>) => Promise<C | Result<never>>,
): Promise<Result<T>> {
  const requestId = randomUUID();
  try {
    const parsed = options.schema.safeParse(raw);
    if (!parsed.success) {
      const { fieldErrors } = z.flattenError(parsed.error);
      return fail("validation", { fieldErrors });
    }

    const base: BaseContext = { requestId, ip: await clientIp(), now: new Date() };
    const ctx = await buildContext(base, parsed.data);
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

/** Anyone can call it (venue visitors, the panel sign-in). Always pass a rate limit. */
export function publicAction<S extends z.ZodType, T>(options: CommonOptions<S, T, BaseContext>) {
  return async (raw: z.input<S>): Promise<Result<T>> =>
    execute(raw, options, (base) => Promise.resolve(base));
}

type SessionFlags = { platformRole?: string | null; twoFactorEnabled?: boolean | null };
const flags = (session: Session) => session.user as Session["user"] & SessionFlags;

/**
 * BR-YTK-002 on the server: on the live platform a platform admin, and an owner acting on their
 * venue, cannot work before their second step is set up (the panel pages redirect them first).
 */
function missingSecondStep(session: Session, role: VenueRole | "platform" | null): boolean {
  const user = flags(session);
  if (user.twoFactorEnabled === true) return false;
  return secondStepRequired(
    {
      platformAdmin: role === "platform" || isPlatformAdmin(user.platformRole),
      ownsVenue: role === "owner",
    },
    !env.PLATFORM_DEMO,
  );
}

const secondStepFailure = () =>
  fail("forbidden", { message: "Devam etmek için önce iki adımlı doğrulamayı açın (Hesabım)." });

/** A signed-in panel user acting on their own account; no venue, no permission. */
export function userAction<S extends z.ZodType, T>(options: CommonOptions<S, T, UserContext>) {
  return async (raw: z.input<S>): Promise<Result<T>> =>
    execute(raw, options, async (base) => {
      const session = await getSession();
      if (!session) return fail("unauthorized");
      return { ...base, session };
    });
}

/** Platform admin with an explicit platform permission. Write audit_logs inside the handler. */
export function platformAction<S extends z.ZodType, T>(
  options: CommonOptions<S, T, UserContext> & { permission: PlatformPermission },
) {
  return async (raw: z.input<S>): Promise<Result<T>> =>
    execute(raw, options, async (base) => {
      const session = await getSession();
      if (!session) return fail("unauthorized");
      if (!isPlatformAdmin(flags(session).platformRole)) {
        logger.warn("action.forbidden", {
          userId: session.user.id,
          permission: options.permission,
        });
        return fail("forbidden");
      }
      if (missingSecondStep(session, "platform")) return secondStepFailure();
      return { ...base, session };
    });
}

/** Thrown inside the venue transaction to roll back a handler that returned a failure. */
class RollbackWith extends Error {
  constructor(readonly result: Result<never>) {
    super("rollback");
  }
}

/**
 * A panel action on one venue (ADR-0004, BR-KRC-003). The input carries venueId (validate it with
 * z.uuid()). Order: validate → session → venue access and permission → rate limit → handler in
 * withVenue. A non-member gets `forbidden` whether or not the venue exists; another venue's record
 * is invisible under row level security, so the handler answers `notFound` without leaking it.
 * Write audit_logs inside the handler with recordAudit(ctx.tx, …).
 *
 * `refresh` names the venue's cached data the action changes ("menu", "stories", …): after the
 * transaction commits, only this venue's tags are updated (REQ-016, BR-KRC-005); a failed or
 * rolled back action refreshes nothing.
 */
export function venueAction<S extends z.ZodType<{ venueId: string }>, T>(
  options: CommonOptions<S, T, VenueContext> & {
    permission: VenuePermission;
    refresh?: readonly CacheKind[];
  },
) {
  const handler: Handler<S, T, Omit<VenueContext, "tx">> = async (input, ctx) => {
    try {
      const result = await withVenue(ctx.venueId, async (tx) => {
        const outcome = await options.handler(input, { ...ctx, tx });
        if (!outcome.ok) throw new RollbackWith(outcome);
        return outcome;
      });
      if (options.refresh) refreshAfterWrite(ctx.slug, options.refresh);
      return result;
    } catch (error) {
      if (error instanceof RollbackWith) return error.result;
      throw error;
    }
  };

  return async (raw: z.input<S>): Promise<Result<T>> =>
    execute(raw, { ...options, handler }, async (base, input) => {
      const session = await getSession();
      if (!session) return fail("unauthorized");
      const access = await venueAccess(input.venueId, session.user.id);
      if (isPlatformAdmin(flags(session).platformRole)) {
        if (!access.exists || !access.slug) return fail("notFound");
        if (missingSecondStep(session, "platform")) return secondStepFailure();
        return {
          ...base,
          session,
          venueId: input.venueId,
          slug: access.slug,
          role: "platform" as const,
        };
      }
      if (!access.slug || !access.role || !hasVenuePermission(access.role, options.permission)) {
        logger.warn("action.forbidden", {
          userId: session.user.id,
          venueId: input.venueId,
          permission: options.permission,
        });
        return fail("forbidden");
      }
      if (missingSecondStep(session, access.role)) return secondStepFailure();
      return { ...base, session, venueId: input.venueId, slug: access.slug, role: access.role };
    });
}
