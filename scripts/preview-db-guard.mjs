import { createHash } from "node:crypto";

/**
 * Decides whether a Vercel build may migrate and seed its database (plan K-42). Kept pure so the
 * rule that protects production data is unit tested (scripts/preview-db-guard.test.ts).
 */

/** A short hash of the database's compute endpoint; Neon's pooled and direct hosts map to one value. */
export function dbFingerprint(url) {
  if (!url) return "none";
  const host = new URL(url).hostname.replace("-pooler", "");
  return createHash("sha256").update(host).digest("hex").slice(0, 12);
}

/** Null when migration and seed may run; otherwise the reason they are skipped. */
export function migrationRefusal({ target, fingerprint, previewDbBranch, productionFingerprint }) {
  if (target === "production") return null;
  if (target !== "preview") return "not a Vercel deployment";
  if (previewDbBranch !== "true") return "PREVIEW_DB_BRANCH is not true";
  if (!productionFingerprint) return "PRODUCTION_DB_FINGERPRINT is not set";
  if (fingerprint === "none") return "no database URL";
  if (productionFingerprint === fingerprint) return "this preview uses the production database";
  return null;
}
