import type { Translated } from "../i18n/fallback";
import type { ItemKind } from "./vocabulary";

/**
 * Missing product information (BR-YSL-005, REQ-005, plan K-24). Ingredients and energy are
 * first-class fields; the panel lists products where they are missing, and the item panel shows
 * "bilgi için personele sorun" instead of an empty field.
 *
 * - ingredients: every product a guest eats or drinks (dish, drink, set) and coffee beans
 * - energy: dish, drink, set (a tasting menu's courses carry their own; beans are not served)
 */
export type InfoGap = "ingredients" | "energy";

const NEEDS_INGREDIENTS: readonly ItemKind[] = ["dish", "drink", "set", "bean"];
const NEEDS_ENERGY: readonly ItemKind[] = ["dish", "drink", "set"];

export type InfoFields = {
  kind: ItemKind;
  ingredients: Translated | null;
  energyKcal: number | null;
};

export function infoGaps(item: InfoFields): InfoGap[] {
  const gaps: InfoGap[] = [];
  if (NEEDS_INGREDIENTS.includes(item.kind) && !item.ingredients?.tr.trim()) {
    gaps.push("ingredients");
  }
  if (NEEDS_ENERGY.includes(item.kind) && item.energyKcal === null) gaps.push("energy");
  return gaps;
}
