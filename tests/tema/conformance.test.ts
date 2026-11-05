import { type ComponentType, createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { AvailabilityStatus } from "@/platform/menu/availability";
import type { MenuItem, VenueMenu } from "@/platform/menu/types";
import { buildVenueView, itemIndex, type VenueView } from "@/platform/menu/view";
import type { Locale } from "@/platform/tenant/registry-schema";
import { THEMES } from "@/platform/tenant/registry-schema";
import { baseExploreSlots } from "@/platform/theme/base/explore-slots";
import type { ItemCardVariant, StoryProps, ThemeSlots } from "@/platform/theme/contract";
import rakim from "@/themes/rakim";
import sade from "@/themes/sade";

/**
 * BR-TMA-002 (ADR-0003 §4): every theme renders the edge-case fixture without failing and without
 * losing what the guest must see — the product's name, its price, "sold out", the legal note — in
 * Turkish and in Arabic. A new theme passes this suite before a venue may use it (D-21 adds it to
 * THEMES). Rendered on the server: no browser, no clock (the slots get statuses as props).
 */
const LONG_NAME = "Kuzu incik, közlenmiş patlıcan beğendi, tereyağlı sos ve kekikli fırın patatesi";

const item = (id: string, extra: Partial<MenuItem>): MenuItem => ({
  id,
  slug: id,
  kind: "dish",
  name: { tr: `Ürün ${id}` },
  description: { tr: "Açıklama." },
  ingredients: { tr: "Bileşen" },
  allergens: [],
  mayContain: [],
  diets: [],
  spiceLevel: 0,
  energyKcal: 100,
  nutrition: null,
  portionG: 250,
  volumeMl: null,
  origin: null,
  attributes: {},
  alcohol: null,
  imageId: null,
  prices: [{ id: `${id}-p`, unit: "portion", amountMinor: 12000, label: null, isDefault: true }],
  optionGroups: [],
  optionRules: [],
  availability: null,
  pairings: [],
  suggestions: [],
  components: [],
  courses: [],
  ...extra,
});

const items: MenuItem[] = [
  item("uzun", { name: { tr: LONG_NAME, ar: "ساق الضأن مع الباذنجان" }, spiceLevel: 2 }),
  item("yarim", {
    name: { tr: "Kuru fasulye" },
    prices: [
      { id: "y1", unit: "portion", amountMinor: 22000, label: null, isDefault: true },
      { id: "y2", unit: "half", amountMinor: 14000, label: null, isDefault: false },
    ],
  }),
  item("tartili", {
    name: { tr: "Pastırma" },
    prices: [{ id: "t1", unit: "per_100g", amountMinor: 24000, label: null, isDefault: true }],
  }),
  item("sarap", {
    kind: "drink",
    name: { tr: "Kırmızı şarap" },
    alcohol: { brand: "Kurgusal Bağ", abvTenths: 135 },
    prices: [
      { id: "s1", unit: "glass", amountMinor: 32000, label: null, isDefault: true },
      { id: "s2", unit: "bottle", amountMinor: 145000, label: null, isDefault: false },
    ],
  }),
  item("fotografli", { imageId: "img1", name: { tr: "Cortado", ar: "كورتادو" } }),
  item("secenekli", {
    kind: "drink",
    name: { tr: "Türk kahvesi" },
    optionGroups: [
      {
        id: "g1",
        key: "seker",
        name: { tr: "Şeker" },
        min: 1,
        max: 1,
        appliesTo: null,
        options: [
          {
            id: "o1",
            key: "sade",
            name: { tr: "Sade" },
            priceDeltaMinor: 0,
            allergens: [],
            dietsRemoved: [],
            isDefault: false,
            available: true,
          },
          {
            id: "o2",
            key: "orta",
            name: { tr: "Orta" },
            priceDeltaMinor: 0,
            allergens: [],
            dietsRemoved: [],
            isDefault: false,
            available: true,
          },
        ],
      },
    ],
  }),
  item("bilgisiz", { ingredients: null, energyKcal: null, name: { tr: "Günün tatlısı" } }),
];

const menu: VenueMenu = {
  menus: [
    {
      id: "m1",
      slug: "gun",
      kind: "all_day",
      name: { tr: "Gün boyu" },
      schedule: null,
      outsideWindow: "dim",
      access: "public",
      contexts: [],
      sections: [
        {
          id: "s1",
          name: { tr: "Bölüm" },
          description: null,
          layoutHint: null,
          items: items.map((i) => ({ item: i, featured: false })),
          children: [],
        },
        {
          id: "s2",
          name: { tr: "Boş bölüm" },
          description: null,
          layoutHint: null,
          items: [],
          children: [],
        },
      ],
      daily: [],
    },
  ],
  items,
};

const view = (locale: Locale): VenueView =>
  buildVenueView(
    {
      venue: {
        slug: "test-mekan",
        name: "Test Mekânı",
        kind: "lokanta",
        mode: "demo",
        defaultLocale: "tr",
        locales: ["tr", "ar"],
        timeZone: "Europe/Istanbul",
      },
      menu,
      stories: [
        {
          id: "h1",
          slug: "hikaye",
          kind: "supplier",
          collection: null,
          stop: null,
          title: { tr: "Tedarikçi" },
          summary: null,
          body: { tr: "## Başlık\n\nMetin <b>kalın</b> ![resim](https://example.com/x.jpg)" },
          coverId: null,
          galleryIds: [],
          itemIds: ["yarim"],
        },
      ],
      media: {
        img1: {
          id: "img1",
          source: "unsplash",
          url: "https://images.unsplash.com/photo-1",
          width: 2400,
          height: 1600,
          alt: { tr: "Fotoğraf" },
          focalX: 50,
          focalY: 50,
          photographer: null,
          sourcePage: null,
          license: null,
        },
      },
    },
    locale,
    { rtl: locale === "ar" },
  );

const html = <P extends object>(component: ComponentType<P>, props: P) =>
  renderToStaticMarkup(createElement(component, props));

const soldOut: AvailabilityStatus = {
  soldOut: { reason: "marked", until: null },
  remaining: null,
  nextRelease: null,
  season: null,
  visible: true,
};
const VARIANTS: ItemCardVariant[] = ["satir", "kart", "izgara", "one-cikan"];

const themes: Record<string, ThemeSlots> = {
  sade: { ...baseExploreSlots, ...sade.slots },
  rakim: { ...baseExploreSlots, ...rakim.slots },
};

describe.each(THEMES)("BR-TMA-002: theme %s on the edge-case fixture", (id) => {
  const slots = themes[id]!;

  it.each(["tr", "ar"] as const)(
    "every product card variant shows the name and the price (%s)",
    (locale) => {
      const venue = view(locale);
      for (const product of venue.items) {
        for (const variant of VARIANTS) {
          const out = html(slots.ItemCard, {
            item: product,
            variant,
            venue,
            status: null,
            onOpen: () => undefined,
          });
          expect(out, `${product.slug} ${variant}`).toContain(product.name.text);
          if (product.defaultPrice)
            expect(out, `${product.slug} ${variant}`).toContain(product.defaultPrice.amount);
        }
      }
    },
  );

  it("a sold-out product says so in every variant", () => {
    const venue = view("tr");
    const product = itemIndex(venue).get("yarim")!;
    for (const variant of VARIANTS) {
      expect(
        html(slots.ItemCard, {
          item: product,
          variant,
          venue,
          status: soldOut,
          onOpen: () => undefined,
        }),
      ).toContain("Tükendi");
    }
  });

  it("units are written with the price: half, per 100 g, glass and bottle", () => {
    const venue = view("tr");
    const index = itemIndex(venue);
    expect(html(slots.Price, { price: index.get("tartili")!.defaultPrice! })).toContain("100 g");
    const sheetLike = [index.get("yarim")!, index.get("sarap")!]
      .flatMap((p) => p.prices)
      .map((price) => html(slots.Price, { price }));
    expect(sheetLike.join(" ")).toContain("Yarım");
    expect(sheetLike.join(" ")).toContain("Kadeh");
    expect(sheetLike.join(" ")).toContain("Şişe");
  });

  it("missing product information asks the staff instead of staying empty (BR-YSL-005)", () => {
    const venue = view("tr");
    expect(html(slots.ItemFacts, { item: itemIndex(venue).get("bilgisiz")!, venue })).toContain(
      "Bilgi için personele sorun",
    );
  });

  it("the legal note is there in every language (BR-YSL-002)", () => {
    expect(html(slots.LegalNote, { venue: view("tr") })).toContain("Fiyatlara KDV dahildir.");
    expect(html(slots.LegalNote, { venue: view("ar") })).toContain(
      "الأسعار تشمل ضريبة القيمة المضافة.",
    );
  });

  it("an Arabic page marks a Turkish fallback with its language (BR-MNU-003)", () => {
    const venue = view("ar");
    const out = html(slots.ItemCard, {
      item: itemIndex(venue).get("yarim")!,
      variant: "satir",
      venue,
      status: null,
      onOpen: () => undefined,
    });
    expect(out).toContain('lang="tr"');
  });

  it("a story renders its Markdown safely: no raw HTML, no inline image (K-34)", () => {
    const venue = view("tr");
    const out = html<StoryProps>(slots.Story, {
      story: venue.stories[0]!,
      venue,
      layout: "akis",
      headingLevel: 2,
      index: 0,
    });
    expect(out).toContain("Tedarikçi");
    expect(out).not.toContain("<b>");
    expect(out).not.toContain("example.com");
    expect(out).toContain("#urun-yarim");
  });
});
