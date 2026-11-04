import { expect, test } from "@playwright/test";

import { venueHost, venueUrl } from "./routes";

/**
 * REQ-001, BR-KRC-004 — tenant routing by host on a running server (ADR-0002 v2). Unlike the unit
 * test (tests the rewrite list), this sees Next.js' real beforeFiles chain and the rendered pages.
 */

test.describe("tenant routing", () => {
  test.beforeEach(() => {
    test.skip(test.info().project.name !== "desktop", "runs once");
  });

  test("each venue host opens its own theme tree", async ({ page }) => {
    await page.goto(venueUrl("rakim"));
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Rakım Kahve Kavurma menüsü");
    await expect(page.locator("html")).toHaveAttribute("lang", "tr");

    await page.goto(venueUrl("ornek"));
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Menü");
    await expect(page.getByText("Örnek Mekân")).toBeVisible();
  });

  test("a right-to-left locale turns the layout around", async ({ page }) => {
    await page.goto(venueUrl("ornek", "/ar"));
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("القائمة");
  });

  test("a locale the venue does not serve answers 404", async ({ request }) => {
    const response = await request.get("/en", { headers: { host: venueHost("rakim") } });
    expect(response.status()).toBe(404);
  });

  test("BR-KRC-004: internal /tema-* paths are not reachable from outside", async ({ request }) => {
    for (const host of ["localhost:3020", venueHost("rakim")]) {
      const response = await request.get("/tema-rakim/rakim/tr", { headers: { host } });
      expect(response.status(), host).toBe(404);
    }
  });

  test("BR-KRC-004: an unknown host answers 404 with the platform's page", async ({ page }) => {
    const response = await page.goto(venueUrl("bilinmeyen-mekan"));
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Bu sayfa bulunamadı");
  });

  test("/m/{slug} opens a venue on the platform host and is never indexed", async ({ page }) => {
    const response = await page.goto("/m/ornek/ar");
    expect(response?.status()).toBe(200);
    expect(response?.headers()["x-robots-tag"]).toContain("noindex");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  });

  test("?mekan= keeps a venue on the preview host until ?mekan=platform", async ({ page }) => {
    await page.goto("/?mekan=ornek");
    await expect(page).toHaveURL(/\/$/); // the parameter is gone after the redirect
    await expect(page.getByText("Örnek Mekân")).toBeVisible();

    await page.goto("/ar"); // later requests keep the venue through the cookie
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");

    await page.goto("/kvkk?mekan=platform");
    await expect(page).toHaveURL(/\/kvkk$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Aydınlatma Metni");
    await page.goto("/");
    await expect(page).toHaveTitle(/Kartela/);
  });

  test("an unknown venue in ?mekan= is refused", async ({ request }) => {
    const response = await request.get("/?mekan=yok-boyle-bir-mekan", { maxRedirects: 0 });
    expect(response.status()).toBe(404);
  });

  test("robots.txt, sitemap.xml and the manifest belong to the venue", async ({ request }) => {
    const robots = await request.get("/robots.txt", { headers: { host: venueHost("rakim") } });
    expect(await robots.text()).toContain("Disallow: /"); // demo venue (plan K-06)

    const sitemap = await (
      await request.get("/sitemap.xml", { headers: { host: venueHost("rakim") } })
    ).text();
    expect(sitemap).toContain("<loc>https://rakim-kahve.vercel.app/</loc>");
    expect(sitemap).not.toContain("ornek"); // venues never list each other (plan §15)

    const manifest = (await (
      await request.get("/manifest.webmanifest", { headers: { host: venueHost("ornek") } })
    ).json()) as { name: string; lang: string };
    expect(manifest).toMatchObject({ name: "Örnek Mekân", lang: "tr" });

    // The platform keeps its own files.
    expect(await (await request.get("/manifest.webmanifest")).text()).toContain("Kartela");
  });

  test("the venue page's icon loads from its own host", async ({ page, request }) => {
    // Regression: the /tema-* block answered 404 for the theme tree's icon (Lighthouse console error).
    await page.goto(venueUrl("rakim"));
    const hrefs = await page
      .locator('link[rel="icon"]')
      .evaluateAll((links) => links.map((link) => link.getAttribute("href") ?? ""));
    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) {
      const response = await request.get(href, { headers: { host: venueHost("rakim") } });
      expect(response.status(), href).toBe(200);
    }
  });

  test("a venue host still serves the shared API", async ({ request }) => {
    const response = await request.get("/api/health", { headers: { host: venueHost("rakim") } });
    expect(response.status()).toBe(200);
    const body = (await response.json()) as { map: { version: string }; tenant: string };
    expect(body.map.version).toMatch(/^[0-9a-f]{8}$/);
    expect(body.tenant).toBe("isolated"); // ADR-0004: app role + RLS in place on this database
  });
});
