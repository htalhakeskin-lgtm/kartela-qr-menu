/**
 * Source text for `pnpm mekan:yeni` and `pnpm tema:yeni` (D-21, REQ-023). Pure functions: the
 * scripts do the file system work, the tests check that what is written parses.
 */
export type NewVenue = {
  slug: string;
  name: string;
  kind: string;
  theme: string;
  locales: string[];
  defaultLocale: string;
  domains: string[];
};

const q = (value: string) => JSON.stringify(value);

export function venueFile(venue: NewVenue): string {
  return `import { defineVenue } from "../../../src/platform/tenant/registry-schema";

/**
 * ${venue.name} — \`pnpm mekan:yeni\` ile oluşturuldu. Kurgusal mekânda kip "demo" kalır (K-06);
 * canlıya alma ve ek alan adları panelden (Platform → Mekân yönetimi, D-19).
 */
export default defineVenue({
  slug: ${q(venue.slug)},
  name: ${q(venue.name)},
  kind: ${q(venue.kind)},
  theme: ${q(venue.theme)},
  locales: [${venue.locales.map(q).join(", ")}],
  defaultLocale: ${q(venue.defaultLocale)},
  domains: [${venue.domains.map(q).join(", ")}],
  mode: "demo",
});
`;
}

/** One menu, one section, one product: enough to build and open; every field is replaced. */
export function menuFile(venue: NewVenue): string {
  return `import { defineMenuContent } from "../../../src/platform/menu/content";

/**
 * ${venue.name} menüsü (D-04 içerik modeli). Başlangıç iskeleti: ürünleri, fiyatları ve
 * görselleri buraya yazın (görsel kaynağı docs/gorsel-kaynaklari.md'ye, 20-gorsel-kalite §5).
 * Yayımlanan her üründe bileşen ve enerji zorunlu (REQ-005, K-24).
 */
export default defineMenuContent({
  images: {},
  menus: [
    {
      slug: "menu",
      name: { tr: "Menü" },
      sections: [{ name: { tr: "İlk bölüm" }, items: ["ilk-urun"] }],
    },
  ],
  items: [
    {
      slug: "ilk-urun",
      name: { tr: "İlk ürün" },
      description: { tr: "Ürünün kısa tanımı." },
      ingredients: { tr: "Bileşenler" },
      energyKcal: 100,
      prices: [{ amount: "100" }],
    },
  ],
});
`;
}

export function infoFile(venue: NewVenue): string {
  return `import { defineVenueInfo } from "../../../src/platform/menu/content";

/**
 * ${venue.name} bilgi sayfası (SCR-005). Telefon ve WhatsApp kurgusal mekânlarda geliştiricinin
 * hattıdır (KURALLAR C, Demo). Yayından sonra sahibi panelden düzenler (Ayarlar, D-18b).
 */
export default defineVenueInfo({
  description: { tr: ${q(`${venue.name}: kısa tanıtım.`)} },
  address: "Mahalle, ilçe / il",
  phone: "+905423115888",
  whatsapp: "+905423115888",
  hours: {},
});
`;
}

export function storiesFile(venue: NewVenue): string {
  return `import { defineStories } from "../../../src/platform/menu/content";

/** ${venue.name} Keşfet hikâyeleri (D-07). Gövdeler: hikayeler/{slug}.{dil}.md */
export default defineStories([]);
`;
}

const ident = (slug: string) => slug.replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase());

/** Adds the venue to content/mekanlar/index.ts (the registry list). */
export function addToIndex(source: string, slug: string): string {
  const name = ident(slug);
  if (source.includes(`./${slug}/mekan`)) return source;
  const withImport = source.replace(
    /(import type \{ VenueRecordInput \}[^\n]*\n)/,
    `$1import ${name} from "./${slug}/mekan";\n`,
  );
  return withImport.replace(
    /export const venueRecords: readonly VenueRecordInput\[\] = \[([^\]]*)\];/,
    (_, list: string) =>
      `export const venueRecords: readonly VenueRecordInput[] = [${list.trim()}, ${name}];`,
  );
}

/** Adds the venue's content files to content/mekanlar/icerik.ts. */
export function addToContents(source: string, slug: string): string {
  const name = ident(slug);
  if (source.includes(`./${slug}/menu`)) return source;
  const imports = `import ${name}Info from "./${slug}/bilgi";\nimport ${name}Stories from "./${slug}/hikayeler";\nimport ${name}Menu from "./${slug}/menu";\n`;
  const withImports = source.replace(/(\n\/\*\*\n \* Content files by venue slug)/, `${imports}$1`);
  return withImports.replace(
    /(export const venueContents[^{]*\{\n)([\s\S]*?)(\n\};)/,
    (_, head: string, body: string, tail: string) =>
      `${head}${body}\n  ${q(slug)}: { folder: ${q(slug)}, menu: ${name}Menu, stories: ${name}Stories, info: ${name}Info },${tail}`,
  );
}

/** Adds a theme id to a `THEMES` array literal (registry schema and ESLint boundaries). */
export function addTheme(source: string, id: string): string {
  return source.replace(
    /(const THEMES[^=]*= \[)([^\]]*)(\])/,
    (match, head: string, list: string, tail: string) =>
      list.includes(`"${id}"`) ? match : `${head}${list.trim()}, "${id}"${tail}`,
  );
}

/** Sade's identifiers in a copied file become the new theme's ("sade" → id, "Sade" → Name). */
export function renameTheme(source: string, id: string): string {
  const pascal = ident(id).replace(/^./, (c) => c.toUpperCase());
  // Not inside a longer lowercase word ("sadece" stays), but before a capital ("sadeFont…").
  return source.replace(/sade(?![a-zçğıöşü])/g, id).replace(/Sade(?![a-zçğıöşü])/g, pascal);
}

/** Adds the theme's metadata to src/themes/meta.ts (component-free map by id). */
export function addThemeMeta(source: string, id: string): string {
  const name = ident(id);
  if (source.includes(`./${id}/meta`)) return source;
  return source
    .replace(/(import sade from "\.\/sade\/meta";\n)/, `$1import ${name} from "./${id}/meta";\n`)
    .replace(
      /= \{ ([^}]*) \};/,
      (_, list: string) => `= { ${list.trim()}, ${name === id ? id : `${q(id)}: ${name}`} };`,
    );
}
