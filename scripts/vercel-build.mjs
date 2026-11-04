/**
 * Vercel build entry (package.json "vercel-build"): migrations and seed, then next build.
 *
 * The seed writes the registry's venues and menu content only where they are missing (a venue
 * with a menu is left alone, so panel edits survive a deploy; D-04).
 *
 * Migrations and seed run for the production deployment only, unless previews have their own database:
 * the Neon integration currently gives Preview the production DATABASE_URL, so a pull request's
 * preview build would migrate the production database before the PR is merged (D-02). Once Neon
 * preview branching is on, set PREVIEW_DB_BRANCH=true for the Preview environment.
 */
import { execSync } from "node:child_process";

const target = process.env.VERCEL_ENV ?? "local";
const previewHasOwnDatabase = process.env.PREVIEW_DB_BRANCH === "true";

if (target === "production" || (target === "preview" && previewHasOwnDatabase)) {
  execSync("pnpm db:migrate", { stdio: "inherit" });
  execSync("pnpm db:seed", { stdio: "inherit" });
} else {
  console.log(
    `Migration and seed skipped: ${target} shares the production database (PREVIEW_DB_BRANCH).`,
  );
}
execSync("pnpm build", { stdio: "inherit" });
