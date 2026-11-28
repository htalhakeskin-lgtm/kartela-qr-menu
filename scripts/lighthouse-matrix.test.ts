import { createRequire } from "node:module";

import { describe, expect, it } from "vitest";

import { venues } from "../src/platform/tenant/registry";

/**
 * D-22: lighthouserc.js (CommonJS, cannot import the TypeScript registry) lists every venue's
 * quick menu and Keşfet. This keeps the list in step with the registry.
 */
const config = createRequire(import.meta.url)("../lighthouserc.js") as {
  ci: { collect: { url: string[] } };
};

describe("Lighthouse venue matrix", () => {
  it("measures every registered venue's quick menu and Keşfet", () => {
    for (const venue of venues) {
      const menu = config.ci.collect.url.find((url) => url.includes(`//${venue.slug}.localhost`));
      expect(menu, `${venue.slug} quick menu`).toBeDefined();
      expect(
        config.ci.collect.url.some(
          (url) => url.includes(`//${venue.slug}.localhost`) && url.endsWith("/kesfet"),
        ),
        `${venue.slug} Keşfet`,
      ).toBe(true);
    }
  });
});
