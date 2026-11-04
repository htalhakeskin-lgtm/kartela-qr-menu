/**
 * Vercel build entry (package.json "vercel-build"): migrations and seed, then next build.
 *
 * The seed writes the registry's venues and menu content only where they are missing (a venue
 * with a menu is left alone, so panel edits survive a deploy; D-04).
 *
 * Production always migrates and seeds. A preview does so only on its own Neon branch (plan
 * K-42): the Neon integration creates a branch per preview deployment and points DATABASE_URL at
 * it. Two independent conditions must hold, so a misconfigured preview never writes to the
 * production database (previews also seed the test fixture venue):
 *
 * 1. PREVIEW_DB_BRANCH=true (Preview environment): preview branching is switched on.
 * 2. The database host differs from production's. Every build prints a short fingerprint of its
 *    host (a hash, not the host); PRODUCTION_DB_FINGERPRINT (Preview environment) holds the
 *    production value. Missing or equal → no migration, no seed.
 */
import { execSync } from "node:child_process";

import { dbFingerprint, migrationRefusal } from "./preview-db-guard.mjs";

const target = process.env.VERCEL_ENV ?? "local";
const fingerprint = dbFingerprint(process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL);
console.log(`Database host fingerprint (${target}): ${fingerprint}`);

const refusal = migrationRefusal({
  target,
  fingerprint,
  previewDbBranch: process.env.PREVIEW_DB_BRANCH,
  productionFingerprint: process.env.PRODUCTION_DB_FINGERPRINT,
});
if (refusal === null) {
  execSync("pnpm db:migrate", { stdio: "inherit" });
  execSync("pnpm db:seed", { stdio: "inherit" });
} else {
  console.log(`Migration and seed skipped (${target}): ${refusal}.`);
}
execSync("pnpm build", { stdio: "inherit" });
