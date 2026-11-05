#!/usr/bin/env node
/**
 * First-load JavaScript per route (12-performans §3, PF-02): the gzip size of the <script src>
 * chunks in each page's HTML. Lighthouse's network list is not used: it also counts the chunks
 * prefetched for visible links. Run against a production build (`pnpm build && pnpm start`).
 *
 *   node scripts/olcum/ilk-yuk-js.mjs http://localhost:3000 / /iletisim /panel/giris
 *   node scripts/olcum/ilk-yuk-js.mjs http://localhost:3020 --mekan rakim ornek
 *
 * The empty page of the fresh skeleton gives the framework base; the budget is base + share.
 * --mekan measures each venue's quick menu, Keşfet and Bilgi through its path-prefixed preview
 * (/m/{slug}/…) against NFR-05 (227 KB gzip); tests/e2e/static-cache.spec.ts enforces it in CI.
 */
const VENUE_BUDGET_KB = 227;
import { gzipSync } from "node:zlib";

const [base, ...rest] = process.argv.slice(2);
const venueMode = rest[0] === "--mekan";
const paths = venueMode
  ? rest.slice(1).flatMap((slug) => ["", "/kesfet", "/bilgi"].map((page) => `/m/${slug}${page}`))
  : rest;
if (!base || paths.length === 0) {
  console.error("usage: ilk-yuk-js.mjs <base-url> <path> [<path> …] | --mekan <slug> [<slug> …]");
  process.exit(1);
}
// Git Bash on Windows turns "/iletisim" into "C:/Program Files/Git/iletisim".
if (paths.some((path) => !path.startsWith("/"))) {
  console.error("paths must start with '/'; in Git Bash run with MSYS_NO_PATHCONV=1");
  process.exit(1);
}

const sizes = new Map();
async function chunkSize(src) {
  if (!sizes.has(src)) {
    const body = Buffer.from(await (await fetch(new URL(src, base))).arrayBuffer());
    sizes.set(src, gzipSync(body).length);
  }
  return sizes.get(src);
}

let overBudget = false;
for (const path of paths) {
  const response = await fetch(new URL(path, base));
  if (venueMode && response.status === 404) continue; // the theme has no such page yet
  const html = await response.text();
  const srcs = [...new Set([...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((m) => m[1]))];
  let total = 0;
  for (const src of srcs) total += await chunkSize(src);
  const kb = total / 1024;
  const verdict = venueMode ? (kb <= VENUE_BUDGET_KB ? "  ✓" : `  ✖ > ${VENUE_BUDGET_KB} KB`) : "";
  if (venueMode && kb > VENUE_BUDGET_KB) overBudget = true;
  console.log(
    `${path.padEnd(36)} ${String(srcs.length).padStart(3)} parça  ${kb.toFixed(0).padStart(5)} KB gzip${verdict}`,
  );
}
if (overBudget) process.exit(1);
