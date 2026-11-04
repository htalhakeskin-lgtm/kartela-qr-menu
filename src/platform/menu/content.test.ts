import { describe, expect, it } from "vitest";

import { loadVenueContent, venuesWithContent } from "@/server/content/venue-content";

import { venueRecords } from "../../../content/mekanlar";
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
    input.menus[0]!.sections![0]!.items = ["cay", "cay", "kahve"];
    const found = problems(input).join("\n");
    expect(found).toContain("Tekrarlanan ürün: cay");
    expect(found).toContain("Kayıtsız görsel: yok");
    expect(found).toContain("Bölümde iki kez: cay");
    expect(found).toContain("Kayıtsız ürün: kahve");
  });

  it("allows two levels of sections and no deeper", () => {
    const input = minimal();
    input.menus[0]!.sections![0]!.children = [
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

  it.each(venuesWithContent())(
    "%s: valid (menu, stories and their bodies) and registered",
    async (slug) => {
      expect(registry.map((venue) => venue.slug)).toContain(slug);
      await expect(loadVenueContent(slug)).resolves.toBeTruthy();
    },
  );

  it.each(venuesWithContent())(
    "REQ-005: %s demo data has ingredients and energy on every published product",
    async (slug) => {
      const content = (await loadVenueContent(slug))!;
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

describe("option groups in the content file (D-05)", () => {
  const withOptions = (): MenuContentInput => ({
    ...minimal(),
    optionGroups: {
      sut: {
        name: { tr: "Süt" },
        min: 1,
        options: [
          { key: "inek", name: { tr: "İnek sütü" }, default: true },
          { key: "sutsuz", name: { tr: "Sütsüz" }, delta: "-10" },
        ],
      },
      ekstra: {
        name: { tr: "Ekstra" },
        max: 2,
        options: [{ key: "krema", name: { tr: "Krema" } }],
      },
    },
  });

  it("parses groups, negative deltas and links", () => {
    const input = withOptions();
    input.items[0]!.prices = [{ key: "buyuk", unit: "size", label: { tr: "Büyük" }, amount: "40" }];
    input.items[0]!.options = [{ group: "sut" }, { group: "ekstra", appliesTo: ["buyuk"] }];
    input.rules = [
      { when: "sut.sutsuz", excludes: "ekstra", message: { tr: "Sütsüzde ekstra yok." } },
    ];
    const content = parseMenuContent("test", input);
    expect(content.optionGroups.sut!.options[1]).toMatchObject({ key: "sutsuz", delta: -1000 });
    expect(content.optionGroups.ekstra).toMatchObject({ min: 0, max: 2 });
    expect(content.items[0]!.options).toEqual([
      { group: "sut" },
      { group: "ekstra", appliesTo: ["buyuk"] },
    ]);
  });

  it("BR-SCN-001: impossible limits are refused", () => {
    const input = withOptions();
    input.optionGroups!.ekstra = {
      name: { tr: "Ekstra" },
      min: 2,
      max: 1,
      options: [{ key: "krema", name: { tr: "Krema" } }],
    };
    const found = problems(input).join("\n");
    expect(found).toContain("min, max'tan büyük olamaz");
    expect(found).toContain("min, seçenek sayısından büyük olamaz");
  });

  it("refuses links to unknown groups, price keys and options", () => {
    const input = withOptions();
    input.items[0]!.options = [{ group: "surup" }, { group: "ekstra", appliesTo: ["dev"] }];
    input.rules = [
      { when: "sut.yulaf", excludes: "ekstra.krema" },
      { when: "sut.inek", excludes: "ekstra", requires: "sut" },
    ];
    const found = problems(input).join("\n");
    expect(found).toContain("Kayıtsız seçenek grubu: surup");
    expect(found).toContain("Ürünün fiyat satırında yok: dev");
    expect(found).toContain("Kayıtsız seçenek: sut.yulaf");
    expect(found).toContain("Kural ya excludes ya da requires taşır");
  });

  it("more defaults than the group's maximum is refused", () => {
    const input = withOptions();
    input.optionGroups!.sut!.options[1]!.default = true;
    expect(problems(input).join()).toContain("Varsayılan seçenek sayısı max'ı aşıyor");
  });
});

describe("availability and relations in the content file (D-06)", () => {
  const two = (): MenuContentInput => ({
    items: [
      { slug: "corba", name: { tr: "Çorba" }, prices: [{ amount: "120" }] },
      { slug: "pilav", name: { tr: "Pilav" }, prices: [{ amount: "90" }] },
    ],
    menus: [
      {
        slug: "gun",
        name: { tr: "Gün" },
        sections: [{ name: { tr: "Yemek" }, items: ["corba", "pilav"] }],
      },
    ],
  });

  it("BR-ILS-001: a product never pairs with or suggests itself; links must exist", () => {
    const input = two();
    input.items[0]!.pairings = [{ item: "corba" }, { item: "kofte" }];
    input.items[0]!.suggestions = ["corba"];
    const found = problems(input).join("\n");
    expect(found).toContain("Ürün kendisine bağlanamaz (BR-ILS-001)");
    expect(found).toContain("Kayıtsız ürün: kofte");
  });

  it("components belong to sets and courses to tasting menus only", () => {
    const input = two();
    input.items[0]!.components = [{ item: "pilav" }];
    input.items[1]!.kind = "tasting";
    const found = problems(input).join("\n");
    expect(found).toContain("Bileşenler yalnızca ve her zaman kind: set üründe");
    expect(found).toContain("Tadım sırası yalnızca ve her zaman kind: tasting üründe");
  });

  it("BR-MST-002: today's remaining count needs a daily limit and stays within it", () => {
    const input = two();
    input.items[0]!.availability = { remainingToday: 3 };
    expect(problems(input).join()).toContain("remainingToday için dailyLimit gerekir");
    input.items[0]!.availability = { dailyLimit: 2, remainingToday: 3 };
    expect(problems(input).join()).toContain("remainingToday için dailyLimit gerekir");
    input.items[0]!.availability = { dailyLimit: 12, remainingToday: 0, releaseTimes: ["07:00"] };
    expect(problems(input)).toEqual([]);
  });

  it("BR-MST-005: a daily menu needs its weekday pattern, and only a daily menu has one", () => {
    const input = two();
    input.menus.push({ slug: "gunluk", kind: "daily", name: { tr: "Günün menüsü" } });
    expect(problems(input).join()).toContain("Günün menüsü daily deseni ister");
    input.menus[1]!.daily = { weekdays: { "1": ["corba", "kofte"] } };
    expect(problems(input).join()).toContain("Kayıtsız ürün: kofte");
    input.menus[1]!.daily = { weekdays: { "1": ["corba"] } };
    input.menus[0]!.daily = { weekdays: { "2": ["pilav"] } };
    expect(problems(input).join()).toContain("daily yalnızca kind: daily menüde");
  });
});

describe("Keşfet stories in the content file (D-07)", () => {
  const withStories = (stories: unknown[]): unknown => ({ ...minimal(), stories });
  const story = (extra: Record<string, unknown> = {}) => ({
    slug: "demleme",
    kind: "guide",
    collection: "cay",
    title: { tr: "Demleme" },
    body: { tr: "Kaynar su." },
    ...extra,
  });

  it("accepts a story and fills its defaults", () => {
    const content = menuContentSchema.parse(withStories([story({ items: ["cay"] })]));
    expect(content.stories[0]).toMatchObject({ gallery: [], items: ["cay"], status: "published" });
  });

  it("a stop belongs to a collection; only chapters and guides have stop numbers", () => {
    expect(problems(withStories([story({ collection: undefined })])).join()).toContain(
      "Durak (chapter / guide) bir koleksiyona aittir",
    );
    expect(problems(withStories([story({ kind: "chef_note", stop: 2 })])).join()).toContain(
      "Durak numarası yalnızca chapter / guide hikâyede",
    );
    expect(
      problems(withStories([story({ stop: 1 }), story({ slug: "ikinci", stop: 1 })])).join(),
    ).toContain("Tekrarlanan durak: cay#1");
  });

  it("refuses unknown images and products, and duplicate stories", () => {
    const found = problems(
      withStories([story({ cover: "yok", gallery: ["hic"], items: ["kofte"] }), story()]),
    ).join(" | ");
    expect(found).toContain("Kayıtsız görsel: yok");
    expect(found).toContain("Kayıtsız görsel: hic");
    expect(found).toContain("Kayıtsız ürün: kofte");
    expect(found).toContain("Tekrarlanan hikâye: demleme");
  });

  it("a story needs its Turkish body (the hikayeler/{slug}.tr.md file)", () => {
    expect(problems(withStories([story({ body: { en: "Boiling water." } })]))).toContain(
      "stories.0.body.tr: Invalid input: expected string, received undefined",
    );
  });
});
