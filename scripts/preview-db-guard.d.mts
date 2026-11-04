// Types for preview-db-guard.mjs (plain JavaScript so `node scripts/vercel-build.mjs` runs it as is).
export function dbFingerprint(url: string | undefined): string;
export function migrationRefusal(input: {
  target: string;
  fingerprint: string;
  previewDbBranch?: string;
  productionFingerprint?: string;
}): string | null;
