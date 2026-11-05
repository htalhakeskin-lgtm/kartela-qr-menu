import { describe, expect, it } from "vitest";

import { prePaintSource } from "@/platform/theme/pre-paint";
import { pageTransitionSource } from "@/themes/rakim/page-transition";

/**
 * The inline <head> scripts are strings rendered as they are: a typo is a syntax error in every
 * guest's console, not a build error (D-15: an escaped regex lost its backslashes). Parse them.
 */
describe("inline head scripts", () => {
  it.each([
    ["pre-paint (ADR-0005)", prePaintSource("Europe/Istanbul")],
    ["Rakım page transition (K-28)", pageTransitionSource],
  ])("%s is valid JavaScript", (_name, source) => {
    // eslint-disable-next-line @typescript-eslint/no-implied-eval -- parse only, never called
    expect(() => new Function(source)).not.toThrow();
  });

  it("the page transition tells Keşfet from the other pages without a regular expression", () => {
    expect(pageTransitionSource).toContain('pop()==="kesfet"');
  });
});
