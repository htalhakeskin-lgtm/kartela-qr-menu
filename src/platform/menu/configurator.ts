import type { Translated } from "../i18n/fallback";
import type { MenuPrice } from "./types";
import type { Allergen, Diet } from "./vocabulary";

/**
 * Product configurator (REQ-007, BR-SCN-001…003, D-05): option groups with min / max, price
 * deltas, compatibility rules, the live total. Pure and small: the theme's configurator island
 * (Rakım's recipe card, D-16) runs it in the browser on every tap; it returns codes, the theme
 * writes the words.
 */

export type ConfigOption = {
  id: string;
  key: string;
  name: Translated;
  /** May be negative (e.g. "no milk −10 ₺"); the total never goes below zero (BR-SCN-002). */
  priceDeltaMinor: number;
  allergens: Allergen[];
  /** Diets the product loses with this option (whipped cream removes vegan). */
  dietsRemoved: Diet[];
  isDefault: boolean;
  available: boolean;
};

export type ConfigGroup = {
  id: string;
  key: string;
  name: Translated;
  /** Effective limits for this product (item overrides applied). min ≥ 1 = required. */
  min: number;
  max: number;
  /** Price line ids this group applies to; null = every line (e.g. extra shot only for "Büyük"). */
  appliesTo: string[] | null;
  options: ConfigOption[];
};

/** "When `whenOptionId` is chosen, the target cannot be / must be chosen" (BR-SCN-003). */
export type ConfigRule = {
  whenOptionId: string;
  effect: "excludes" | "requires";
  targetOptionId: string | null;
  targetGroupId: string | null;
  message: Translated | null;
};

export type Configurable = {
  prices: MenuPrice[];
  optionGroups: ConfigGroup[];
  optionRules: ConfigRule[];
  allergens: Allergen[];
  diets: Diet[];
};

export type Selection = { priceId: string; optionIds: string[] };

export type OptionState = {
  option: ConfigOption;
  selected: boolean;
  /** Why it cannot be chosen now; null = can be chosen. */
  blocked:
    | null
    | { reason: "unavailable" }
    | { reason: "excluded"; by: string; message: Translated | null }
    | { reason: "group_full"; max: number };
};

export type ConfigProblem =
  | { code: "too_few"; groupId: string; min: number } // BR-SCN-001
  | { code: "too_many"; groupId: string; max: number } // BR-SCN-001
  | { code: "conflict"; optionId: string; otherId: string; message: Translated | null } // BR-SCN-003
  | { code: "requires"; optionId: string; rule: ConfigRule } // BR-SCN-003
  /** A chosen option ran out after it was chosen (sold out in the panel). */
  | { code: "unavailable"; optionId: string };

export type Evaluation = {
  price: MenuPrice;
  groups: { group: ConfigGroup; options: OptionState[] }[];
  problems: ConfigProblem[];
  /** Price line + option deltas, never below zero (BR-SCN-002). */
  totalMinor: number;
  allergens: Allergen[];
  diets: Diet[];
  /** Chosen options in group order, for the summary line ("Çift shot · yulaf · 12 oz"). */
  chosen: ConfigOption[];
  /** True when the selection can go to Seçtiklerim. */
  complete: boolean;
};

function priceOf(item: Configurable, priceId: string): MenuPrice {
  const price =
    item.prices.find((line) => line.id === priceId) ??
    item.prices.find((line) => line.isDefault) ??
    item.prices[0];
  if (!price) throw new Error("A configurable product needs at least one price line");
  return price;
}

const appliesTo = (group: ConfigGroup, priceId: string) =>
  group.appliesTo === null || group.appliesTo.includes(priceId);

/** Pairs that cannot be chosen together, both directions: A excludes B ⇒ B blocks A too. */
function exclusions(
  item: Configurable,
): Map<string, { other: string; message: Translated | null }[]> {
  const pairs = new Map<string, { other: string; message: Translated | null }[]>();
  const add = (a: string, b: string, message: Translated | null) => {
    pairs.set(a, [...(pairs.get(a) ?? []), { other: b, message }]);
  };
  for (const rule of item.optionRules) {
    if (rule.effect !== "excludes") continue;
    const targets = rule.targetOptionId
      ? [rule.targetOptionId]
      : (item.optionGroups
          .find((group) => group.id === rule.targetGroupId)
          ?.options.map((option) => option.id) ?? []);
    for (const target of targets) {
      add(rule.whenOptionId, target, rule.message);
      add(target, rule.whenOptionId, rule.message);
    }
  }
  return pairs;
}

export function evaluate(item: Configurable, selection: Selection): Evaluation {
  const price = priceOf(item, selection.priceId);
  const active = item.optionGroups.filter((group) => appliesTo(group, price.id));
  const activeIds = new Set(active.flatMap((group) => group.options.map((option) => option.id)));
  const chosenIds = new Set(selection.optionIds.filter((id) => activeIds.has(id)));
  const excluded = exclusions(item);
  const problems: ConfigProblem[] = [];

  const groups = active.map((group) => {
    const count = group.options.filter((option) => chosenIds.has(option.id)).length;
    if (count < group.min) problems.push({ code: "too_few", groupId: group.id, min: group.min });
    if (count > group.max) problems.push({ code: "too_many", groupId: group.id, max: group.max });
    const options = group.options.map((option): OptionState => {
      const selected = chosenIds.has(option.id);
      const conflict = (excluded.get(option.id) ?? []).find(({ other }) => chosenIds.has(other));
      let blocked: OptionState["blocked"] = null;
      if (!option.available) blocked = { reason: "unavailable" };
      else if (conflict)
        blocked = { reason: "excluded", by: conflict.other, message: conflict.message };
      else if (!selected && group.max > 1 && count >= group.max) {
        blocked = { reason: "group_full", max: group.max };
      }
      return { option, selected, blocked };
    });
    return { group, options };
  });

  const chosen = groups.flatMap(({ options }) =>
    options.filter((state) => state.selected).map((state) => state.option),
  );

  for (const option of chosen) {
    for (const { other, message } of excluded.get(option.id) ?? []) {
      // Report each conflicting pair once.
      if (chosenIds.has(other) && option.id < other) {
        problems.push({ code: "conflict", optionId: option.id, otherId: other, message });
      }
    }
    if (!option.available) problems.push({ code: "unavailable", optionId: option.id });
  }
  for (const rule of item.optionRules) {
    if (rule.effect !== "requires" || !chosenIds.has(rule.whenOptionId)) continue;
    const met = rule.targetOptionId
      ? chosenIds.has(rule.targetOptionId)
      : chosen.some((option) =>
          item.optionGroups
            .find((group) => group.id === rule.targetGroupId)
            ?.options.some((candidate) => candidate.id === option.id),
        );
    if (!met) problems.push({ code: "requires", optionId: rule.whenOptionId, rule });
  }

  const deltas = chosen.reduce((sum, option) => sum + option.priceDeltaMinor, 0);
  const removed = new Set(chosen.flatMap((option) => option.dietsRemoved));
  return {
    price,
    groups,
    problems,
    totalMinor: Math.max(0, price.amountMinor + deltas),
    allergens: [...new Set([...item.allergens, ...chosen.flatMap((option) => option.allergens)])],
    diets: item.diets.filter((diet) => !removed.has(diet)),
    chosen,
    complete: problems.length === 0,
  };
}

/** The starting selection: the default price line and each applicable group's default options. */
export function initialSelection(item: Configurable): Selection {
  const price = priceOf(item, "");
  return { priceId: price.id, optionIds: defaultsFor(item, price.id, new Set()) };
}

function defaultsFor(item: Configurable, priceId: string, keep: Set<string>): string[] {
  const ids: string[] = [];
  for (const group of item.optionGroups.filter((candidate) => appliesTo(candidate, priceId))) {
    const kept = group.options.filter((option) => keep.has(option.id));
    const picked =
      kept.length > 0
        ? kept
        : group.options
            .filter((option) => option.isDefault && option.available)
            .slice(0, group.max);
    ids.push(...picked.map((option) => option.id));
  }
  return ids;
}

/**
 * One tap on an option. A single-choice group (max 1) swaps its choice; a blocked option, or a
 * full multi-choice group, leaves the selection as it is (the theme shows the reason).
 */
export function toggle(item: Configurable, selection: Selection, optionId: string): Selection {
  const evaluation = evaluate(item, selection);
  for (const { group, options } of evaluation.groups) {
    const state = options.find((candidate) => candidate.option.id === optionId);
    if (!state) continue;
    if (state.selected) {
      return { ...selection, optionIds: selection.optionIds.filter((id) => id !== optionId) };
    }
    const swapping = group.max === 1;
    if (state.blocked && !(swapping && state.blocked.reason === "group_full")) return selection;
    const others = swapping
      ? selection.optionIds.filter((id) => !group.options.some((option) => option.id === id))
      : selection.optionIds;
    return { ...selection, optionIds: [...others, optionId] };
  }
  return selection;
}

/** Switches the price line (size): drops groups that no longer apply, adds defaults for new ones. */
export function choosePrice(item: Configurable, selection: Selection, priceId: string): Selection {
  return { priceId, optionIds: defaultsFor(item, priceId, new Set(selection.optionIds)) };
}
