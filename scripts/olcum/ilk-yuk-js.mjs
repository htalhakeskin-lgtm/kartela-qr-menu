#!/usr/bin/env node
/**
 * First-load JavaScript per route (12-performans §3, PF-02): the gzip size of the <script src>
 * chunks in each page's HTML. Lighthouse's network list is not used: it also counts the chunks
 * prefetched for visible links. Run against a production build (`pnpm build && pnpm start`).
 *
 *   node scripts/olcum/ilk-yuk-js.mjs http://localhost:3000 / /iletisim /panel/giris
 *
 * The empty page of the fresh skeleton gives the framework base; the budget is base + share.
 */
import { gzipSync } from "node:zlib";

const [base, ...paths] = process.argv.slice(2);
if (!base || paths.length === 0) {
  console.error("usage: ilk-yuk-js.mjs <base-url> <path> [<path> …]");
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

for (const path of paths) {
  const html = await (await fetch(new URL(path, base))).text();
  const srcs = [...new Set([...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((m) => m[1]))];
  let total = 0;
  for (const src of srcs) total += await chunkSize(src);
  console.log(
    `${path.padEnd(36)} ${String(srcs.length).padStart(3)} parça  ${(total / 1024).toFixed(0).padStart(5)} KB gzip`,
  );
}
