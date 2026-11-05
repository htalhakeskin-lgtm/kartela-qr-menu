import { expect, type Page, test } from "@playwright/test";

import { venueUrl } from "./routes";

/**
 * Offline opening (REQ-017, NFR-06, SCR-009, D-13): once a guest has opened the menu, it opens
 * again in airplane mode with a "last updated" note; a page never opened shows the venue's offline
 * page. The worker lives only on the venue's own domain.
 */

/**
 * Waits until the venue's worker is activated and controls the page, and has stored the page and
 * the files it loaded (the first visit's "warm" message stores the page first, the files after).
 * expect.poll, not waitForFunction: the latter takes a returned Promise as a truthy answer.
 */
async function storedByWorker(page: Page) {
  await expect
    .poll(
      () =>
        page.evaluate(async () => {
          const registration = await navigator.serviceWorker.getRegistration();
          if (registration?.active?.state !== "activated" || !navigator.serviceWorker.controller) {
            return false;
          }
          const address = window.location.href.split("#")[0] ?? window.location.href;
          const loaded = performance
            .getEntriesByType("resource")
            .map((entry) => entry.name)
            .filter((name) => name.includes("/_next/static/"));
          const stored = new Set<string>();
          for (const name of await caches.keys()) {
            for (const key of await (await caches.open(name)).keys()) stored.add(key.url);
          }
          return stored.has(address) && loaded.every((name) => stored.has(name));
        }),
      { timeout: 15_000 },
    )
    .toBe(true);
}

test.describe("offline opening (D-13)", () => {
  test("REQ-017: a menu opened once opens again offline, with the last update", async ({
    page,
    context,
  }) => {
    await page.goto(venueUrl("ornek"));
    await storedByWorker(page);

    await context.setOffline(true);
    await page.reload();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Örnek Mekân · Menü");
    await expect(page.getByText("Mercimek çorbası").first()).toBeVisible();
    await expect(page.getByText(/^Çevrimdışı · son güncelleme \d{2}:\d{2}$/)).toBeVisible();

    // SCR-009: a page this guest never opened, in the page's language…
    await page.goto(venueUrl("ornek", "/en/bilgi"));
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("You are offline");
    await page.goto(venueUrl("ornek", "/bilgi"));
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Şu an çevrimdışısınız");
    // …whose link leads back to the menu that opens offline.
    await page.getByRole("link", { name: "Menüye dön" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Örnek Mekân · Menü");

    await context.setOffline(false);
  });

  test("the worker stores the venue's pages, files and photos, never the API", async ({
    page,
    request,
  }) => {
    await page.goto(venueUrl("ornek"));
    await storedByWorker(page);
    await page.evaluate(() => fetch("/api/health").then((response) => response.text()));
    const stored = await page.evaluate(async () => {
      const urls: string[] = [];
      for (const name of await caches.keys()) {
        for (const key of await (await caches.open(name)).keys()) urls.push(key.url);
      }
      return urls;
    });
    expect(stored.some((url) => url.includes("/_next/static/"))).toBe(true);
    expect(stored.some((url) => url.endsWith("/cevrimdisi"))).toBe(true);
    expect(stored.filter((url) => url.includes("/api/"))).toEqual([]);
    // The page still reaches the live API through the worker.
    expect((await request.get("/api/health")).status()).toBe(200);
  });

  test("no worker on a path-prefixed preview: the platform's origin stays untouched", async ({
    page,
  }) => {
    await page.goto("/m/ornek");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Örnek Mekân · Menü");
    await page.waitForLoadState("networkidle");
    expect(await page.evaluate(() => navigator.serviceWorker.getRegistrations())).toHaveLength(0);
  });
});
