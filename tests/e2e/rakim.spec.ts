import { expect, test } from "@playwright/test";

import rakimMenu from "../../content/mekanlar/rakim/menu";
import { formatMoney } from "../../src/lib/format";
import { parseMoney } from "../../src/lib/money";
import { type MenuSchedule, orderMenus } from "../../src/platform/menu/schedule";
import { venueHost, venueUrl } from "./routes";

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

test.describe("Rakım signatures (D-17, REQ-020)", () => {
  test("the bean card shows the altitude line and the tasting notes", async ({ page }) => {
    await page.goto(venueUrl("rakim"));
    const guji = page.getByRole("button", { name: new RegExp(item("etiyopya-guji").name.tr) });
    await expect(guji.getByRole("img", { name: "Rakım: 1.950–2.200 m" })).toBeVisible();
    await expect(guji.getByText("bergamot", { exact: true })).toBeVisible();
    await expect(guji.getByText(/Önerilen demleme: V60/)).toBeVisible();
  });

  test("the server HTML is already in serving order, and the top bar names the menu", async ({
    page,
    request,
  }) => {
    // Expected from the content file's schedules at this moment, in Istanbul time.
    const menus = rakimMenu.menus.map((menu) => ({
      name: menu.name.tr,
      // The content file's input type: weekdays are plain numbers there.
      schedule: (menu.schedule ?? null) as MenuSchedule | null,
      outsideWindow: "dim" as const,
    }));
    const order = orderMenus(menus, new Date(), "Europe/Istanbul");
    const html = await (await request.get("/", { headers: { host: venueHost("rakim") } })).text();
    const positions = order.map((entry) => html.indexOf(`>${entry.menu.name}</span></h2>`));
    expect(positions.every((position) => position > 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);

    await page.goto(venueUrl("rakim"));
    const first = order[0]!;
    const until = first.status.state === "open" ? first.status.until : undefined;
    await expect(page.getByRole("banner")).toContainText(
      until ? `${first.menu.name} · bitiş ${until}` : first.menu.name,
    );
  });

  test("nothing moves after the first paint (CLS below 0.1)", async ({ page }) => {
    await page.addInitScript(() => {
      const shifts: number[] = [];
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as (PerformanceEntry & {
          value: number;
          hadRecentInput: boolean;
        })[]) {
          if (!entry.hadRecentInput) shifts.push(entry.value);
        }
      }).observe({ type: "layout-shift", buffered: true });
      (window as unknown as { __shifts: number[] }).__shifts = shifts;
    });
    await page.goto(venueUrl("rakim"));
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);
    const total = await page.evaluate(() =>
      (window as unknown as { __shifts: number[] }).__shifts.reduce((sum, v) => sum + v, 0),
    );
    expect(total).toBeLessThan(0.1);
  });
});
