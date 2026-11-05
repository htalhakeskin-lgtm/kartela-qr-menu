import { describe, expect, it } from "vitest";

import { themeMeta } from "@/themes/meta";

import { contrastRatio } from "./contrast";

describe("WCAG contrast ratio", () => {
  it.each([
    ["#000000", "#ffffff", 21],
    ["#ffffff", "#ffffff", 1],
    ["#18181b", "#ffffff", 17.72],
    ["#5b5b63", "#ffffff", 6.73],
  ])("%s on %s ≈ %f", (a, b, expected) => {
    expect(contrastRatio(a, b)).toBeCloseTo(expected, 1);
  });

  it.each(Object.values(themeMeta).map((meta) => [meta.id, meta] as const))(
    "08-erisilebilirlik: %s text tokens reach AA on their backgrounds, day and dark",
    (_id, meta) => {
      for (const colors of [meta.tokens.color, meta.tokenVariants?.dark].filter(Boolean)) {
        const c = colors!;
        for (const surface of [c.background, c.surface]) {
          expect(contrastRatio(c.foreground, surface)).toBeGreaterThanOrEqual(4.5);
          expect(contrastRatio(c.mutedForeground, surface)).toBeGreaterThanOrEqual(4.5);
          expect(contrastRatio(c.soldOut, surface)).toBeGreaterThanOrEqual(4.5);
        }
        expect(contrastRatio(c.primaryForeground, c.primary)).toBeGreaterThanOrEqual(4.5);
        expect(contrastRatio(c.accent, c.background)).toBeGreaterThanOrEqual(3);
      }
    },
  );
});
