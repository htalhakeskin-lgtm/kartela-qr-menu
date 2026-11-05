import "server-only";

import { APIError } from "better-auth/api";
import { headers } from "next/headers";
import QRCode from "qrcode";
import { z } from "zod";

import { secondStepRequired } from "@/config/permissions";
import { env } from "@/lib/env";
import { fail, ok } from "@/lib/result";
import { userAction, type UserContext } from "@/server/action";
import { auth } from "@/server/auth";
import { panelVenues, recordPlatformAudit } from "@/server/db/tenant";
import { hashIp } from "@/server/request";

import { isDemoAccount } from "./session";

/**
 * "Hesabım" (plan §8, 11-guvenlik §4): the second step (TOTP with one-time backup codes) and the
 * password. Every change goes to the audit log. A shared demo account changes neither — the next
 * visitor would be locked out.
 */
const DEMO_LOCKED = "Demo hesaplarında parola ve iki adımlı doğrulama değiştirilemez.";
const WRONG_PASSWORD = "Parola hatalı.";

const errorCode = (error: APIError) => (error.body as { code?: string } | undefined)?.code ?? "";

async function audit(ctx: UserContext, action: string) {
  await recordPlatformAudit({
    actorId: ctx.session.user.id,
    action,
    entity: "user",
    entityId: ctx.session.user.id,
    changes: null,
    ipHash: hashIp(ctx.ip),
  });
}

export type TwoFactorSetup = { qr: string; secret: string; backupCodes: string[] };

/** Step 1: the password confirms it is the owner; Better Auth returns the secret and backup codes. */
export const startTwoFactor = userAction({
  schema: z.object({ parola: z.string().min(1, "Parolanızı girin.").max(128) }),
  handler: async ({ parola }, ctx) => {
    if (isDemoAccount(ctx.session.user.email)) return fail("forbidden", { message: DEMO_LOCKED });
    try {
      const enabled = await auth.api.enableTwoFactor({
        body: { password: parola, issuer: "Kartela", method: "totp" },
        headers: await headers(),
      });
      if (enabled.method !== "totp") return fail("unexpected");
      const { totpURI, backupCodes } = enabled;
      const secret = new URL(totpURI).searchParams.get("secret") ?? "";
      const svg = await QRCode.toString(totpURI, {
        type: "svg",
        margin: 1,
        errorCorrectionLevel: "M",
      });
      return ok<TwoFactorSetup>({
        qr: `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`,
        secret: secret.replace(/(.{4})/g, "$1 ").trim(),
        backupCodes,
      });
    } catch (error) {
      if (!(error instanceof APIError)) throw error;
      if (errorCode(error) === "TOTP_ALREADY_ENABLED") {
        return fail("conflict", { message: "İki adımlı doğrulama bu hesapta zaten açık." });
      }
      return fail("validation", { fieldErrors: { parola: [WRONG_PASSWORD] } });
    }
  },
});

/** Step 2: the first code from the app proves the setup; only then is the second step on. */
export const confirmTwoFactor = userAction({
  schema: z.object({
    kod: z
      .string()
      .transform((value) => value.replace(/\s/g, ""))
      .pipe(z.string().regex(/^\d{6}$/, "Uygulamadaki 6 haneli kodu girin.")),
  }),
  handler: async ({ kod }, ctx) => {
    if (isDemoAccount(ctx.session.user.email)) return fail("forbidden", { message: DEMO_LOCKED });
    try {
      await auth.api.verifyTOTP({ body: { code: kod }, headers: await headers() });
    } catch (error) {
      if (!(error instanceof APIError)) throw error;
      return fail("validation", {
        fieldErrors: { kod: ["Kod doğrulanamadı. Uygulamadaki güncel kodu girin."] },
      });
    }
    await audit(ctx, "auth.two_factor_enabled");
    return ok(null);
  },
});

export const turnOffTwoFactor = userAction({
  schema: z.object({ parola: z.string().min(1, "Parolanızı girin.").max(128) }),
  handler: async ({ parola }, ctx) => {
    if (isDemoAccount(ctx.session.user.email)) return fail("forbidden", { message: DEMO_LOCKED });
    const user = ctx.session.user as typeof ctx.session.user & { platformRole?: string | null };
    const platformAdmin = user.platformRole === "admin";
    const ownsVenue = (await panelVenues(user.id, false)).some((venue) => venue.role === "owner");
    if (secondStepRequired({ platformAdmin, ownsVenue }, !env.PLATFORM_DEMO)) {
      return fail("forbidden", {
        message: "Bu hesapta iki adımlı doğrulama zorunlu; kapatılamaz (BR-YTK-002).",
      });
    }
    try {
      await auth.api.disableTwoFactor({ body: { password: parola }, headers: await headers() });
    } catch (error) {
      if (!(error instanceof APIError)) throw error;
      return fail("validation", { fieldErrors: { parola: [WRONG_PASSWORD] } });
    }
    await audit(ctx, "auth.two_factor_disabled");
    return ok(null);
  },
});

export const changePassword = userAction({
  schema: z
    .object({
      mevcut: z.string().min(1, "Mevcut parolanızı girin.").max(128),
      yeni: z
        .string()
        .min(15, "Yeni parola en az 15 karakter olmalı.")
        .max(128, "Yeni parola en çok 128 karakter olabilir."),
      tekrar: z.string(),
    })
    .refine((value) => value.yeni === value.tekrar, {
      path: ["tekrar"],
      error: "İki parola aynı değil.",
    }),
  handler: async ({ mevcut, yeni }, ctx) => {
    if (isDemoAccount(ctx.session.user.email)) return fail("forbidden", { message: DEMO_LOCKED });
    try {
      await auth.api.changePassword({
        body: { currentPassword: mevcut, newPassword: yeni, revokeOtherSessions: true },
        headers: await headers(),
      });
    } catch (error) {
      if (!(error instanceof APIError)) throw error;
      if (errorCode(error) === "PASSWORD_COMPROMISED") {
        return fail("validation", {
          fieldErrors: {
            yeni: ["Bu parola sızdırılmış parola listelerinde geçiyor; başka bir parola seçin."],
          },
        });
      }
      return fail("validation", { fieldErrors: { mevcut: [WRONG_PASSWORD] } });
    }
    await audit(ctx, "auth.password_changed");
    return ok(null);
  },
});
