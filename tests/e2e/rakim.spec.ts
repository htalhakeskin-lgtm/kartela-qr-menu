import { expect, test } from "@playwright/test";

import rakimMenu from "../../content/mekanlar/rakim/menu";
import { formatMoney } from "../../src/lib/format";
import { parseMoney } from "../../src/lib/money";
import { venueUrl } from "./routes";

/**
 * Rakım on the menu engine (D-15, REQ-018, plan §11.5): the ledger with its mono data line, the
 * featured filter, the data card of a photoless product, English, Keşfet and its own 404. Texts
 * come from the content file where they may change.
 */

const item = (slug: string) => rakimMenu.items.find((entry) => entry.slug === slug)!;

test.describe("Rakım (D-15)", () => {
  test("REQ-018: the ledger shows the featured filter, recipes and bean facts as data", async ({
    page,
  }) => {
    await page.goto(venueUrl("rakim"));
    await expect(
      page.getByRole("button", { name: new RegExp(item("gunun-filtresi").name.tr) }),
    ).toBeVisible();
    // Brew recipe of the filter of the day, bean facts of a bag: the mono data line.
    await expect(page.getByText("15 g · 250 ml · 93 °C · 3:15")).toBeVisible();
    await expect(page.getByText("18 g → 36 g · 28 sn")).toBeVisible();
    await expect(page.getByText(/Guji, Oromia · 1\.950–2\.200 m · yıkanmış · 250 g/)).toBeVisible();
  });

  test("REQ-019: the recipe card adds up the choices and keeps them in one line", async ({
    page,
  }) => {
    // Expected total from the content file: the 12 oz line, oat milk, vanilla and the default
    // double shot.
    const latte = item("latte");
    const groups = rakimMenu.optionGroups!;
    const option = (group: string, key: string) =>
      groups[group]!.options.find((entry) => entry.key === key)!;
    const minor = (amount: string | undefined) => (amount ? parseMoney(amount)! : 0);
    const total =
      minor(latte.prices.find((price) => price.key === "12oz")!.amount) +
      minor(option("sut", "yulaf").delta) +
      minor(option("surup", "vanilya").delta) +
      minor(option("shot", "cift").delta);

    await page.goto(venueUrl("rakim", "/#urun-latte"));
    const panel = page.getByRole("dialog");
    await panel.getByText("12 oz", { exact: true }).first().click();
    await panel.getByText("Yulaf sütü", { exact: true }).click();
    await panel.getByText("Vanilya", { exact: true }).click();
    await expect(panel.getByText("12 oz · Çift · Yulaf sütü · Vanilya")).toBeVisible();
    await expect(
      panel.getByRole("button", {
        name: `Seçtiklerime ekle ${formatMoney(total, { decimals: "auto" })}`,
      }),
    ).toBeVisible();
  });

  test("REQ-006: the English menu reads in English", async ({ page }) => {
    await page.goto(venueUrl("rakim", "/en"));
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByText(item("gunun-filtresi").name.en!).first()).toBeVisible();
    await expect(page.getByText("18 g → 36 g · 28 s")).toBeVisible();
  });

  test("REQ-010: Keşfet opens with the origin chapters and the brewing guide", async ({ page }) => {
    await page.goto(venueUrl("rakim", "/kesfet"));
    await expect(
      page.getByRole("heading", { name: "Deniz seviyesinden 2.100 metreye" }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Çiçeklenmeyi bekleyin" })).toBeVisible();
  });

  test("its pages run without script errors (inline head scripts included)", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    for (const path of ["/", "/en", "/kesfet", "/bilgi"]) {
      await page.goto(venueUrl("rakim", path));
      await page.waitForLoadState("networkidle");
    }
    expect(errors).toEqual([]);
  });

  test("an unknown path answers Rakım's own 404", async ({ page }) => {
    const response = await page.goto(venueUrl("rakim", "/yok-boyle"));
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Bu sayfa yok");
  });
});

test.describe("Rakım signature motions (K-28)", () => {
  test.use({ reducedMotion: "no-preference" });

  test("motion 2: a tapped row's photo grows into the panel, which opens normally", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(venueUrl("rakim"));
    await page.waitForLoadState("networkidle");
    const cortado = item("cortado");
    const started = page.evaluate(
      () =>
        new Promise<boolean>((resolve) => {
          const original = document.startViewTransition.bind(document);
          document.startViewTransition = ((update: () => Promise<void>) => {
            resolve(true);
            return original(update);
          }) as typeof document.startViewTransition;
          setTimeout(() => {
            resolve(false);
          }, 5000);
        }),
    );
    await page.getByRole("button", { name: new RegExp(cortado.name.tr) }).click();
    expect(await started).toBe(true);
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("dialog").getByRole("heading", { level: 2 })).toHaveText(
      cortado.name.tr,
    );
    expect(errors).toEqual([]);
  });
});
