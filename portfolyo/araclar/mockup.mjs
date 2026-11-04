#!/usr/bin/env node
/**
 * Renders device mockups from screenshots (19-portfolyo §4).
 *
 *   node portfolyo/araclar/mockup.mjs                       # cover + LinkedIn variants from defaults
 *   node portfolyo/araclar/mockup.mjs --duzen kapak \
 *     --masaustu portfolyo/screenshot/01-ana-sayfa-masaustu.png \
 *     --telefon portfolyo/screenshot/04-ilan-detay-mobil.png \
 *     --cikti portfolyo/mockup/01-kapak.png
 *   node portfolyo/araclar/mockup.mjs --duzen uclu --telefon a.png --telefon2 b.png --telefon3 c.png --cikti portfolyo/mockup/02-mobil-uclu.png
 *
 * Layouts: kapak 2560×1600 · kare 1200×1200 · dikey 1080×1350 · uclu 2560×1600.
 * Without --cikti, the default run writes 01-kapak.png, 01-kapak-kare.png and 01-kapak-dikey.png.
 */
import { existsSync, readdirSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

import { chromium } from "@playwright/test";

const SIZES = { kapak: [2560, 1600], kare: [1200, 1200], dikey: [1080, 1350], uclu: [2560, 1600] };
const here = path.dirname(fileURLToPath(import.meta.url));
const shotsDir = path.resolve("portfolyo/screenshot");

const { values } = parseArgs({
  options: {
    duzen: { type: "string" },
    masaustu: { type: "string" },
    telefon: { type: "string" },
    telefon2: { type: "string" },
    telefon3: { type: "string" },
    zemin: { type: "string" },
    cikti: { type: "string" },
  },
});

function firstShot(suffix) {
  if (!existsSync(shotsDir)) return undefined;
  const file = readdirSync(shotsDir)
    .filter((name) => name.endsWith(`-${suffix}.png`))
    .sort()[0];
  return file ? path.join(shotsDir, file) : undefined;
}

const toUrl = (file) => (file ? pathToFileURL(path.resolve(file)).href : undefined);

const jobs = values.cikti
  ? [{ duzen: values.duzen ?? "kapak", cikti: values.cikti }]
  : [
      { duzen: "kapak", cikti: "portfolyo/mockup/01-kapak.png" },
      { duzen: "kare", cikti: "portfolyo/mockup/01-kapak-kare.png" },
      { duzen: "dikey", cikti: "portfolyo/mockup/01-kapak-dikey.png" },
    ];

const sources = {
  masaustu: values.masaustu ?? firstShot("masaustu"),
  telefon: values.telefon ?? firstShot("mobil"),
  telefon2: values.telefon2,
  telefon3: values.telefon3,
};
if (!sources.telefon && !sources.masaustu) {
  console.error(
    "Ekran görüntüsü bulunamadı. Önce `pnpm screenshots` çalıştırın ya da --masaustu / --telefon verin.",
  );
  process.exit(1);
}

// CHROMIUM_PATH: optional browser binary when Playwright's own download is not available.
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
try {
  for (const job of jobs) {
    const [width, height] = SIZES[job.duzen] ?? SIZES.kapak;
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
    const query = new URLSearchParams({ duzen: job.duzen });
    for (const [key, file] of Object.entries(sources)) if (file) query.set(key, toUrl(file));
    if (values.zemin) query.set("zemin", values.zemin);
    await page.goto(`${pathToFileURL(path.join(here, "mockup.html")).href}?${query}`);
    await page.waitForSelector("body[data-ready='true']");
    await mkdir(path.dirname(job.cikti), { recursive: true });
    await page.locator("#stage").screenshot({ path: job.cikti });
    await page.close();
    console.log(`✓ ${job.cikti} (${width}×${height})`);
  }
} finally {
  await browser.close();
}
