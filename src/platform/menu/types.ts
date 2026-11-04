import type { Translated } from "../i18n/fallback";
import type { PriceLine } from "./price";
import type { MenuSchedule, OutsideWindow } from "./schedule";
import type { Allergen, Diet, ItemKind, MenuKind, SpiceLevel } from "./vocabulary";

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
};

export type VenueMenu = {
  menus: Menu[];
  /** Every published product once, menu order first (search, product pages, print lists). */
  items: MenuItem[];
};
