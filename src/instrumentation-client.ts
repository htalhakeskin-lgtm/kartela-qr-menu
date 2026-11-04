import { config } from "zod/v4/core";

/**
 * Runs in the browser before any application code (Next.js instrumentation-client).
 * Zod 4 probes `new Function("")` when an object schema is created, to compile faster parsers.
 * The public CSP has no 'unsafe-eval' (11-guvenlik §8), so the probe is reported as a violation
 * (Lighthouse best-practices) even though Zod falls back. Form validation does not need the JIT.
 * Only the config setter is imported: `z` would put the whole library in every page's first
 * load (31 KB gzip, 12 §3); the setting lives on one global object every Zod import shares.
 */
config({ jitless: true });
