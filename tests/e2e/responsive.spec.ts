import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { findOverflow, findSmallInputs, findSmallTargets } from "./checks";
import { publicRoutes, venueRoutes, widths } from "./routes";

/**
 * Mobile is a test, not a promise (07-mobil §10, MB-05). For every route and width:
 * no horizontal overflow, touch targets ≥ 44 px, inputs ≥ 16 px; axe at phone and laptop size.
 * Panel routes join from D-18 with the demo session.
 */
const routes = [...publicRoutes, ...venueRoutes];

for (const route of routes) {
  test.describe(route, () => {
    for (const width of widths) {
      test(`no overflow, touch targets and inputs at ${width}px`, async ({ page }, testInfo) => {
        // Every width is set explicitly, so one project covers them; the touch device is the stricter one.
        test.skip(testInfo.project.name === "desktop", "widths are covered by the mobile project");
        await page.setViewportSize({ width, height: 900 });
        await page.goto(route);
        await page.waitForLoadState("networkidle");

        expect.soft(await findOverflow(page), "horizontal overflow").toBeNull();
        if (width < 1024) {
          expect.soft(await findSmallTargets(page), "touch targets below 44px").toEqual([]);
          expect.soft(await findSmallInputs(page), "inputs below 16px (iOS zoom)").toEqual([]);
        }
      });
    }

    for (const width of [390, 1280]) {
      test(`axe has no serious or critical violations at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(route);
        const results = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
          .analyze();
        const blocking = results.violations.filter(
          (v) => v.impact === "serious" || v.impact === "critical",
        );
        expect(blocking.map((v) => `${v.id}: ${v.nodes.length} node(s)`)).toEqual([]);
      });
    }
  });
}

// 07-mobil §10, MB-07: a header that wraps onto two lines changes height between desktop widths.
test("platform header keeps one line on desktop widths", async ({ page }) => {
  test.skip(test.info().project.name !== "desktop", "runs once");
  const heights: number[] = [];
  for (const width of [1024, 1280, 1536]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const box = await page.getByRole("banner").first().boundingBox();
    if (!box) throw new Error("no <header> (banner) on the page");
    heights.push(Math.round(box.height));
  }
  expect(
    Math.max(...heights) - Math.min(...heights),
    `banner heights ${heights.join(" / ")} px`,
  ).toBeLessThanOrEqual(4);
});
