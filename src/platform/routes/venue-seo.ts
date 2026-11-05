import type { Metadata } from "next";

import { uiText } from "../i18n/ui";
import type { ItemView, SectionView, VenueView } from "../menu/view";
import type { Diet } from "../menu/vocabulary";
import { localeHomePath, venueOrigin } from "../tenant/registry";
import type { Locale, VenueKind, VenueRecord } from "../tenant/registry-schema";

/**
 * Venue page metadata and structured data (plan §15, REQ-015, D-11). Every venue is a site of its
 * own: metadataBase and canonical on its primary domain, an alternate per language plus
 * x-default, its own share image (opengraph-image in the theme tree), noindex while in demo mode
 * (K-06). Path-prefixed previews (/m/…) also send X-Robots-Tag: noindex (ADR-0002).
 */
export type VenuePage = "menu" | "kesfet" | "bilgi";

const PAGE_SEGMENT: Record<VenuePage, string> = { menu: "", kesfet: "/kesfet", bilgi: "/bilgi" };
const OG_LOCALE: Record<Locale, string> = {
  tr: "tr_TR",
  en: "en_US",
  ar: "ar_SA",
  ru: "ru_RU",
  de: "de_DE",
};
const TITLE_MAX = 60;

/** Path of a page in a language on the venue's own domain: "/", "/kesfet", "/en/bilgi". */
export function venuePath(venue: VenueRecord, locale: Locale, page: VenuePage): string {
  const home = localeHomePath(venue, locale);
  const segment = PAGE_SEGMENT[page];
  return home === "/" ? segment || "/" : `${home}${segment}`;
}

/** "Menü · Rakım Kahve Kavurma"; just the venue's name when the pair would pass 60 characters. */
export function venueTitle(venue: VenueRecord, locale: Locale, page: VenuePage): string {
  const ui = uiText(locale);
  const label = page === "menu" ? ui.menu : page === "kesfet" ? ui.explore : ui.info;
  const title = `${label} · ${venue.name}`;
  return title.length <= TITLE_MAX ? title : venue.name.slice(0, TITLE_MAX);
}

export function venueMetadata({
  venue,
  locale,
  page,
  description,
}: {
  venue: VenueRecord;
  locale: Locale;
  page: VenuePage;
  description: string | null;
}): Metadata {
  const title = venueTitle(venue, locale, page);
  const path = venuePath(venue, locale, page);
  const index = venue.mode === "live";
  const languages: Record<string, string> = Object.fromEntries(
    venue.locales.map((other) => [other, venuePath(venue, other, page)]),
  );
  languages["x-default"] = venuePath(venue, venue.defaultLocale, page);
  // A page's openGraph replaces its parent's, file-based image included (Next.js merges metadata
  // shallowly), so every page names the theme tree's share image itself (opengraph-image.tsx).
  const image = {
    url: venueShareImagePath(venue, locale),
    width: 1200,
    height: 630,
    alt: venue.name,
  };
  return {
    metadataBase: new URL(venueOrigin(venue)),
    title,
    description: description ?? undefined,
    alternates: { canonical: path, languages },
    robots: { index, follow: index },
    openGraph: {
      type: "website",
      siteName: venue.name,
      locale: OG_LOCALE[locale],
      url: path,
      title,
      description: description ?? undefined,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: description ?? undefined,
      images: [image],
    },
  };
}

/** The share image route of a venue's theme tree; the host rewrites let this path through. */
export function venueShareImagePath(venue: VenueRecord, locale: Locale): string {
  return `/tema-${venue.theme}/${venue.slug}/${locale}/opengraph-image`;
}

// ── Structured data ─────────────────────────────────────────────────────────────────────────
const BUSINESS_TYPE: Partial<Record<VenueKind, string>> = {
  coffee: "CafeOrCoffeeShop",
  breakfast: "CafeOrCoffeeShop",
  bakery: "Bakery",
  cocktail_bar: "BarOrPub",
  meyhane: "BarOrPub",
  beach_bar: "BarOrPub",
};

const DIET_SCHEMA: Record<Diet, string> = {
  vegan: "https://schema.org/VeganDiet",
  vegetarian: "https://schema.org/VegetarianDiet",
  gluten_free: "https://schema.org/GlutenFreeDiet",
  lactose_free: "https://schema.org/LowLactoseDiet",
  halal: "https://schema.org/HalalDiet",
};

/** 12050 kuruş → "120.50" (schema.org wants a decimal string); integer arithmetic only. */
export function schemaPrice(minor: number): string {
  return `${String(Math.trunc(minor / 100))}.${String(minor % 100).padStart(2, "0")}`;
}

function menuItem(item: ItemView): Record<string, unknown> {
  return {
    "@type": "MenuItem",
    name: item.name.text,
    ...(item.description ? { description: item.description.text } : {}),
    ...(item.defaultPrice
      ? {
          offers: {
            "@type": "Offer",
            price: schemaPrice(item.defaultPrice.amountMinor),
            priceCurrency: "TRY",
          },
        }
      : {}),
    ...(item.diets.length > 0
      ? { suitableForDiet: item.diets.map((diet) => DIET_SCHEMA[diet]) }
      : {}),
  };
}

function menuSection(section: SectionView, items: Map<string, ItemView>): Record<string, unknown> {
  return {
    "@type": "MenuSection",
    name: section.name.text,
    hasMenuItem: section.items.flatMap(({ itemId }) => {
      const item = items.get(itemId);
      return item ? [menuItem(item)] : [];
    }),
    ...(section.children.length > 0
      ? { hasMenuSection: section.children.map((child) => menuSection(child, items)) }
      : {}),
  };
}

const WEEKDAY_SCHEMA = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

/**
 * The venue as a schema.org business: the menu on the quick menu page, address and hours on the
 * information page. Only facts the page shows (09-seo); no reviews or ratings (KURALLAR D).
 */
export function venueJsonLd(
  view: VenueView,
  venue: VenueRecord,
  page: VenuePage,
): Record<string, unknown> {
  const items = new Map(view.items.map((item) => [item.id, item]));
  const base: Record<string, unknown> = {
    "@type": BUSINESS_TYPE[venue.kind] ?? "Restaurant",
    name: venue.name,
    url: new URL(venuePath(venue, view.locale, "menu"), venueOrigin(venue)).toString(),
    ...(view.info?.phone ? { telephone: view.info.phone } : {}),
    ...(view.info?.address
      ? {
          address: {
            "@type": "PostalAddress",
            streetAddress: view.info.address,
            addressCountry: "TR",
          },
        }
      : {}),
    priceRange: "₺₺",
  };
  if (page === "menu") {
    base.hasMenu = view.menus
      .filter((menu) => menu.access === "public" && menu.sections.length > 0)
      .map((menu) => ({
        "@type": "Menu",
        name: menu.name.text,
        hasMenuSection: menu.sections.map((section) => menuSection(section, items)),
      }));
  }
  if (page === "bilgi" && view.info) {
    base.openingHoursSpecification = Object.entries(view.info.hours).flatMap(([day, windows]) =>
      windows.map((window) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: `https://schema.org/${WEEKDAY_SCHEMA[Number(day) - 1] ?? "Monday"}`,
        opens: window.open,
        closes: window.close,
      })),
    );
  }
  return base;
}
