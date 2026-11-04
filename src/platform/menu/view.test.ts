import { describe, expect, it } from "vitest";

import type { MenuItem, VenueMenu } from "./types";
import { buildVenueView, itemIndex, t } from "./view";

const item = (extra: Partial<MenuItem>): MenuItem => ({
  id: "i1",
  slug: "ezogelin",
  kind: "dish",
  name: { tr: "Ezogelin çorbası", ar: "شوربة إيزوجلين" },
  description: { tr: "Mercimek, bulgur ve pirinç." },
  ingredients: { tr: "Kırmızı mercimek, bulgur" },
  allergens: ["gluten"],
  mayContain: [],
  diets: ["vegetarian"],
  spiceLevel: 1,
  energyKcal: 230,
  nutrition: null,
  portionG: 300,
  volumeMl: null,
  origin: null,
  attributes: {},
  alcohol: null,
  imageId: null,
  prices: [
    { id: "p1", unit: "portion", amountMinor: 12000, label: null, isDefault: true },
    { id: "p2", unit: "half", amountMinor: 8000, label: null, isDefault: false },
  ],
  optionGroups: [],
  optionRules: [],
  availability: null,
  pairings: [],
  suggestions: [],
  components: [],
  courses: [],
  ...extra,
});

const menu: VenueMenu = {
  menus: [
    {
      id: "m1",
      slug: "gun",
      kind: "all_day",
      name: { tr: "Günün yemekleri", ar: "أطباق اليوم" },
      schedule: null,
      outsideWindow: "dim",
      access: "public",
      contexts: [],
      sections: [
        {
          id: "s1",
          name: { tr: "Çorbalar" },
          description: null,
          layoutHint: null,
          items: [{ item: item({}), featured: true }],
          children: [],
        },
      ],
      daily: [],
    },
  ],
  items: [
    item({}),
    item({
      id: "i2",
      slug: "cortado",
      kind: "drink",
      name: { tr: "Cortado" },
      energyKcal: null,
      imageId: "img1",
    }),
  ],
};

const view = buildVenueView(
  {
    venue: {
      slug: "ornek",
      name: "Örnek Mekân",
      kind: "lokanta",
      mode: "demo",
      defaultLocale: "tr",
      locales: ["tr", "en", "ar"],
      timeZone: "Europe/Istanbul",
    },
    menu,
    stories: [
      {
        id: "st1",
        slug: "not",
        kind: "chef_note",
        collection: null,
        stop: null,
        title: { tr: "Ustanın notu" },
        summary: null,
        body: { tr: "## Başlık", ar: "## عنوان" },
        coverId: "img1",
        galleryIds: ["img1", "kayip"],
        itemIds: ["i1"],
      },
    ],
    media: {
      img1: {
        id: "img1",
        source: "unsplash",
        url: "https://images.unsplash.com/photo-1",
        width: 2400,
        height: 1600,
        alt: { tr: "Cam bardakta cortado" },
        focalX: 50,
        focalY: 40,
        photographer: "X",
        sourcePage: null,
        license: null,
      },
    },
  },
  "ar",
  { rtl: true },
);

describe("D-08: the view model a theme renders", () => {
  it("localizes every text for the page and marks the fallbacks (BR-MNU-003)", () => {
    const soup = itemIndex(view).get("i1")!;
    expect(soup.name).toEqual({ text: "شوربة إيزوجلين", lang: "ar", fallback: false });
    expect(soup.description).toEqual({
      text: "Mercimek, bulgur ve pirinç.",
      lang: "tr",
      fallback: true,
    });
    expect(view.menus[0]!.sections[0]!.name).toMatchObject({ text: "Çorbalar", lang: "tr" });
    expect(view.dir).toBe("rtl");
    expect(view.locale).toBe("ar");
  });

  it("writes prices with their unit; the compact row gets the default line (REQ-004)", () => {
    const soup = itemIndex(view).get("i1")!;
    expect(soup.prices.map((p) => [p.label, p.amount])).toEqual([
      [null, "120 ₺"],
      ["نصف", "80 ₺"],
    ]);
    expect(soup.defaultPrice?.id).toBe("p1");
  });

  it("flags missing product information and links photos with their size and alt text", () => {
    const cortado = itemIndex(view).get("i2")!;
    expect(cortado.infoGaps).toEqual(["energy"]);
    expect(cortado.image).toEqual({
      src: "https://images.unsplash.com/photo-1",
      width: 2400,
      height: 1600,
      alt: { text: "Cam bardakta cortado", lang: "tr", fallback: true },
      focalX: 50,
      focalY: 40,
    });
    expect(itemIndex(view).get("i1")!.image).toBeNull();
  });

  it("builds a Turkish-aware search key and keeps placements as ids", () => {
    expect(itemIndex(view).get("i1")!.searchKey).toContain("mercimek");
    expect(view.menus[0]!.sections[0]!.items).toEqual([{ itemId: "i1", featured: true }]);
  });

  it("stories: body in the page language when there is one; unknown gallery ids are dropped", () => {
    const story = view.stories[0]!;
    expect(story.body).toMatchObject({ text: "## عنوان", lang: "ar" });
    expect(story.title).toMatchObject({ text: "Ustanın notu", lang: "tr" });
    expect(story.cover?.src).toBe("https://images.unsplash.com/photo-1");
    expect(story.gallery).toHaveLength(1);
  });

  it("t() translates raw configurator data the same way", () => {
    expect(t({ tr: "Süt", en: "Milk" }, "ar", "en")).toMatchObject({ text: "Milk", lang: "en" });
  });
});
