import "server-only";

import { APIError } from "better-auth/api";
import { eq } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { z } from "zod";

import { DEMO_PLATFORM_ACCOUNT, DEMO_VENUE_ACCOUNTS } from "@/config/demo-accounts";
import { rateLimits } from "@/config/limits";
import { env } from "@/lib/env";
import { fail, ok } from "@/lib/result";
import { PANEL_HOME, safeReturnPath } from "@/lib/safe-path";
import { type BaseContext, publicAction, userAction } from "@/server/action";
import { auth } from "@/server/auth";
import { db } from "@/server/db/client";
import { users } from "@/server/db/schema";
import { recordPlatformAudit } from "@/server/db/tenant";
import { consumeRateLimit } from "@/server/rate-limit";
import { hashIp, hashKey } from "@/server/request";

/**
 * Panel sign-in (plan §8, REQ-021, 11-guvenlik §4): e-mail + password, then the second step when
 * the account has one, through Better Auth's server API (its cookies are written by the
 * nextCookies plugin). Every answer to a wrong e-mail or password is the same sentence, the
 * attempt is limited per IP and per account (P-09) and written to the audit log with a hashed IP.
 * The actions return where to go; the "use server" files redirect.
 */
export const SECOND_STEP_PATH = "/panel/giris/dogrula";
const WRONG_CREDENTIALS = "E-posta ya da parola hatalı.";

type Next = { to: string };

const minutes = (seconds: number) => Math.max(1, Math.ceil(seconds / 60));

async function audit(
  ctx: BaseContext,
  action: string,
  userId: string | null,
  actor: string | null,
  changes?: Record<string, { from: unknown; to: unknown }>,
) {
  await recordPlatformAudit({
    actorId: actor,
    action,
    entity: "user",
    entityId: userId,
    changes: changes ?? null,
    ipHash: hashIp(ctx.ip),
  });
}

async function userIdByEmail(email: string): Promise<string | null> {
  const [row] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return row?.id ?? null;
}

function secondStepPath(donus: string | undefined): string {
  const back = safeReturnPath(donus);
  return back === PANEL_HOME
    ? SECOND_STEP_PATH
    : `${SECOND_STEP_PATH}?donus=${encodeURIComponent(back)}`;
}

const email = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, "E-posta adresi çok uzun.")
  .pipe(z.email({ error: "Geçerli bir e-posta adresi girin." }));

const returnPath = z.string().max(512).optional();

export const signInWithPassword = publicAction({
  schema: z.object({
    email,
    password: z.string().min(1, "Parolanızı girin.").max(128, "Parola en çok 128 karakter."),
    donus: returnPath,
  }),
  rateLimit: rateLimits.signInIp,
  handler: async ({ email: address, password, donus }, ctx) => {
    const perAccount = await consumeRateLimit(rateLimits.signInAccount, hashKey(address), ctx.now);
    if (!perAccount.allowed) {
      return fail("rateLimited", {
        message: `Bu hesap için çok fazla deneme yapıldı. ${String(minutes(perAccount.retryAfterSeconds))} dakika sonra tekrar deneyin.`,
      });
    }
    try {
      const result = await auth.api.signInEmail({
        body: { email: address, password, rememberMe: true },
        headers: await headers(),
      });
      if ("twoFactorRedirect" in result) return ok<Next>({ to: secondStepPath(donus) });
      await audit(ctx, "auth.sign_in", result.user.id, result.user.id);
      return ok<Next>({ to: safeReturnPath(donus) });
    } catch (error) {
      if (!(error instanceof APIError)) throw error;
      await audit(ctx, "auth.sign_in_failed", await userIdByEmail(address), null);
      return fail("unauthorized", { message: WRONG_CREDENTIALS });
    }
  },
});

/** The demo accounts the sign-in page offers (labels only; the password stays on the server). */
export type DemoChoice = { key: string; label: string };

function demoAccounts(): { key: string; label: string; email: string; home: string }[] {
  if (!env.PLATFORM_DEMO || !env.DEMO_ADMIN_PASSWORD) return [];
  const platform = env.DEMO_ADMIN_EMAIL
    ? [{ ...DEMO_PLATFORM_ACCOUNT, email: env.DEMO_ADMIN_EMAIL, home: PANEL_HOME }]
    : [];
  return [
    ...platform,
    ...DEMO_VENUE_ACCOUNTS.map((account) => ({
      key: account.key,
      label: account.label,
      email: account.email,
      home: `${PANEL_HOME}/${account.venue}`,
    })),
  ];
}

export function demoChoices(): DemoChoice[] {
  return demoAccounts().map(({ key, label }) => ({ key, label }));
}

export const signInAsDemo = publicAction({
  schema: z.object({ hesap: z.string().max(40) }),
  rateLimit: rateLimits.signInIp,
  handler: async ({ hesap }, ctx) => {
    const account = demoAccounts().find((choice) => choice.key === hesap);
    if (!account || !env.DEMO_ADMIN_PASSWORD) return fail("forbidden");
    try {
      const result = await auth.api.signInEmail({
        body: { email: account.email, password: env.DEMO_ADMIN_PASSWORD, rememberMe: true },
        headers: await headers(),
      });
      // Demo accounts cannot set up a second step (they are shared).
      if ("twoFactorRedirect" in result) return fail("forbidden");
      await audit(ctx, "auth.sign_in", result.user.id, result.user.id, {
        method: { from: null, to: "demo" },
      });
      return ok<Next>({ to: account.home });
    } catch (error) {
      if (!(error instanceof APIError)) throw error;
      return fail("notFound", {
        message: "Demo hesabı bulunamadı. Veritabanı tohumu yüklenmemiş olabilir.",
      });
    }
  },
});

/** Is a second-step challenge waiting (Better Auth's signed two_factor cookie)? */
export async function hasPendingSecondStep(): Promise<boolean> {
  const jar = await cookies();
  return jar.getAll().some(({ name }) => /^(__Secure-)?kartela\.two_factor$/.test(name));
}

const EXPIRED =
  "Doğrulamanın süresi doldu ya da çok fazla hatalı kod girildi. Yeniden giriş yapın.";

export const verifySecondStep = publicAction({
  schema: z.object({
    kod: z
      .string()
      .transform((value) => value.replace(/[\s-]/g, ""))
      .pipe(z.string().min(6, "Kodu girin.").max(32, "Kod çok uzun.")),
    yontem: z.enum(["totp", "yedek"]).default("totp"),
    hatirla: z.literal("on").optional(),
    donus: returnPath,
  }),
  rateLimit: rateLimits.twoFactor,
  handler: async ({ kod, yontem, hatirla, donus }, ctx) => {
    const body = { code: kod, trustDevice: hatirla === "on" };
    try {
      const requestHeaders = await headers();
      const result =
        yontem === "totp"
          ? await auth.api.verifyTOTP({ body, headers: requestHeaders })
          : await auth.api.verifyBackupCode({ body, headers: requestHeaders });
      await audit(ctx, "auth.sign_in", result.user.id, result.user.id, {
        method: { from: null, to: yontem === "totp" ? "totp" : "backup_code" },
      });
      return ok<Next>({ to: safeReturnPath(donus) });
    } catch (error) {
      if (!(error instanceof APIError)) throw error;
      const code = (error.body as { code?: string } | undefined)?.code ?? "";
      if (/TWO_FACTOR_COOKIE|TOO_MANY_ATTEMPTS|LOCKED/.test(code)) {
        return fail("unauthorized", { message: EXPIRED });
      }
      return fail("validation", {
        fieldErrors: {
          kod: [
            yontem === "totp"
              ? "Kod doğrulanamadı. Uygulamadaki güncel kodu girin."
              : "Yedek kod doğrulanamadı ya da daha önce kullanıldı.",
          ],
        },
      });
    }
  },
});

export const signOut = userAction({
  schema: z.object({}),
  handler: async () => {
    await auth.api.signOut({ headers: await headers() });
    return ok<Next>({ to: "/panel/giris" });
  },
});
