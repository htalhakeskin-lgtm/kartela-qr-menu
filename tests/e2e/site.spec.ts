import { expect, test } from "@playwright/test";

import { venueHost } from "./routes";

/**
 * Smoke test that also proves the right server answers (Levha Faz 3 lesson: another project's
 * Next.js server on the same port made 99 tests run against the wrong site).
 */
test("the platform home is Kartela's", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle(/Kartela/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("tek altyapıdan");
});

test("legal pages render their text and the template note", async ({ page }) => {
  for (const [path, heading] of [
    ["/kvkk", "Aydınlatma Metni"],
    ["/gizlilik", "Gizlilik Politikası"],
    ["/cerez-politikasi", "Çerez Politikası"],
  ] as const) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(heading);
    await expect(page.getByText("Örnek metindir")).toBeVisible();
  }
});

test("an unknown path answers 404 with the platform's page", async ({ page }) => {
  const response = await page.goto("/bu-sayfa-yok");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Bu sayfa bulunamadı");
});

test("the footer's last row carries the maker's credit", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("footer").getByText("Talha Keskin")).toBeVisible();
});

test("Rakım measurement page: first product and price are in the server HTML", async ({
  request,
}) => {
  const html = await (await request.get("/", { headers: { host: venueHost("rakim") } })).text();
  expect(html).toContain("Etiyopya Guji · V60");
  expect(html).toMatch(/240\s₺/);
  expect(html).toContain('lang="tr"');
});
