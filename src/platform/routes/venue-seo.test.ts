import { describe, expect, it } from "vitest";

import type { MenuItem, VenueMenu } from "../menu/types";
import { buildVenueView } from "../menu/view";
import { parseRegistry, type VenueRecordInput } from "../tenant/registry-schema";
import {
  schemaPrice,
  venueJsonLd,
  venueMetadata,
  venuePath,
  venueShareImagePath,
  venueTitle,
} from "./venue-seo";

const record = (extra: Partial<VenueRecordInput> = {}) =>
  parseRegistry([
    {
      slug: "deneme",
      name: "Deneme Lokantası",
      kind: "lokanta",
      theme: "sade",
      locales: ["tr", "en", "ar"],
      defaultLocale: "tr",
      domains: ["deneme.vercel.app"],
      mode: "demo",
      ...extra,
    },
  ])[0]!;

const item = (extra: Partial<MenuItem>): MenuItem => ({
  id: "i1",
  slug: "ezogelin",
  kind: "dish",
  name: { tr: "Ezogelin çorbası", en: "Ezogelin soup" },
  description: { tr: "Mercimek, bulgur ve pirinç." },
  ingredients: null,
  allergens: [],
  mayContain: [],
  diets: ["vegetarian"],
  spiceLevel: 0,
  energyKcal: null,
  nutrition: null,
  portionG: null,
  volumeMl: null,
  origin: null,
  attributes: {},
  alcohol: null,
  imageId: null,
  prices: [{ id: "p1", unit: "portion", amountMinor: 12050, label: null, isDefault: true }],
  optionGroups: [],
  optionRules: [],
  availability: null,
  pairings: [],
  suggestions: [],
  components: [],
  courses: [],
  ...extra,
});

const section = (id: string, itemId: string) => ({
  id,
  name: { tr: "Çorbalar", en: "Soups" },
  description: null,
  layoutHint: null,
  items: [{ item: item({ id: itemId }), featured: false }],
  children: [],
});

const menu: VenueMenu = {
  menus: [
    {
      id: "m1",
      slug: "gun",
      kind: "all_day",
      name: { tr: "Günün yemekleri", en: "Today's dishes" },
      schedule: null,
      outsideWindow: "dim",
      access: "public",
      contexts: [],
      sections: [section("s1", "i1")],
      daily: [],
    },
    {
      id: "m2",
      slug: "ozel",
      kind: "all_day",
      name: { tr: "Özel davet" },
      schedule: null,
      outsideWindow: "dim",
      access: "password",
      contexts: [],
      sections: [section("s2", "i1")],
      daily: [],
    },
  ],
  items: [item({})],
};

const view = (locale: "tr" | "en") =>
  buildVenueView(
    {
      venue: {
        slug: "deneme",
        name: "Deneme Lokantası",
        kind: "lokanta",
        mode: "demo",
        defaultLocale: "tr",
        locales: ["tr", "en", "ar"],
        timeZone: "Europe/Istanbul",
      },
      menu,
      stories: [],
      media: {},
      info: {
        description: { tr: "Sirkeci'de esnaf lokantası." },
        address: "Örnek Sokak No: 1, Fatih / İstanbul",
        mapUrl: null,
        phone: "+905423115888",
        whatsapp: null,
        email: null,
        hours: { 1: [{ open: "07:00", close: "21:00" }], 6: [{ open: "08:00", close: "16:00" }] },
        wifi: null,
        faq: [],
        allergenStatement: null,
      },
    },
    locale,
    { rtl: false },
  );

describe("D-11: venue page addresses and titles", () => {
  it("the default language lives at the root, the others under their prefix", () => {
    const venue = record();
    expect(venuePath(venue, "tr", "menu")).toBe("/");
    expect(venuePath(venue, "tr", "bilgi")).toBe("/bilgi");
    expect(venuePath(venue, "en", "menu")).toBe("/en");
    expect(venuePath(venue, "ar", "kesfet")).toBe("/ar/kesfet");
  });

  it("titles read '{page} · {venue}' and fall back to the name past 60 characters", () => {
    expect(venueTitle(record(), "tr", "menu")).toBe("Menü · Deneme Lokantası");
    expect(venueTitle(record(), "en", "bilgi")).toBe("Info · Deneme Lokantası");
    const long = record({ name: "Çok Uzun Adlı Bir Esnaf Lokantası ve Ocakbaşı Kebapçısı Moda" });
    const title = venueTitle(long, "tr", "kesfet");
    expect(title).toBe(long.name);
    expect(title.length).toBeLessThanOrEqual(60);
  });
});

describe("D-11: venue metadata (REQ-015)", () => {
  it("canonical on the venue's own domain, one alternate per language plus x-default", () => {
    const metadata = venueMetadata({
      venue: record(),
      locale: "en",
      page: "bilgi",
      description: "A lokanta.",
    });
    expect(metadata.metadataBase?.toString()).toBe("https://deneme.vercel.app/");
    expect(metadata.alternates?.canonical).toBe("/en/bilgi");
    expect(metadata.alternates?.languages).toEqual({
      tr: "/bilgi",
      en: "/en/bilgi",
      ar: "/ar/bilgi",
      "x-default": "/bilgi",
    });
  });

  it("demo venues are noindex, live ones are indexed (K-06)", () => {
    const demo = venueMetadata({ venue: record(), locale: "tr", page: "menu", description: null });
    expect(demo.robots).toEqual({ index: false, follow: false });
    const live = venueMetadata({
      venue: record({ mode: "live" }),
      locale: "tr",
      page: "menu",
      description: null,
    });
    expect(live.robots).toEqual({ index: true, follow: true });
  });

  it("every page names its theme tree's share image, in Open Graph and for X", () => {
    const venue = record();
    const metadata = venueMetadata({ venue, locale: "ar", page: "kesfet", description: null });
    const path = venueShareImagePath(venue, "ar");
    expect(path).toBe("/tema-sade/deneme/ar/opengraph-image");
    expect(metadata.openGraph).toMatchObject({
      locale: "ar_SA",
      siteName: "Deneme Lokantası",
      url: "/ar/kesfet",
      images: [{ url: path, width: 1200, height: 630 }],
    });
    expect(metadata.twitter).toMatchObject({ images: [{ url: path }] });
  });
});

describe("D-11: structured data (09-seo)", () => {
  it("prices are decimal strings computed in integers", () => {
    expect(schemaPrice(12050)).toBe("120.50");
    expect(schemaPrice(12000)).toBe("120.00");
    expect(schemaPrice(5)).toBe("0.05");
  });

  it("the quick menu carries the business and its public menus, in the page language", () => {
    const data = venueJsonLd(view("en"), record(), "menu");
    expect(data["@type"]).toBe("Restaurant");
    expect(data.url).toBe("https://deneme.vercel.app/en");
    expect(data.telephone).toBe("+905423115888");
    expect(data).not.toHaveProperty("openingHoursSpecification");
    const menus = data.hasMenu as { name: string; hasMenuSection: unknown[] }[];
    // The password-protected menu is not public (UC-09): it stays out of the page's data.
    expect(menus.map((entry) => entry.name)).toEqual(["Today's dishes"]);
    expect(menus[0]!.hasMenuSection).toEqual([
      {
        "@type": "MenuSection",
        name: "Soups",
        hasMenuItem: [
          {
            "@type": "MenuItem",
            name: "Ezogelin soup",
            description: "Mercimek, bulgur ve pirinç.",
            offers: { "@type": "Offer", price: "120.50", priceCurrency: "TRY" },
            suitableForDiet: ["https://schema.org/VegetarianDiet"],
          },
        ],
      },
    ]);
  });

  it("the information page carries address and opening hours, never ratings", () => {
    const data = venueJsonLd(view("tr"), record({ kind: "coffee" }), "bilgi");
    expect(data["@type"]).toBe("CafeOrCoffeeShop");
    expect(data).not.toHaveProperty("hasMenu");
    expect(data.address).toMatchObject({ streetAddress: "Örnek Sokak No: 1, Fatih / İstanbul" });
    expect(data.openingHoursSpecification).toEqual([
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: "https://schema.org/Monday",
        opens: "07:00",
        closes: "21:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: "https://schema.org/Saturday",
        opens: "08:00",
        closes: "16:00",
      },
    ]);
    expect(JSON.stringify(data)).not.toMatch(/Review|AggregateRating/);
  });
});
