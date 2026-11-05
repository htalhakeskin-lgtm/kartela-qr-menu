import type { Translated } from "../i18n/fallback";
import type { ItemAvailability } from "./availability";
import type { ConfigGroup, ConfigRule } from "./configurator";
import type { PriceLine } from "./price";
import type { MenuSchedule, OutsideWindow } from "./schedule";
import type { Allergen, Diet, ItemKind, MenuKind, SpiceLevel, StoryKind } from "./vocabulary";

/**
 * The menu engine's read model (plan §9, ADR-0003): what the server hands a theme for one venue.
 * Headless: no layout, no language chosen yet (themes call localize() per field), no clock
 * applied (menuStatus() runs in the browser, ADR-0005).
 */

export type Nutrition = {
  fatG?: number;
  saturatedFatG?: number;
  carbsG?: number;
  sugarG?: number;
  proteinG?: number;
  saltG?: number;
};

/** Alcoholic drinks (BR-YSL-004): brand and strength in tenths of a percent (45 = 4,5 %). */
export type Alcohol = { brand: string; abvTenths: number };

export type MenuPrice = PriceLine & { id: string };

export type MenuItem = {
  id: string;
  slug: string;
  kind: ItemKind;
  name: Translated;
  description: Translated | null;
  ingredients: Translated | null;
  allergens: Allergen[];
  mayContain: Allergen[];
  diets: Diet[];
  spiceLevel: SpiceLevel;
  energyKcal: number | null;
  nutrition: Nutrition | null;
  portionG: number | null;
  volumeMl: number | null;
  origin: Translated | null;
  attributes: Record<string, unknown>;
  alcohol: Alcohol | null;
  imageId: string | null;
  /** Sorted; exactly one isDefault (BR-FYT-002 is checked when content is written). */
  prices: MenuPrice[];
  /** Configurator groups with this product's limits (D-05); empty = plain product. */
  optionGroups: ConfigGroup[];
  /** Compatibility rules that concern this product's options. */
  optionRules: ConfigRule[];
  /** Null = always available (D-06, BR-MST-001…004). */
  availability: ItemAvailability | null;
  /** "Yanına" pairings and "you may also like" suggestions, by product id (BR-ILS-001). */
  pairings: { itemId: string; note: Translated | null }[];
  suggestions: string[];
  /** Contents of a set product. */
  components: { itemId: string; qty: number }[];
  /** Ordered courses of a tasting menu; a course may point at a product. */
  courses: {
    no: number;
    title: Translated;
    itemId: string | null;
    description: Translated | null;
  }[];
};

export type MenuPlacement = { item: MenuItem; featured: boolean };

export type MenuSection = {
  id: string;
  name: Translated;
  description: Translated | null;
  layoutHint: string | null;
  items: MenuPlacement[];
  /** Sub-sections (one level). */
  children: MenuSection[];
};

export type Menu = {
  id: string;
  slug: string;
  kind: MenuKind;
  name: Translated;
  schedule: MenuSchedule | null;
  outsideWindow: OutsideWindow;
  /** "password": the static page leaves the content out (BR-GZL-001, D-37). */
  access: "public" | "password";
  contexts: string[];
  sections: MenuSection[];
  /** Menu of the day entries by business date (BR-MST-005); empty for other menus. */
  daily: { onDate: string; itemId: string }[];
};

export type VenueMenu = {
  menus: Menu[];
  /** Every published product once, menu order first (search, product pages, print lists). */
  items: MenuItem[];
};

/** Opening windows per ISO weekday (1 = Monday), "HH:MM" in the venue's time zone. */
export type OpeningHours = Partial<
  Record<1 | 2 | 3 | 4 | 5 | 6 | 7, { open: string; close: string }[]>
>;

/** The venue's information (venue_settings, D-11), as stored. */
export type VenueInfo = {
  description: Translated | null;
  address: string | null;
  mapUrl: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  hours: OpeningHours;
  wifi: { network: string; password: string | null } | null;
  faq: { q: Translated; a: Translated }[];
  allergenStatement: Translated | null;
};

/** A registered image (20-gorsel-kalite §5.4): served from its CDN, never larger than it is. */
export type MediaAsset = {
  id: string;
  source: "unsplash" | "pexels" | "upload";
  url: string;
  width: number;
  height: number;
  alt: Translated;
  focalX: number;
  focalY: number;
  photographer: string | null;
  sourcePage: string | null;
  license: string | null;
};

/** A Keşfet story (D-07, REQ-010); `stop` orders the stops of a collection. */
export type Story = {
  id: string;
  slug: string;
  kind: StoryKind;
  collection: string | null;
  stop: number | null;
  title: Translated;
  summary: Translated | null;
  /** Markdown per language, rendered on the server only (K-34). */
  body: Translated;
  coverId: string | null;
  galleryIds: string[];
  itemIds: string[];
};
