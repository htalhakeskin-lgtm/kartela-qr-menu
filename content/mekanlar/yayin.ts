import type { RegistryOverlay } from "../../src/platform/tenant/registry-schema";

/**
 * What the platform admin changed in the panel (D-19, K-50): each venue's mode and the domains
 * bound and verified there. `pnpm venues:export` rewrites this file from the database during the
 * Vercel build (scripts/vercel-build.mjs), after the seed and before `next build`, so the host map
 * and every static page are built with it (ADR-0002). In the repository it stays empty: locally
 * and in CI the venue files are the whole truth.
 */
export const registryOverlay: RegistryOverlay = {};
