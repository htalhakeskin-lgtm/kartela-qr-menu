import { describe, expect, it } from "vitest";

import { defaultPrice, type PriceLine, priceProblems, priceText } from "./price";

/** formatMoney keeps the amount and ₺ together with a no-break space. */
const tl = (text: string) => text.replace(" ", String.fromCharCode(0xa0));

const line = (overrides: Partial<PriceLine>): PriceLine => ({
  unit: "portion",
  amountMinor: 24000,
  isDefault: true,
  ...overrides,
});

describe("REQ-004: price lines are written with their unit", () => {
  it.each([
    [line({}), "tr", null, "240 ₺"],
    [line({ unit: "half", amountMinor: 14000 }), "tr", "Yarım", "140 ₺"],
    [line({ unit: "per_100g" }), "tr", "100 g", "240 ₺"],
    [line({ unit: "per_kg", amountMinor: 185000 }), "tr", "1 kg", "1.850 ₺"],
    [line({ unit: "glass", amountMinor: 32050 }), "en", "Glass", "320,50 ₺"],
    [line({ unit: "bottle" }), "ar", "زجاجة", "240 ₺"],
    [line({ unit: "size", label: { tr: "Büyük", en: "Large" } }), "en", "Large", "240 ₺"],
  ] as const)("%o in %s → %s · %s", (price, locale, label, amount) => {
    expect(priceText(price, locale)).toEqual({ label, amount: tl(amount) });
  });

  it("a label without a translation falls back to Turkish (BR-MNU-003)", () => {
    expect(priceText(line({ unit: "size", label: { tr: "Tek shot" } }), "ar").label).toBe(
      "Tek shot",
    );
  });

  it("the compact row shows the default line", () => {
    const lines = [line({ isDefault: false, amountMinor: 1 }), line({ amountMinor: 2 })];
    expect(defaultPrice(lines)?.amountMinor).toBe(2);
  });
});

describe("BR-FYT-001 / BR-FYT-002: price line rules", () => {
  it("a valid set of lines has no problems", () => {
    expect(
      priceProblems([
        line({ unit: "portion" }),
        line({ unit: "half", amountMinor: 14000, isDefault: false }),
      ]),
    ).toEqual([]);
  });

  it("BR-FYT-002: per kg and per 100 g never on the same product", () => {
    expect(
      priceProblems([line({ unit: "per_kg" }), line({ unit: "per_100g", isDefault: false })]),
    ).toContain("kg_and_100g");
  });

  it("BR-FYT-001: amounts are whole, non-negative kuruş", () => {
    expect(priceProblems([line({ amountMinor: -100 })])).toContain("negative_or_fraction");
    expect(priceProblems([line({ amountMinor: 12.5 })])).toContain("negative_or_fraction");
  });

  it("exactly one default line; a size needs its name; no lines is a problem", () => {
    expect(priceProblems([line({}), line({})])).toContain("default_count");
    expect(priceProblems([line({ isDefault: false })])).toContain("default_count");
    expect(priceProblems([line({ unit: "size", label: { tr: " " } })])).toContain(
      "size_without_label",
    );
    expect(priceProblems([])).toEqual(["empty"]);
  });
});
