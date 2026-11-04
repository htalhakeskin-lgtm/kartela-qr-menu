/**
 * Contact sheet and size report for candidate or published images (20-gorsel-kalite §5.2, §8).
 *
 *   pnpm gorsel:kontrol docs/tasarim/adaylar            # candidates: pick by looking at the sheet
 *   pnpm gorsel:kontrol public --rol hero                # fail (exit 1) if any image is below the role
 *
 * Writes docs/tasarim/temas-sayfasi.png (all images side by side, same neutral background, with
 * size and verdict) and docs/tasarim/temas-sayfasi.json. Consistency (background, light, colour
 * temperature) is only visible side by side: open the PNG and look at it before choosing.
 * CHROMIUM_PATH: optional browser binary when Playwright's own download is not available.
 */
import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

import { chromium } from "@playwright/test";

const MIN_LONG_EDGE = { hero: 2400, kart: 1600, kucuk: 800 };
const EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    rol: { type: "string", default: "kart" },
    cikti: { type: "string", default: "docs/tasarim/temas-sayfasi.png" },
  },
});

const folder = positionals[0];
const role = values.rol;
if (!folder || !(role in MIN_LONG_EDGE)) {
  console.error(
    "Kullanım: pnpm gorsel:kontrol <klasör> [--rol hero|kart|kucuk] [--cikti dosya.png]",
  );
  process.exit(1);
}

async function listImages(dir) {
  const entries = await readdir(dir, { withFileTypes: true, recursive: true });
  return entries
    .filter((entry) => entry.isFile() && EXTENSIONS.has(path.extname(entry.name).toLowerCase()))
    .map((entry) => path.resolve(entry.parentPath, entry.name))
    .sort();
}

const files = await listImages(folder);
if (files.length === 0) {
  console.error(`Görsel bulunamadı: ${folder}`);
  process.exit(1);
}

const output = path.resolve(values.cikti);
await mkdir(path.dirname(output), { recursive: true });
const htmlPath = output.replace(/\.png$/, ".html");

const escapeHtml = (text) =>
  text.replace(
    /[&<>"]/g,
    (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char],
  );

const figures = files
  .map((file, index) => {
    const relative = escapeHtml(path.relative(process.cwd(), file));
    return `<figure data-file="${relative}"><div class="frame"><img src="${pathToFileURL(file).href}" alt=""></div>
<figcaption><b>${String(index + 1).padStart(2, "0")}</b> ${relative}<br><span class="size">…</span></figcaption></figure>`;
  })
  .join("\n");

await writeFile(
  htmlPath,
  `<!doctype html><meta charset="utf-8"><style>
body{margin:0;padding:24px;background:#e9e9e7;font:13px/1.35 system-ui,sans-serif;color:#222}
main{display:grid;grid-template-columns:repeat(6,1fr);gap:16px;width:1552px}
figure{margin:0;background:#fff;border-radius:6px;overflow:hidden}
.frame{height:240px;display:flex;align-items:center;justify-content:center;background:#d8d8d5}
img{max-width:100%;max-height:100%;object-fit:contain}
figcaption{padding:8px 10px;word-break:break-all}
.ok{color:#1d6b3a}.warn{color:#8a5a00}.bad{color:#b3261e;font-weight:600}
</style><main>${figures}</main>`,
);

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
let report;
try {
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await page.goto(pathToFileURL(htmlPath).href);
  await page.waitForLoadState("load");
  report = await page.evaluate((min) => {
    const verdict = (long) =>
      long >= min.hero ? "hero" : long >= min.kart ? "kart" : long >= min.kucuk ? "kucuk" : "dusuk";
    return [...document.querySelectorAll("figure")].map((figure) => {
      const img = figure.querySelector("img");
      const width = img.naturalWidth;
      const height = img.naturalHeight;
      const fits = verdict(Math.max(width, height));
      const span = figure.querySelector(".size");
      span.textContent = width ? `${width} × ${height} px · uygun: ${fits}` : "açılamadı";
      span.className = `size ${fits === "hero" ? "ok" : fits === "dusuk" || !width ? "bad" : "warn"}`;
      return { file: figure.dataset.file, width, height, fits };
    });
  }, MIN_LONG_EDGE);
  await page.screenshot({ path: output, fullPage: true });
} finally {
  await browser.close();
  await rm(htmlPath, { force: true });
}

const rank = { dusuk: 0, kucuk: 1, kart: 2, hero: 3 };
const below = report.filter((item) => rank[item.fits] < rank[role]);
await writeFile(output.replace(/\.png$/, ".json"), JSON.stringify(report, null, 2));

for (const item of report) {
  const mark = rank[item.fits] >= rank[role] ? "✓" : "✗";
  console.log(`${mark} ${item.width}×${item.height}\t${item.fits}\t${item.file}`);
}
console.log(
  `\n${report.length} görsel · "${role}" için eşik altı: ${below.length} · temas sayfası: ${path.relative(process.cwd(), output)}`,
);
process.exit(below.length > 0 ? 1 : 0);
