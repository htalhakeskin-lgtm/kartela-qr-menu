import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { DEMO_VENUE_ACCOUNTS } from "../../src/config/demo-accounts";
import { findOverflow, findSmallInputs, findSmallTargets } from "./checks";
import {
  createPanelUser,
  ownClientAddress,
  removePanelUser,
  signIn,
  signInAsDemo,
  type TestUser,
  totp,
} from "./panel-users";
import { venueHost } from "./routes";

/**
 * Panel foundation (D-18a; REQ-021, SCR-100…102, BR-KRC-003, BR-YTK-002). Sign-in, the second
 * step, the venue picker and a venue's dashboard, on the platform host only.
 */
const owner = DEMO_VENUE_ACCOUNTS.find((account) => account.role === "owner");
const staff = DEMO_VENUE_ACCOUNTS.find((account) => account.role === "staff");
if (!owner || !staff) throw new Error("demo accounts missing an owner or staff");

test.beforeEach(async ({ page }) => {
  await ownClientAddress(page);
});

test.describe("SCR-100 sign-in", () => {
  let user: TestUser | undefined;
  test.afterEach(async () => {
    await removePanelUser(user);
    user = undefined;
  });

  test("a wrong password and an unknown address get the same answer; the address stays", async ({
    page,
  }) => {
    user = await createPanelUser({ tag: "yanlis", membership: { venue: "rakim", role: "staff" } });
    await signIn(page, { email: user.email, password: "bu-parola-yanlis-0000" });
    await expect(page.locator("form").getByRole("alert")).toHaveText(
      "E-posta ya da parola hatalı.",
    );
    await expect(page.getByLabel("E-posta")).toHaveValue(user.email);

    await signIn(page, { email: "kimse-yok@test.example.com", password: "bu-parola-yanlis-0000" });
    await expect(page.locator("form").getByRole("alert")).toHaveText(
      "E-posta ya da parola hatalı.",
    );
  });

  test("a member of one venue lands on its dashboard; signing out ends the session", async ({
    page,
  }) => {
    user = await createPanelUser({ tag: "uye", membership: { venue: "rakim", role: "manager" } });
    await signIn(page, user);
    await expect(page).toHaveURL(/\/panel\/rakim$/);
    await expect(page.getByRole("heading", { level: 1, name: "Pano" })).toBeVisible();

    const menu = page.getByRole("navigation", { name: "Panel sekmeleri" });
    if (await menu.isVisible()) {
      await menu.getByRole("button", { name: "Daha fazla" }).click();
      await page.getByRole("button", { name: "Çıkış yap" }).last().click();
    } else {
      await page.getByRole("complementary").getByRole("button", { name: "Çıkış yap" }).click();
    }
    await expect(page).toHaveURL(/\/panel\/giris$/);
    await page.goto("/panel/rakim");
    await expect(page).toHaveURL(/\/panel\/giris\?donus=%2Fpanel%2Frakim$/);
  });

  test("after signing in the user returns to the page they asked for", async ({ page }) => {
    user = await createPanelUser({ tag: "donus", membership: { venue: "rakim", role: "staff" } });
    await page.goto("/panel/hesap");
    await expect(page).toHaveURL(/donus=%2Fpanel%2Fhesap/);
    await page.getByLabel("E-posta").fill(user.email);
    await page.getByLabel("Parola", { exact: true }).fill(user.password);
    await page.getByRole("button", { name: "Giriş yap" }).click();
    await expect(page).toHaveURL(/\/panel\/hesap$/);
    await expect(page.getByRole("heading", { level: 1, name: "Hesabım" })).toBeVisible();
  });

  test("an outside return address is ignored (no open redirect)", async ({ page }) => {
    user = await createPanelUser({ tag: "acik", membership: { venue: "rakim", role: "staff" } });
    await signIn(page, user, "/panel/giris?donus=https%3A%2F%2Fevil.example.com%2Fpanel");
    await expect(page).toHaveURL(/\/panel\/rakim$/);
  });
});

test.describe("demo accounts", () => {
  test("one tap signs in as the venue's staff; the dashboard shows today's work", async ({
    page,
  }) => {
    await signInAsDemo(page, staff.label);
    await expect(page).toHaveURL(/\/panel\/rakim$/);
    await expect(page.getByText("Şu an açık menü")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Tükenenler" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Eksik ürün bilgisi" })).toBeVisible();
  });

  test("a demo account cannot change its password or second step", async ({ page }) => {
    await signInAsDemo(page, owner.label);
    await page.goto("/panel/hesap");
    await expect(page.getByText("Demo hesabının parolası değiştirilemez.")).toBeVisible();
    await expect(page.getByRole("button", { name: "İki adımlı doğrulamayı aç" })).toHaveCount(0);
  });
});

test.describe("BR-KRC-003: a member sees only their venues", () => {
  let user: TestUser | undefined;
  test.afterEach(async () => {
    await removePanelUser(user);
    user = undefined;
  });

  test("another venue and a missing one answer the same 404", async ({ page }) => {
    user = await createPanelUser({ tag: "yalitim", membership: { venue: "rakim", role: "owner" } });
    await signIn(page, user);
    await expect(page).toHaveURL(/\/panel\/rakim$/);
    // The panel streams (no prerendered shell, for the nonce CSP), so the status line is already
    // sent when the venue layout answers notFound(): the page, not the status, is the contract.
    for (const path of ["/panel/ornek", "/panel/boyle-bir-mekan-yok"]) {
      await page.goto(path);
      await expect(page.getByRole("heading", { name: "Bu sayfaya ulaşılamıyor" })).toBeVisible();
      await expect(page.getByText("Örnek Mekân")).toHaveCount(0);
    }
  });

  test("a platform admin picks among every venue", async ({ page }) => {
    user = await createPanelUser({ tag: "admin", platformAdmin: true });
    await signIn(page, user);
    await expect(page).toHaveURL(/\/panel$/);
    await expect(
      page.getByRole("heading", { level: 2, name: "Rakım Kahve Kavurma" }),
    ).toBeVisible();
    await page.getByRole("link", { name: /^Paneli aç\s*: Rakım/ }).click();
    await expect(page).toHaveURL(/\/panel\/rakim$/);
  });
});

test("REQ-021: the second step is set up with a code and asked at the next sign-in", async ({
  page,
}) => {
  test.skip(test.info().project.name !== "desktop", "one account flow is enough");
  const user = await createPanelUser({
    tag: "iki-adim",
    membership: { venue: "rakim", role: "owner" },
  });
  try {
    await signIn(page, user);
    await expect(page).toHaveURL(/\/panel\/rakim$/);
    await page.goto("/panel/hesap");
    await page.getByLabel("Parolanız").fill(user.password);
    await page.getByRole("button", { name: "İki adımlı doğrulamayı aç" }).click();
    await expect(page.getByRole("img", { name: /QR kodu/ })).toBeVisible();
    await expect(
      page.getByRole("list", { name: "Yedek kodlar" }).getByRole("listitem"),
    ).toHaveCount(10);
    const key = (await page.locator("code").first().textContent()) ?? "";
    await page.getByLabel("Uygulamadaki kod").fill(totp(key));
    await page.getByRole("button", { name: "Doğrula ve aç" }).click();
    await expect(page.getByRole("status")).toContainText("İki adımlı doğrulama açıldı");

    await page.context().clearCookies();
    await signIn(page, user);
    await expect(page).toHaveURL(/\/panel\/giris\/dogrula$/);
    await page.getByLabel("Doğrulama kodu").fill("000000");
    await page.getByRole("button", { name: "Doğrula" }).first().click();
    await expect(page.getByText("Kod doğrulanamadı")).toBeVisible();
    await page.getByLabel("Doğrulama kodu").fill(totp(key));
    await page.getByRole("button", { name: "Doğrula" }).first().click();
    await expect(page).toHaveURL(/\/panel\/rakim$/);
  } finally {
    await removePanelUser(user);
  }
});

test("plan §8: a venue host has no panel", async ({ request }) => {
  test.skip(test.info().project.name !== "desktop", "runs once");
  const response = await request.get("/panel/giris", { headers: { host: venueHost("rakim") } });
  expect(response.status()).toBe(404);
  expect(response.headers()["set-cookie"]).toBeUndefined();
});

test.describe("panel layout and accessibility", () => {
  test("sign-in page: no overflow, targets and inputs, axe @responsive", async ({ page }) => {
    await page.goto("/panel/giris");
    expect.soft(await findOverflow(page)).toBeNull();
    expect.soft(await findSmallTargets(page)).toEqual([]);
    expect.soft(await findSmallInputs(page)).toEqual([]);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
      .analyze();
    expect(
      results.violations
        .filter((v) => v.impact === "serious" || v.impact === "critical")
        .map((v) => v.id),
    ).toEqual([]);
  });

  for (const path of ["/panel/rakim", "/panel/hesap"]) {
    test(`${path}: no overflow, targets and inputs, axe @responsive`, async ({ page }) => {
      await signInAsDemo(page, owner.label);
      await page.goto(path);
      expect.soft(await findOverflow(page)).toBeNull();
      expect.soft(await findSmallTargets(page)).toEqual([]);
      expect.soft(await findSmallInputs(page)).toEqual([]);
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
        .analyze();
      expect(
        results.violations
          .filter((v) => v.impact === "serious" || v.impact === "critical")
          .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`),
      ).toEqual([]);
    });
  }
});
