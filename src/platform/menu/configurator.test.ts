import { describe, expect, it } from "vitest";

import {
  choosePrice,
  type ConfigGroup,
  type ConfigOption,
  type Configurable,
  evaluate,
  initialSelection,
  toggle,
} from "./configurator";
import type { MenuPrice } from "./types";

const option = (id: string, extra: Partial<ConfigOption> = {}): ConfigOption => ({
  id,
  key: id,
  name: { tr: id },
  priceDeltaMinor: 0,
  allergens: [],
  dietsRemoved: [],
  isDefault: false,
  available: true,
  ...extra,
});

const group = (
  id: string,
  min: number,
  max: number,
  options: ConfigOption[],
  appliesTo: string[] | null = null,
): ConfigGroup => ({
  id,
  key: id,
  name: { tr: id },
  min,
  max,
  appliesTo,
  options,
});

/** A latte: two sizes, milk (required), syrups (max 2), toppings, temperature, a large-only extra. */
const latte: Configurable<MenuPrice> = {
  prices: [
    { id: "kucuk", unit: "size", amountMinor: 24000, label: { tr: "8 oz" }, isDefault: true },
    { id: "buyuk", unit: "size", amountMinor: 29000, label: { tr: "12 oz" }, isDefault: false },
  ],
  allergens: ["milk"],
  diets: ["vegetarian", "gluten_free"],
  optionGroups: [
    group("sut", 1, 1, [
      option("inek", { isDefault: true }),
      option("yulaf", {
        priceDeltaMinor: 2500,
        allergens: ["gluten"],
        dietsRemoved: ["gluten_free"],
      }),
      option("sutsuz", { priceDeltaMinor: -1000 }),
    ]),
    group("surup", 0, 2, [
      option("vanilya", { priceDeltaMinor: 2000 }),
      option("karamel", { priceDeltaMinor: 2000 }),
      option("findik", { priceDeltaMinor: 2000, allergens: ["nuts"] }),
      option("tarcin", { priceDeltaMinor: 1500, available: false }),
    ]),
    group("ustu", 0, 1, [
      option("krema", { priceDeltaMinor: 1500 }),
      option("dondurma", { priceDeltaMinor: 4000 }),
    ]),
    group("sicaklik", 1, 1, [option("sicak", { isDefault: true }), option("buzlu")]),
    group("ekstra", 0, 1, [option("cift-shot", { priceDeltaMinor: 3500 })], ["buyuk"]),
  ],
  optionRules: [
    {
      whenOptionId: "yulaf",
      effect: "excludes",
      targetOptionId: "krema",
      targetGroupId: null,
      message: { tr: "Yulaf sütüyle krema eklenmez." },
    },
    {
      whenOptionId: "dondurma",
      effect: "requires",
      targetOptionId: "buzlu",
      targetGroupId: null,
      message: null,
    },
  ],
};

const state = (evaluation: ReturnType<typeof evaluate>, id: string) =>
  evaluation.groups.flatMap((g) => g.options).find((s) => s.option.id === id);

describe("REQ-007: the configurator", () => {
  it("starts with the default size and each group's default options", () => {
    const selection = initialSelection(latte);
    expect(selection).toEqual({ priceId: "kucuk", optionIds: ["inek", "sicak"] });
    const evaluation = evaluate(latte, selection);
    expect(evaluation.totalMinor).toBe(24000);
    expect(evaluation.complete).toBe(true);
    expect(evaluation.chosen.map((o) => o.id)).toEqual(["inek", "sicak"]);
  });

  it("BR-SCN-002: the total follows every choice; a negative delta never goes below zero", () => {
    let selection = initialSelection(latte);
    selection = toggle(latte, selection, "yulaf"); // single choice: swaps the milk
    expect(selection.optionIds).toEqual(["sicak", "yulaf"]);
    expect(evaluate(latte, selection).totalMinor).toBe(26500);
    selection = choosePrice(latte, selection, "buyuk");
    expect(evaluate(latte, selection).totalMinor).toBe(31500);
    selection = toggle(latte, selection, "sutsuz");
    expect(evaluate(latte, selection).totalMinor).toBe(28000);

    const cheap: Configurable<MenuPrice> = {
      ...latte,
      prices: [{ ...latte.prices[0]!, amountMinor: 500 }],
    };
    expect(evaluate(cheap, { priceId: "kucuk", optionIds: ["sutsuz", "sicak"] }).totalMinor).toBe(
      0,
    );
  });

  it("BR-SCN-001: a required group must be chosen before the product can be added", () => {
    const selection = toggle(latte, initialSelection(latte), "inek"); // deselect the only milk
    const evaluation = evaluate(latte, selection);
    expect(evaluation.problems).toContainEqual({ code: "too_few", groupId: "sut", min: 1 });
    expect(evaluation.complete).toBe(false);
  });

  it("BR-SCN-001: at the maximum, further choices are blocked and the tap changes nothing", () => {
    let selection = initialSelection(latte);
    selection = toggle(latte, selection, "vanilya");
    selection = toggle(latte, selection, "karamel");
    const evaluation = evaluate(latte, selection);
    expect(state(evaluation, "findik")?.blocked).toEqual({ reason: "group_full", max: 2 });
    expect(toggle(latte, selection, "findik")).toEqual(selection);
    expect(evaluation.totalMinor).toBe(28000);
  });

  it("BR-SCN-003: an incompatible option is blocked with its reason, in both directions", () => {
    const withOat = toggle(latte, initialSelection(latte), "yulaf");
    expect(state(evaluate(latte, withOat), "krema")?.blocked).toEqual({
      reason: "excluded",
      by: "yulaf",
      message: { tr: "Yulaf sütüyle krema eklenmez." },
    });
    expect(toggle(latte, withOat, "krema")).toEqual(withOat);

    const withCream = toggle(latte, initialSelection(latte), "krema");
    expect(state(evaluate(latte, withCream), "yulaf")?.blocked).toMatchObject({
      reason: "excluded",
      by: "krema",
    });
  });

  it("BR-SCN-003: an option that requires another is incomplete without it", () => {
    let selection = toggle(latte, initialSelection(latte), "dondurma");
    expect(evaluate(latte, selection).problems).toContainEqual(
      expect.objectContaining({ code: "requires", optionId: "dondurma" }),
    );
    selection = toggle(latte, selection, "buzlu");
    expect(evaluate(latte, selection).complete).toBe(true);
  });

  it("a group limited to one size appears and disappears with the size", () => {
    let selection = initialSelection(latte);
    expect(evaluate(latte, selection).groups.map((g) => g.group.id)).not.toContain("ekstra");
    selection = choosePrice(latte, selection, "buyuk");
    selection = toggle(latte, selection, "cift-shot");
    expect(evaluate(latte, selection).totalMinor).toBe(32500);
    selection = choosePrice(latte, selection, "kucuk");
    expect(selection.optionIds).not.toContain("cift-shot");
    expect(evaluate(latte, selection).totalMinor).toBe(24000);
  });

  it("an unavailable option cannot be chosen, and one that ran out makes the choice incomplete", () => {
    const selection = initialSelection(latte);
    expect(state(evaluate(latte, selection), "tarcin")?.blocked).toEqual({ reason: "unavailable" });
    expect(toggle(latte, selection, "tarcin")).toEqual(selection);
    const stale = { ...selection, optionIds: [...selection.optionIds, "tarcin"] };
    expect(evaluate(latte, stale).problems).toContainEqual({
      code: "unavailable",
      optionId: "tarcin",
    });
  });

  it("allergens and diets follow the options (REQ-005 on the configured product)", () => {
    let selection = toggle(latte, initialSelection(latte), "yulaf");
    selection = toggle(latte, selection, "findik");
    const evaluation = evaluate(latte, selection);
    expect(evaluation.allergens).toEqual(["milk", "gluten", "nuts"]);
    expect(evaluation.diets).toEqual(["vegetarian"]);
  });
});
