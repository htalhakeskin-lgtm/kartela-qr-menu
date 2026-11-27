import "server-only";

import { eq } from "drizzle-orm";
import { z } from "zod";

import { fail, ok } from "@/lib/result";
import { platformAction, type UserContext } from "@/server/action";
import { db } from "@/server/db/client";
import { venues } from "@/server/db/schema";
import {
  deleteDomain,
  findDomain,
  hostTaken,
  insertDomain,
  type PlatformVenueRow,
  platformVenueRows,
  recordAudit,
  setDomainStatus,
  withVenue,
} from "@/server/db/tenant";
import { isDemoAccount } from "@/server/demo-accounts";
import { refreshAfterWrite } from "@/server/menu/cache";
import { hashIp } from "@/server/request";

import { addProjectDomain, checkProjectDomain, removeProjectDomain, triggerDeploy } from "./vercel";

/**
 * Platform admin's venues (SCR-130, SCR-131; D-19, K-50): the list, a venue's mode and domains,
 * and the redeploy that carries them into the host map. Venues are created with `pnpm mekan:yeni`
 * (D-21): a new venue needs its content files and, for a custom theme, code. A shared demo
 * account sees everything and changes nothing.
 */
const DEMO_PLATFORM = "Demo hesabıyla platform değiştirilemez; burada yalnızca görüntülenir.";
const HOST = /^(?=.{1,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

export async function platformVenues(): Promise<PlatformVenueRow[]> {
  return platformVenueRows();
}

function refuseDemo(ctx: UserContext) {
  return isDemoAccount(ctx.session.user.email)
    ? fail("forbidden", { message: DEMO_PLATFORM })
    : null;
}

async function venueBySlug(slug: string) {
  const [venue] = await db
    .select({ id: venues.id, slug: venues.slug, mode: venues.mode })
    .from(venues)
    .where(eq(venues.slug, slug))
    .limit(1);
  return venue ?? null;
}

const slug = z.string().regex(/^[a-z][a-z0-9-]{1,30}$/);

async function audit(
  ctx: UserContext,
  venueId: string,
  action: string,
  changes: Record<string, { from: unknown; to: unknown }>,
) {
  await withVenue(venueId, (tx) =>
    recordAudit(tx, {
      venueId,
      actorId: ctx.session.user.id,
      action,
      entity: "venue",
      entityId: venueId,
      changes,
      ipHash: hashIp(ctx.ip),
    }),
  );
}

/**
 * Demo ↔ live. The visitor pages' demo note follows at once (the venue's cached view is refreshed);
 * robots.txt, noindex and the sitemap follow with the next build (K-50).
 */
export const setVenueMode = platformAction({
  permission: "platform.venues",
  schema: z.object({ mekan: slug, mode: z.enum(["demo", "live"]) }),
  handler: async ({ mekan, mode }, ctx) => {
    const demo = refuseDemo(ctx);
    if (demo) return demo;
    const venue = await venueBySlug(mekan);
    if (!venue) return fail("notFound");
    if (venue.mode === mode) return ok(null);
    await db.update(venues).set({ mode, updatedAt: new Date() }).where(eq(venues.id, venue.id));
    await audit(ctx, venue.id, "platform.mode_changed", { mode: { from: venue.mode, to: mode } });
    refreshAfterWrite(venue.slug, ["menu"]);
    return ok(null);
  },
});

export const addVenueDomain = platformAction({
  permission: "platform.venues",
  schema: z.object({
    mekan: slug,
    host: z
      .string()
      .trim()
      .toLowerCase()
      .regex(HOST, "Küçük harfli, noktalı bir alan adı girin (ör. menu.ornek.com.tr)."),
  }),
  handler: async ({ mekan, host }, ctx) => {
    const demo = refuseDemo(ctx);
    if (demo) return demo;
    const venue = await venueBySlug(mekan);
    if (!venue) return fail("notFound");
    if (await hostTaken(host)) {
      return fail("conflict", { fieldErrors: { host: ["Bu alan adı zaten bir mekâna bağlı."] } });
    }
    const domainId = await insertDomain(venue.id, host);
    const result = await addProjectDomain(host);
    if (result.ok && result.verified) await setDomainStatus(venue.id, domainId, "active");
    else if (!result.ok && result.reason.startsWith("Vercel isteği")) {
      await setDomainStatus(venue.id, domainId, "error");
    }
    await audit(ctx, venue.id, "platform.domain_added", { host: { from: null, to: host } });
    return ok({ api: result.ok, verified: result.ok && result.verified });
  },
});

/**
 * Marks a domain active: with the Vercel API when its DNS is verified there; without the API the
 * admin confirms that the manual steps are done.
 */
export const verifyVenueDomain = platformAction({
  permission: "platform.venues",
  schema: z.object({ mekan: slug, domainId: z.uuid() }),
  handler: async ({ mekan, domainId }, ctx) => {
    const demo = refuseDemo(ctx);
    if (demo) return demo;
    const venue = await venueBySlug(mekan);
    const domain = venue ? await findDomain(venue.id, domainId) : null;
    if (!venue || !domain) return fail("notFound");
    const result = await checkProjectDomain(domain.host);
    if (result.ok && !result.verified) {
      return fail("conflict", {
        message: "Vercel alan adını henüz doğrulamadı. DNS kaydını kontrol edip tekrar deneyin.",
      });
    }
    await setDomainStatus(venue.id, domain.id, "active");
    await audit(ctx, venue.id, "platform.domain_verified", {
      host: { from: null, to: domain.host },
    });
    return ok(null);
  },
});

export const removeVenueDomain = platformAction({
  permission: "platform.venues",
  schema: z.object({ mekan: slug, domainId: z.uuid() }),
  handler: async ({ mekan, domainId }, ctx) => {
    const demo = refuseDemo(ctx);
    if (demo) return demo;
    const venue = await venueBySlug(mekan);
    const domain = venue ? await findDomain(venue.id, domainId) : null;
    if (!venue || !domain) return fail("notFound");
    if (domain.isPrimary) {
      return fail("forbidden", {
        message: "Birincil alan adı panelden kaldırılamaz; mekân kaydında değişir (mekan.ts).",
      });
    }
    await deleteDomain(venue.id, domain.id);
    await removeProjectDomain(domain.host);
    await audit(ctx, venue.id, "platform.domain_removed", {
      host: { from: domain.host, to: null },
    });
    return ok(null);
  },
});

export const redeployPlatform = platformAction({
  permission: "platform.venues",
  schema: z.object({}),
  handler: async (_, ctx) => {
    const demo = refuseDemo(ctx);
    if (demo) return demo;
    if (!(await triggerDeploy())) {
      return fail("unexpected", {
        message:
          "Deploy Hook tanımlı değil ya da yanıt vermedi. Vercel'de son üretim yayınını yeniden başlatın.",
      });
    }
    return ok(null);
  },
});
