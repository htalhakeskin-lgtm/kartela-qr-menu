import type { Translated } from "../i18n/fallback";

/**
 * Kind-specific facts of a product (D-14), stored in items.attributes. The content schema
 * (content.ts) validates them per kind; themes read them through these Zod-free helpers, so the
 * schema never reaches a menu bundle.
 *
 * - bean: a coffee sold by the bag (Çekirdekler): region, altitude, process, notes, roast.
 * - drink (optional `brew`): the recipe the menu's data line shows ("15 g · 250 ml · 93 °C · 3:15").
 */

export const BEAN_PROCESSES = ["washed", "natural", "honey", "anaerobic"] as const;
export type BeanProcess = (typeof BEAN_PROCESSES)[number];

export const BEAN_ROASTS = ["filter", "espresso", "omni"] as const;
export type BeanRoast = (typeof BEAN_ROASTS)[number];

export type BeanAttributes = {
  /** "Guji, Oromia" — place names, not translated. */
  region: string;
  /** Metres above sea level; a range, or min = max for a single farm. */
  altitude: { min: number; max: number };
  process: BeanProcess;
  varieties: string[];
  producer?: string;
  /** Tasting notes, two to five, shown as chips. */
  notes: Translated[];
  roast: BeanRoast;
  /** Bag weight in grams. */
  weightG: number;
};

export const BREW_METHODS = [
  "v60",
  "chemex",
  "aeropress",
  "batch",
  "espresso",
  "cold_brew",
] as const;
export type BrewMethod = (typeof BREW_METHODS)[number];

export type BrewAttributes = {
  method: BrewMethod;
  doseG?: number;
  /** Water for filter methods, yield for espresso. */
  waterMl?: number;
  yieldG?: number;
  tempC?: number;
  timeS?: number;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** The bean facts of a product, or null when it has none (the content schema made them valid). */
export function beanAttributes(attributes: Record<string, unknown>): BeanAttributes | null {
  return typeof attributes.region === "string" && isRecord(attributes.altitude)
    ? (attributes as unknown as BeanAttributes)
    : null;
}

/** The brew recipe of a drink, or null. */
export function brewAttributes(attributes: Record<string, unknown>): BrewAttributes | null {
  const brew = attributes.brew;
  return isRecord(brew) && typeof brew.method === "string"
    ? (brew as unknown as BrewAttributes)
    : null;
}

/** 195 → "3:15" (brew time). */
export function brewTime(seconds: number): string {
  return `${String(Math.floor(seconds / 60))}:${String(seconds % 60).padStart(2, "0")}`;
}
