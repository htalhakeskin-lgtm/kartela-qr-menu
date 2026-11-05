import type { RateLimitRule } from "@/server/rate-limit";

/**
 * Business parameters with plan numbers (plan §9, P-…) so a rule can be found by search
 * (02-mimari §4). Values a venue edits belong in venue_settings instead.
 */

/** P-01 End of the business day in Europe/Istanbul: sold-out flags drop, daily counts reset, cron runs. */
export const DAY_END_HOUR = 4;

export const rateLimits = {
  /** P-02 Secret section password attempts (BR-GZL-001) */
  secretSection: { key: "secret-section", limit: 5, windowSeconds: 600 },
  /** Cookieless statistics beacon (BR-IST-001): per hashed IP, kept in memory only */
  statsBeacon: { key: "stats-beacon", limit: 120, windowSeconds: 60 },
  /** Panel uploads (P-08) */
  upload: { key: "upload", limit: 30, windowSeconds: 600 },
  /** P-09 Panel sign-in: per IP and per account (11-guvenlik §4: no lock-out, a rising wait) */
  signInIp: { key: "sign-in-ip", limit: 20, windowSeconds: 900 },
  signInAccount: { key: "sign-in-account", limit: 8, windowSeconds: 900 },
  /** P-09 Second step (TOTP / backup code), per IP; Better Auth also caps tries per challenge */
  twoFactor: { key: "two-factor", limit: 10, windowSeconds: 900 },
} as const satisfies Record<string, RateLimitRule>;

/** P-03 How long the "Seçtiklerim" list is kept in the browser (BR-SEC-001). */
export const PICKS_TTL_HOURS = 24;

/** P-04 Statistics retention in months; older rows are rolled up monthly. */
export const STATS_RETENTION_MONTHS = 13;

/** P-05 Service worker image cache per venue. */
export const SW_IMAGE_CACHE_LIMIT = 60;

/** P-07 Minimum search length. */
export const SEARCH_MIN_CHARS = 2;

/** P-08 Upload limits. */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const MAX_IMAGE_EDGE_PX = 2560;
