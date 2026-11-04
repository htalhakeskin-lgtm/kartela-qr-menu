import { formatMoney } from "../../lib/format";
import { localizeOptional, type Translated } from "../i18n/fallback";
import type { Locale } from "../tenant/registry-schema";

/**
 * Price lines of a product (REQ-004, BR-FYT-001, BR-FYT-002). Amounts are integer kuruş, VAT
 * included (the "Fiyatlara KDV dahildir" note is part of every menu page, D-11).
 *
 * - portion: the plain price; shown as the amount alone unless it has a label
 * - size: a named size or variant (label required: "Küçük", "Büyük", "Tek shot")
 * - half: half portion · per_100g / per_kg: weighed products · glass / bottle · piece
 */
export const PRICE_UNITS = [
  "portion",
  "size",
  "half",
  "per_100g",
  "per_kg",
  "glass",
  "bottle",
  "piece",
] as const;
export type PriceUnit = (typeof PRICE_UNITS)[number];

export type PriceLine = {
  unit: PriceUnit;
  amountMinor: number;
  label?: Translated | null;
  isDefault: boolean;
};

/** Words for the unit when the line has no label of its own. */
const UNIT_WORDS: Record<Exclude<PriceUnit, "portion" | "size">, Translated> = {
  half: { tr: "Yarım", en: "Half", ar: "نصف", ru: "Половина", de: "Halbe Portion" },
  per_100g: { tr: "100 g", en: "100 g", ar: "100 غ", ru: "100 г", de: "100 g" },
  per_kg: { tr: "1 kg", en: "1 kg", ar: "1 كغ", ru: "1 кг", de: "1 kg" },
  glass: { tr: "Kadeh", en: "Glass", ar: "كأس", ru: "Бокал", de: "Glas" },
  bottle: { tr: "Şişe", en: "Bottle", ar: "زجاجة", ru: "Бутылка", de: "Flasche" },
  piece: { tr: "Adet", en: "Piece", ar: "قطعة", ru: "Шт.", de: "Stück" },
};

export type PriceText = { label: string | null; amount: string };

/**
 * "100 g · 240 ₺" as its two parts, so a theme can lay them out (label muted, amount aligned).
 * Amounts use the Turkish format on every page: the currency is the lira everywhere.
 */
export function priceText(
  line: PriceLine,
  locale: Locale,
  defaultLocale: Locale = "tr",
): PriceText {
  const own = localizeOptional(line.label, locale, defaultLocale)?.text ?? null;
  const unit =
    line.unit === "portion" || line.unit === "size"
      ? null
      : (localizeOptional(UNIT_WORDS[line.unit], locale, defaultLocale)?.text ?? null);
  return { label: own ?? unit, amount: formatMoney(line.amountMinor, { decimals: "auto" }) };
}

export type PriceProblem =
  | "empty"
  | "negative_or_fraction"
  | "default_count"
  | "kg_and_100g" // BR-FYT-002
  | "size_without_label";

/** What is wrong with a product's price lines (used by the content schema and the panel). */
export function priceProblems(lines: readonly PriceLine[]): PriceProblem[] {
  const problems = new Set<PriceProblem>();
  if (lines.length === 0) problems.add("empty");
  if (lines.some((line) => !Number.isSafeInteger(line.amountMinor) || line.amountMinor < 0)) {
    problems.add("negative_or_fraction");
  }
  if (lines.length > 0 && lines.filter((line) => line.isDefault).length !== 1) {
    problems.add("default_count");
  }
  const units = new Set(lines.map((line) => line.unit));
  if (units.has("per_kg") && units.has("per_100g")) problems.add("kg_and_100g");
  if (lines.some((line) => line.unit === "size" && !line.label?.tr.trim())) {
    problems.add("size_without_label");
  }
  return [...problems];
}

/** The line a compact menu row shows: the default one. */
export function defaultPrice<T extends PriceLine>(lines: readonly T[]): T | undefined {
  return lines.find((line) => line.isDefault) ?? lines[0];
}
