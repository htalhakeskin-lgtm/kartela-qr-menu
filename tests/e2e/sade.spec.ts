import { expect, type Page, test } from "@playwright/test";

import { venueHost, venueUrl } from "./routes";

/**
 * Sade's quick menu (D-09, SCR-001, SCR-003) on the fixture venue: the base slots every theme
 * starts from. REQ-003, REQ-007, REQ-008, REQ-012, REQ-013 as the guest uses them.
 */

const bottomBar = (page: Page) => page.getByRole("navigation", { name: "Menü" });
const sheet = (page: Page) => page.getByRole("dialog");

test.describe("Sade quick menu", () => {
  test("the menu is in the server HTML, with the legal note and the maker's credit", async ({
    request,
  }) => {
    const html = await (await request.get("/", { headers: { host: venueHost("ornek") } })).text();
    expect(html).toContain("Mercimek çorbası");
    expect(html).toContain("Fiyatlara KDV dahildir.");
    expect(html).toContain("Talha Keskin");
  });

  test("REQ-012: search finds Turkish words without diacritics", async ({ page }) => {
    await page.goto(venueUrl("ornek"));
    await bottomBar(page).getByRole("button", { name: /Ara/ }).click();
    await sheet(page).getByRole("searchbox").fill("corba");
    await expect(sheet(page).getByRole("button", { name: /Mercimek çorbası/ })).toBeVisible();
    await expect(sheet(page).getByRole("button", { name: /Ezogelin çorbası/ })).toBeVisible();
    await expect(sheet(page).getByRole("button", { name: /Menemen/ })).toHaveCount(0);
  });

  test("REQ-012: a filter hides what it excludes and lives in the address bar", async ({
    page,
  }) => {
    await page.goto(venueUrl("ornek"));
    await bottomBar(page)
      .getByRole("button", { name: /Filtre/ })
      .click();
    await sheet(page).getByRole("button", { name: "Gluten" }).click();
    await expect(page).toHaveURL(/filtre=alerjen%3Agluten/);
    await page.keyboard.press("Escape");
    const main = page.getByRole("main");
    await expect(main.getByRole("button", { name: /Mercimek çorbası/ })).toHaveCount(0);
    await expect(
      main.getByRole("button", { name: /Zeytinyağlı kuru fasulye/ }).first(),
    ).toBeVisible();
    await page.reload(); // the filter survives a reload
    await expect(
      page.getByRole("main").getByRole("button", { name: /Mercimek çorbası/ }),
    ).toHaveCount(0);
  });

  test("REQ-007: the configurator follows the rules and the total follows the choices", async ({
    page,
  }) => {
    await page.goto(venueUrl("ornek"));
    await page
      .getByRole("main")
      .getByRole("button", { name: /Cortado/ })
      .click();
    const dialog = sheet(page);
    const add = dialog.getByRole("button", { name: /Seçtiklerime ekle/ });
    await expect(add).toContainText(/140\s₺/);
    await dialog.getByLabel("Çift shot").check();
    await dialog.getByLabel("Yulaf sütü").check();
    await expect(add).toContainText(/190\s₺/);
    await expect(dialog.getByLabel("Krema")).toBeDisabled(); // oat milk excludes cream (BR-SCN-003)
    await expect(dialog.getByText("Yulaf sütüyle krema eklenmez.")).toBeVisible();
    await expect(dialog.getByLabel("Bal")).toBeDisabled(); // sold out
    await add.click();
    await expect(dialog.getByRole("button", { name: /Eklendi/ })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(bottomBar(page).getByRole("button", { name: /Seçtiklerim/ })).toContainText("1");
  });

  test("BR-SCN-001: a required choice without a default blocks adding until it is made", async ({
    page,
  }) => {
    await page.goto(venueUrl("ornek", "/#urun-turk-kahvesi"));
    const add = sheet(page).getByRole("button", { name: /Seçtiklerime ekle/ });
    await expect(add).toBeDisabled();
    await sheet(page).getByLabel("Orta").check();
    await expect(add).toBeEnabled();
  });

  test("SCR-003: a product link opens its sheet; closing it clears the address", async ({
    page,
  }) => {
    await page.goto(venueUrl("ornek", "/#urun-menemen"));
    await expect(sheet(page).getByRole("heading", { name: "Menemen" })).toBeVisible();
    await sheet(page).getByRole("button", { name: "Kapat" }).click();
    await expect(sheet(page)).toHaveCount(0);
    await expect(page).not.toHaveURL(/#urun-/);
  });

  test("REQ-008: a sold-out product is marked and moved to the end of its section", async ({
    page,
  }) => {
    await page.goto(venueUrl("ornek"));
    // The section block of "Sulu yemekler" (not the menu section around it).
    const stews = page
      .getByRole("heading", { name: "Sulu yemekler" })
      .locator("xpath=ancestor::section[1]");
    const rows = stews.getByRole("listitem");
    await expect(rows.last()).toContainText("Etli nohut");
    await expect(rows.last()).toContainText("Tükendi");
  });

  test("REQ-006: the Arabic page runs right to left with the category bar", async ({ page }) => {
    await page.goto(venueUrl("ornek", "/ar"));
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByRole("navigation", { name: "الأقسام" })).toBeVisible();
    await expect(page.getByRole("main").getByText("300 g").first()).toBeVisible();
  });
});
