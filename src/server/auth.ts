import "server-only";

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { headers } from "next/headers";

import { PASSWORD_RESET_MINUTES } from "@/config/limits";
import { env } from "@/lib/env";
import { send } from "@/server/channels";
import { db } from "@/server/db/client";
import { isDemoAccount } from "@/server/demo-accounts";
import { platformHosts, platformOrigin, secureCookies } from "@/server/platform-hosts";

import { authOptions } from "./auth.config";

/**
 * Better Auth with database sessions (11-guvenlik §4, GV-01). Options live in auth.config.ts
 * so the schema generator can load them; this file adds the secrets and the database.
 *
 * The panel calls Better Auth only from its own server actions (`auth.api.*` with the request
 * headers): there is no /api/auth handler, so no auth endpoint answers on a venue host either.
 * Next.js checks a server action's origin; Better Auth's own origin check applies to HTTP calls.
 *
 * The base URL follows the request host among the platform's own hosts (D-18): production, and on
 * Vercel the deployment and branch URLs, so a preview deployment keeps its own panel session.
 * Secure cookies follow BETTER_AUTH_URL: https on Vercel, http on localhost and in CI, where
 * WebKit would otherwise drop a Secure cookie.
 */
export const auth = betterAuth({
  ...authOptions,
  emailAndPassword: {
    ...authOptions.emailAndPassword,
    resetPasswordTokenExpiresIn: PASSWORD_RESET_MINUTES * 60, // P-10, 11-guvenlik §4
    // The link opens the panel's own page (there is no /api/auth handler), on the host the
    // request came from when it is a platform host. A shared demo account gets no link.
    sendResetPassword: async ({ user, token }) => {
      if (isDemoAccount(user.email)) return;
      const resetUrl = `${await platformOrigin()}/panel/giris/sifre/yeni?belirtec=${encodeURIComponent(token)}`;
      await send({
        channel: "email",
        to: user.email,
        template: "passwordReset",
        data: { resetUrl },
        relatedId: user.id,
      });
    },
  },
  baseURL: {
    allowedHosts: [...platformHosts],
    fallback: env.BETTER_AUTH_URL,
    protocol: secureCookies ? "https" : "http",
  },
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, { provider: "pg" }),
  advanced: { ...authOptions.advanced, useSecureCookies: secureCookies },
});

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export type Session = NonNullable<Awaited<ReturnType<typeof getSession>>>;
