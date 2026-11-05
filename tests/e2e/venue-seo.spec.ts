import { expect, type Page, test } from "@playwright/test";

import { venueHost, venueUrl } from "./routes";

/**
 * The venue shell (D-11): every venue page is a site of its own — title pattern, description,
 * canonical and hreflang on the venue's domain, its own share image and icon, structured data
 * with only what the page shows, the information page (SCR-005) and a 404 in the venue's language.
 * Uses the fixture venue (Sade, TR + EN + AR, demo mode).
 */

const ORIGIN = `http://${venueHost("ornek")}`;

async function head(page: Page) {
  const attr = (selector: string, name: string) =>
    page.locator(selector).first().getAttribute(name);
  return {
    title: await page.title(),
    description: await attr('meta[name="description"]', "content"),
    canonical: await attr('link[rel="canonical"]', "href"),
    robots: await attr('meta[name="robots"]', "content"),
    ogImage: await attr('meta[property="og:image"]', "content"),
    alternates: await page
      .locator('link[rel="alternate"][hreflang]')
      .evaluateAll((links) =>
        links.map((link) => [link.getAttribute("hreflang"), link.getAttribute("href")]),
      ),
  };
}

async function jsonLd(page: Page): Promise<Record<string, unknown>> {
  const text = await page.locator('script[type="application/ld+json"]').first().textContent();
  return JSON.parse(text ?? "{}") as Record<string, unknown>;
}

test.describe("venue shell (D-11)", () => {
  for (const [path, title, canonical] of [
    ["/", "Menü · Örnek Mekân", ""],
    ["/en/kesfet", "Explore · Örnek Mekân", "/en/kesfet"],
    ["/ar/bilgi", "معلومات · Örnek Mekân", "/ar/bilgi"],
  ] as const) {
    test(`REQ-015: ${path} names itself, its languages and its share image`, async ({
      page,
      request,
    }) => {
      test.skip(test.info().project.name !== "desktop", "runs once");
      await page.goto(venueUrl("ornek", path));
      const meta = await head(page);

      expect(meta.title).toBe(title);
      expect(meta.title.length).toBeLessThanOrEqual(60);
      expect(meta.description?.length ?? 0).toBeGreaterThan(0);
      expect(meta.description?.length ?? 0).toBeLessThanOrEqual(160);
      expect(meta.canonical).toBe(`${ORIGIN}${canonical}`);
      expect(meta.robots).toContain("noindex"); // demo venue (K-06)

      // One alternate per language and x-default, all on the venue's own domain.
      const page_ = path.replace(/^\/(en|ar)/, "") || "/";
      const segment = page_ === "/" ? "" : page_;
      expect(Object.fromEntries(meta.alternates)).toEqual({
        tr: `${ORIGIN}${segment}`,
        en: `${ORIGIN}/en${segment}`,
        ar: `${ORIGIN}/ar${segment}`,
        "x-default": `${ORIGIN}${segment}`,
      });

      expect(meta.ogImage).toBeTruthy();
      const image = await request.get(new URL(meta.ogImage!).pathname, {
        headers: { host: venueHost("ornek") },
      });
      expect(image.status()).toBe(200);
      expect(image.headers()["content-type"]).toBe("image/png");

      const icon = await page.locator('link[rel="icon"]').first().getAttribute("href");
      const iconResponse = await request.get(icon!, { headers: { host: venueHost("ornek") } });
      expect(iconResponse.status()).toBe(200);
    });
  }

  test("REQ-015: the quick menu describes the business and its public menu", async ({ page }) => {
    await page.goto(venueUrl("ornek"));
    const data = await jsonLd(page);
    expect(data).toMatchObject({
      "@context": "https://schema.org",
      "@type": "Restaurant",
      name: "Örnek Mekân",
      telephone: "+905423115888",
    });
    const menus = data.hasMenu as { hasMenuSection: { hasMenuItem: unknown[] }[] }[];
    const items = menus.flatMap((menu) => menu.hasMenuSection.flatMap((s) => s.hasMenuItem));
    expect(items).toContainEqual(
      expect.objectContaining({
        "@type": "MenuItem",
        name: "Mercimek çorbası",
        offers: expect.objectContaining({ priceCurrency: "TRY" }),
      }),
    );
    expect(JSON.stringify(data)).not.toMatch(/Review|AggregateRating/);
  });

  test("SCR-005: the information page lists hours, contact, Wi-Fi and questions", async ({
    page,
  }) => {
    await page.goto(venueUrl("ornek", "/bilgi"));
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Bilgi");
    await expect(page.getByText("Örnek Sokak No: 1, Sirkeci, Fatih / İstanbul")).toBeVisible();

    const hours = page.getByRole("table");
    await expect(hours.getByRole("row")).toHaveCount(7);
    await expect(hours.getByRole("row", { name: /Pazar\b/ })).toContainText("Kapalı");
    await expect(hours.locator('[aria-current="date"]')).toHaveCount(1); // today, in Istanbul

    await expect(page.getByRole("link", { name: /^Ara:/ })).toHaveAttribute(
      "href",
      "tel:+905423115888",
    );
    await expect(page.getByRole("link", { name: "WhatsApp" })).toHaveAttribute(
      "href",
      "https://wa.me/905423115888",
    );
    await expect(page.getByText("Ornek-Misafir")).toBeVisible();

    const question = page.getByText("Pazar günü açık mısınız?");
    await question.click();
    await expect(page.getByText(/cumartesi 16:00'ya kadar/)).toBeVisible();

    const data = await jsonLd(page);
    expect(data.openingHoursSpecification).toContainEqual({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: "https://schema.org/Saturday",
      opens: "08:00",
      closes: "16:00",
    });
    expect(data).not.toHaveProperty("hasMenu");
  });

  test("SCR-005: the bottom bar opens Bilgi and the language links keep the page", async ({
    page,
  }) => {
    await page.goto(venueUrl("ornek"));
    await page
      .getByRole("navigation", { name: "Menü" })
      .getByRole("link", { name: "Bilgi" })
      .click();
    await expect(page).toHaveURL(venueUrl("ornek", "/bilgi"));
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.getByRole("navigation", { name: "Dil" }).getByRole("link", { name: "EN" }).click();
    await expect(page).toHaveURL(venueUrl("ornek", "/en/bilgi"));
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Info");
  });

  test("an unknown path answers 404 inside the venue, in the page's language", async ({ page }) => {
    const english = await page.goto(venueUrl("ornek", "/en/yok-boyle"));
    expect(english?.status()).toBe(404);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("This page does not exist");
    await expect(page.getByRole("link", { name: "Back to the menu" })).toHaveAttribute(
      "href",
      "/en",
    );

    const turkish = await page.goto(venueUrl("ornek", "/olmayan/bir/yol"));
    expect(turkish?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Bu sayfa yok");
    await expect(page.getByRole("link", { name: "Menüye dön" })).toHaveAttribute("href", "/");
  });

  test("the sitemap lists every page in every language with its alternates", async ({
    request,
  }) => {
    const sitemap = await (
      await request.get("/sitemap.xml", { headers: { host: venueHost("ornek") } })
    ).text();
    for (const path of ["/", "/en", "/kesfet", "/ar/kesfet", "/bilgi", "/en/bilgi"]) {
      expect(sitemap).toContain(`<loc>${ORIGIN}${path}</loc>`);
    }
    expect(sitemap).toContain(`hreflang="x-default" href="${ORIGIN}/bilgi"`);
  });
});
