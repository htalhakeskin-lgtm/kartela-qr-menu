/**
 * pnpm mekan:yeni — a new venue on an existing theme (D-21, REQ-023, docs/yeni-mekan.md).
 * Writes content/mekanlar/{slug}/ (mekan.ts, menu.ts, bilgi.ts, hikayeler.ts) and adds the venue
 * to the registry and the content list. Every value can be given as a flag; missing ones are
 * asked. The registry schema checks the record before anything is written.
 *
 *   pnpm mekan:yeni --ad "Kepçe Lokantası" --slug kepce --tur lokanta --tema sade \
 *     --diller tr,en,ar --alan kepce-lokanta.vercel.app
 */
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { parseArgs } from "node:util";

import { venueRecords } from "../content/mekanlar";
import {
  parseRegistry,
  THEMES,
  VENUE_KINDS,
  type VenueRecordInput,
} from "../src/platform/tenant/registry-schema";
import {
  addToContents,
  addToIndex,
  infoFile,
  menuFile,
  type NewVenue,
  storiesFile,
  venueFile,
} from "./mekan-sablon";

const { values } = parseArgs({
  options: {
    ad: { type: "string" },
    slug: { type: "string" },
    tur: { type: "string" },
    tema: { type: "string" },
    diller: { type: "string" },
    alan: { type: "string" },
  },
});

const rl = createInterface({ input: process.stdin, output: process.stdout });
const ask = async (value: string | undefined, question: string, fallback = "") =>
  value ??
  ((await rl.question(`${question}${fallback ? ` (${fallback})` : ""}: `)).trim() || fallback);

const name = await ask(values.ad, "Mekânın adı");
const slug = await ask(values.slug, "Kısa ad (adres ve klasör, ör. kepce)");
const kind = await ask(values.tur, `Tür (${VENUE_KINDS.join(", ")})`, "lokanta");
const theme = await ask(values.tema, `Tema (${THEMES.join(", ")})`, "sade");
const locales = (await ask(values.diller, "Diller (virgülle)", "tr"))
  .split(",")
  .map((l) => l.trim());
const domain = await ask(values.alan, "Alan adı", `${slug}-kartela.vercel.app`);
rl.close();

const venue: NewVenue = {
  slug,
  name,
  kind,
  theme,
  locales,
  defaultLocale: locales[0] ?? "tr",
  domains: domain ? [domain] : [],
};

// The whole registry must still parse with the new venue (slug, hosts, theme, languages).
parseRegistry([...venueRecords, { ...venue, mode: "demo" } as VenueRecordInput]);

const folder = new URL(`../content/mekanlar/${slug}/`, import.meta.url);
if (existsSync(folder)) throw new Error(`content/mekanlar/${slug} zaten var`);
mkdirSync(new URL("hikayeler/", folder), { recursive: true });
writeFileSync(new URL("mekan.ts", folder), venueFile(venue));
writeFileSync(new URL("menu.ts", folder), menuFile(venue));
writeFileSync(new URL("bilgi.ts", folder), infoFile(venue));
writeFileSync(new URL("hikayeler.ts", folder), storiesFile(venue));
writeFileSync(new URL("hikayeler/.gitkeep", folder), "");

for (const [file, add] of [
  ["../content/mekanlar/index.ts", addToIndex],
  ["../content/mekanlar/icerik.ts", addToContents],
] as const) {
  const url = new URL(file, import.meta.url);
  writeFileSync(url, add(readFileSync(url, "utf8"), slug));
}

execSync("pnpm exec eslint --fix content/mekanlar", { stdio: "ignore" });
execSync("pnpm exec prettier --write content/mekanlar --log-level warn", { stdio: "inherit" });

console.log(`✓ content/mekanlar/${slug}/ yazıldı, kayda eklendi (tema ${theme}).
Sıradaki adımlar (docs/yeni-mekan.md):
  1. menu.ts, bilgi.ts ve hikayeleri doldurun; görselleri docs/gorsel-kaynaklari.md'ye kaydedin.
  2. pnpm db:seed && pnpm dev → http://${slug}.localhost:3020
  3. pnpm check && pnpm test:e2e
  4. Vercel'de ${domain || "alan adını"} projeye ekleyin (Panel → Platform → Mekân yönetimi), PR açın.`);
