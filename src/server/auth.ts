import "server-only";

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { headers } from "next/headers";

import { env } from "@/lib/env";
import { db } from "@/server/db/client";

import { authOptions } from "./auth.config";

/**
 * Better Auth with database sessions (11-guvenlik §4, GV-01). Options live in auth.config.ts
 * so the schema generator can load them; this file adds the secrets and the database.
 */
export const auth = betterAuth({
  ...authOptions,
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, { provider: "pg" }),
});

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export type Session = NonNullable<Awaited<ReturnType<typeof getSession>>>;
