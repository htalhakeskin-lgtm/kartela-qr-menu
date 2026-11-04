import { describe, expect, it } from "vitest";

import { venueRecords } from "../../../content/mekanlar";
import { venueContents } from "../../../content/mekanlar/icerik";
import { parseRegistry } from "../tenant/registry-schema";
import { infoGaps } from "./completeness";
import { type MenuContentInput, menuContentSchema, parseMenuContent } from "./content";

const minimal = (): MenuContentInput => ({
  items: [{ slug: "cay", kind: "drink", name: { tr: "Çay" }, prices: [{ amount: "30" }] }],
  menus: [
    {
      slug: "gun-boyu",
      name: { tr: "Gün boyu" },
      sections: [{ name: { tr: "İçecekler" }, items: ["cay"] }],
    },
  ],
});

/** The messages of a failed parse, one per issue. */
const problems = (input: unknown) => {
  const result = menuContentSchema.safeParse(input);
  return result.success
    ? []
    : result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`);
};

describe("menu content file (D-04)", () => {
  it("parses a minimal file and fills the defaults", () => {
    const content = parseMenuContent("test", minimal());
    expect(content.items[0]).toMatchObject({
      kind: "drink",
      status: "published",
      allergens: [],
      spiceLevel: 0,
      prices: [{ unit: "portion", amount: 3000, default: true }],
    });
    expect(content.menus[0]).toMatchObject({ kind: "all_day", outsideWindow: "dim" });
    expect(content.menus[0]!.sections[0]!.items).toEqual([{ item: "cay", featured: false }]);
  });

  it("BR-FYT-001: amounts are read as Turkish money into kuruş, never as floats", () => {
    const input = minimal();
    input.items[0]!.prices = [{ amount: "1.850" }, { unit: "half", amount: "320,50" }];
    expect(parseMenuContent("test", input).items[0]!.prices.map((p) => p.amount)).toEqual([
      185000, 32050,
    ]);
    input.items[0]!.prices = [{ amount: "12,345" }];
    expect(problems(input).join()).toContain("Geçersiz tutar");
  });

  it("BR-FYT-002 and the default line: checked per product, with the path", () => {
    const input = minimal();
    input.items[0]!.prices = [
      { unit: "per_kg", amount: "1850" },
      { unit: "per_100g", amount: "190" },
    ];
    expect(problems(input)).toContain("items.0.prices: Fiyat satırları: kg_and_100g");
    input.items[0]!.prices = [
      { amount: "30", default: true },
      { unit: "half", amount: "20", default: true },
    ];
    expect(problems(input)).toContain("items.0.prices: Fiyat satırları: default_count");
  });

  it("refuses unknown values and missing Turkish (BR-MNU-003, REQ-005)", () => {
    const input = minimal() as { items: Record<string, unknown>[] };
    Object.assign(input.items[0]!, { allergens: ["dairy"], name: { en: "Tea" }, kind: "pizza" });
    const found = problems(input).join("\n");
    expect(found).toContain("items.0.allergens.0");
    expect(found).toContain("items.0.name.tr");
    expect(found).toContain("items.0.kind");
  });

  it("refuses links to unknown products and images, and duplicates", () => {
    const input = minimal();
    input.items.push({ ...input.items[0]!, image: "yok" });
    input.menus[0]!.sections[0]!.items = ["cay", "cay", "kahve"];
    const found = problems(input).join("\n");
    expect(found).toContain("Tekrarlanan ürün: cay");
    expect(found).toContain("Kayıtsız görsel: yok");
    expect(found).toContain("Bölümde iki kez: cay");
    expect(found).toContain("Kayıtsız ürün: kahve");
  });

  it("allows two levels of sections and no deeper", () => {
    const input = minimal();
    input.menus[0]!.sections[0]!.children = [
      { name: { tr: "Sıcak" }, items: ["cay"], children: [] } as never,
    ];
    expect(problems(input).join()).toContain("children");
  });

  it("a window with the same start and end is refused; one crossing midnight is fine", () => {
    const input = minimal();
    input.menus[0]!.schedule = { windows: [{ start: "22:00", end: "02:00" }] };
    expect(problems(input)).toEqual([]);
    input.menus[0]!.schedule = { windows: [{ start: "08:00", end: "08:00" }] };
    expect(problems(input).join()).toContain("Başlangıç ve bitiş aynı olamaz");
  });

  it("stock images must come from their CDN (K-16)", () => {
    const input = minimal();
    input.images = {
      foto: {
        source: "unsplash",
        url: "https://example.com/foto.jpg",
        width: 2000,
        height: 1500,
        photographer: "X",
        sourcePage: "https://unsplash.com/photos/x",
        alt: { tr: "Fotoğraf" },
      },
    };
    expect(problems(input).join()).toContain("CDN");
  });
});

describe("the shipped content files", () => {
  const registry = parseRegistry(venueRecords);

  it.each(Object.entries(venueContents))("%s: valid and its venue is registered", (slug, input) => {
    expect(registry.map((venue) => venue.slug)).toContain(slug);
    expect(() => parseMenuContent(slug, input)).not.toThrow();
  });

  it.each(Object.entries(venueContents))(
    "REQ-005: %s demo data has ingredients and energy on every published product",
    (slug, input) => {
      const content = parseMenuContent(slug, input);
      const gaps = content.items
        .filter((item) => item.status === "published")
        .flatMap((item) =>
          infoGaps({
            kind: item.kind,
            ingredients: item.ingredients ?? null,
            energyKcal: item.energyKcal ?? null,
          }).map((gap) => `${item.slug}: ${gap}`),
        );
      expect(gaps).toEqual([]);
    },
  );
});
