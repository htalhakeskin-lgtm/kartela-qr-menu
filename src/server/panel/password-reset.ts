import "server-only";

import { APIError } from "better-auth/api";
import { headers } from "next/headers";
import { z } from "zod";

import { rateLimits } from "@/config/limits";
import { fail, ok } from "@/lib/result";
import { publicAction } from "@/server/action";
import { auth } from "@/server/auth";
import { logger } from "@/server/logger";
import { consumeRateLimit } from "@/server/rate-limit";
import { hashKey } from "@/server/request";

/**
 * Password reset (11-guvenlik §4): the answer is the same whether or not the address has an
 * account; the link is single-use and lives 30 minutes (P-10); after the reset every session of
 * the account ends (auth.config: revokeSessionsOnPasswordReset). The e-mail is sent by the
 * sendResetPassword hook in src/server/auth.ts (demo: the demo outbox; demo accounts get none).
 */
export const RESET_PATH = "/panel/giris/sifre/yeni";

const email = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, "E-posta adresi çok uzun.")
  .pipe(z.email({ error: "Geçerli bir e-posta adresi girin." }));

export const requestPasswordReset = publicAction({
  schema: z.object({ email }),
  rateLimit: rateLimits.passwordResetIp,
  handler: async ({ email: address }, ctx) => {
    const perAccount = await consumeRateLimit(
      rateLimits.passwordResetAccount,
      hashKey(address),
      ctx.now,
    );
    if (perAccount.allowed) {
      try {
        await auth.api.requestPasswordReset({
          body: { email: address, redirectTo: RESET_PATH },
          headers: await headers(),
        });
      } catch (error) {
        if (!(error instanceof APIError)) throw error;
        logger.warn("password_reset.request_failed", { requestId: ctx.requestId });
      }
    }
    return ok(null); // the same answer for every address (no account enumeration)
  },
});

export const resetPassword = publicAction({
  schema: z
    .object({
      belirtec: z.string().min(10).max(200),
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
  rateLimit: rateLimits.passwordResetIp,
  handler: async ({ belirtec, yeni }) => {
    try {
      await auth.api.resetPassword({
        body: { token: belirtec, newPassword: yeni },
        headers: await headers(),
      });
    } catch (error) {
      if (!(error instanceof APIError)) throw error;
      const code = (error.body as { code?: string } | undefined)?.code ?? "";
      if (code === "PASSWORD_COMPROMISED") {
        return fail("validation", {
          fieldErrors: {
            yeni: ["Bu parola sızdırılmış parola listelerinde geçiyor; başka bir parola seçin."],
          },
        });
      }
      return fail("notFound", {
        message:
          "Bağlantının süresi dolmuş ya da daha önce kullanılmış. Yeni bir bağlantı isteyin.",
      });
    }
    return ok(null);
  },
});
