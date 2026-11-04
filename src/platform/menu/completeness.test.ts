import { describe, expect, it } from "vitest";

import { infoGaps } from "./completeness";

describe("BR-YSL-005: products missing ingredients or energy are reported", () => {
  it.each([
    ["dish", null, null, ["ingredients", "energy"]],
    ["dish", { tr: "Mercimek, soğan, havuç" }, 210, []],
    ["drink", { tr: "Espresso, süt" }, null, ["energy"]],
    ["set", { tr: " " }, 640, ["ingredients"]],
    ["bean", null, null, ["ingredients"]], // beans are sold, not served: no energy
    ["tasting", null, null, []], // its courses carry the information
  ] as const)("%s with %o / %o kcal → %o", (kind, ingredients, energyKcal, gaps) => {
    expect(infoGaps({ kind, ingredients, energyKcal })).toEqual(gaps);
  });
});
