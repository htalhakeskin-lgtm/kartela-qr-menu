import { expect, test } from "@playwright/test";

import { notFoundRoute, publicRoutes } from "./routes";

/**
 * SEO basics on every public route (09-seo §2, SEO-06): title, description, absolute canonical,
 * a working og:image and a single h1. Runs once (desktop project).
 */

for (const route of publicRoutes.filter((r) => r !== notFoundRoute)) {
  test(`${route} has title, description, canonical, og:image and one h1`, async ({ page }) => {
    test.skip(test.info().project.name !== "desktop", "runs once");
    await page.goto(route);

    const title = await page.title();
    const description = await page.locator('meta[name="description"]').getAttribute("content");
    const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
    const ogImage = await page.locator('meta[property="og:image"]').first().getAttribute("content");

    expect.soft(title.length, "title").toBeGreaterThan(0);
    expect.soft(title.length, "title ≤ 60 characters").toBeLessThanOrEqual(60);
    expect.soft(description?.length ?? 0, "meta description").toBeGreaterThan(0);
    expect.soft(description?.length ?? 0, "description ≤ 160 characters").toBeLessThanOrEqual(160);
    expect.soft(canonical ?? "", "absolute canonical").toMatch(/^https?:\/\//);
    await expect.soft(page.locator("h1"), "exactly one h1").toHaveCount(1);

    expect(ogImage, "og:image").toBeTruthy();
    if (ogImage) {
      // The tag may carry the production origin; fetch the same path from the test server.
      const response = await page.request.get(new URL(ogImage).pathname + new URL(ogImage).search);
      expect(response.status(), "og:image responds").toBe(200);
      expect(response.headers()["content-type"], "og:image is an image").toMatch(/^image\//);
    }
  });
}
