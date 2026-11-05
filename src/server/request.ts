import "server-only";

import { createHash } from "node:crypto";

import { headers } from "next/headers";

import { env } from "@/lib/env";

/**
 * Client IP from headers set by the platform, not from the user-controlled first
 * X-Forwarded-For value (11-guvenlik §9). Adjust if the app runs behind another proxy.
 */
export async function clientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip")?.trim() ??
    "0.0.0.0"
  );
}

/** Salted hash: consent and audit records never store a raw IP (10-yasal-ve-kvkk §4). */
export function hashIp(ip: string): string {
  return hashKey(ip);
}

/** The same salted hash for any personal value used as a key (a rate limit per e-mail address). */
export function hashKey(value: string): string {
  return createHash("sha256").update(`${env.IP_HASH_SALT}:${value}`).digest("hex").slice(0, 32);
}
