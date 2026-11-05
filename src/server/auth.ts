import "server-only";

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { headers } from "next/headers";

import { env } from "@/lib/env";
import { publicEnv } from "@/lib/public-env";
import { db } from "@/server/db/client";

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
const secure = env.BETTER_AUTH_URL.startsWith("https://");
const allowedHosts = [
  ...new Set(
    [
      new URL(env.BETTER_AUTH_URL).host,
      new URL(publicEnv.NEXT_PUBLIC_PLATFORM_URL).host,
      env.VERCEL_URL,
      env.VERCEL_BRANCH_URL,
    ].filter((host): host is string => Boolean(host)),
  ),
];

export const auth = betterAuth({
  ...authOptions,
  baseURL: { allowedHosts, fallback: env.BETTER_AUTH_URL, protocol: secure ? "https" : "http" },
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, { provider: "pg" }),
  advanced: { ...authOptions.advanced, useSecureCookies: secure },
});

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export type Session = NonNullable<Awaited<ReturnType<typeof getSession>>>;
