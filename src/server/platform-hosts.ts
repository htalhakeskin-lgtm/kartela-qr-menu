import "server-only";

import { headers } from "next/headers";

import { env } from "@/lib/env";
import { publicEnv } from "@/lib/public-env";

/**
 * The platform's own hosts (K-48): production and, on Vercel, this deployment's and branch's
 * URLs. Better Auth resolves its base URL among them, and links in e-mails (invitation, password
 * reset) are built only on one of them — never on a forged Host header (password-reset
 * poisoning), which falls back to BETTER_AUTH_URL.
 */
export const secureCookies = env.BETTER_AUTH_URL.startsWith("https://");

export const platformHosts: readonly string[] = [
  ...new Set(
    [
      new URL(env.BETTER_AUTH_URL).host,
      new URL(publicEnv.NEXT_PUBLIC_PLATFORM_URL).host,
      env.VERCEL_URL,
      env.VERCEL_BRANCH_URL,
    ].filter((host): host is string => Boolean(host)),
  ),
];

/** The origin of this request when it is a platform host, else BETTER_AUTH_URL's. */
export async function platformOrigin(): Promise<string> {
  const host = (await headers()).get("host")?.toLowerCase();
  if (host && platformHosts.includes(host)) {
    return `${secureCookies ? "https" : "http"}://${host}`;
  }
  return new URL(env.BETTER_AUTH_URL).origin;
}
