import { randomUUID } from "node:crypto";

import { expect, test } from "@playwright/test";

import {
  createPanelUser,
  ownClientAddress,
  removeDomain,
  removePanelUser,
  signIn,
  signInAsDemo,
} from "./panel-users";

/**
 * Platform admin (D-19; SCR-130…132, K-50). Changes only the fixture venue; no Vercel token
 * locally or on CI, so domains go through the manual path.
 */
test.beforeEach(async ({ page }) => {
  await ownClientAddress(page);
});

test("SCR-131: an admin adds a domain to a venue, confirms and removes it", async ({ page }) => {
  test.skip(test.info().project.name !== "desktop", "one account flow is enough");
  const admin = await createPanelUser({ tag: "platform", platformAdmin: true });
  const host = `menu-${randomUUID().slice(0, 8)}.test.example.com`;
  try {
    await signIn(page, admin);
    await expect(page).toHaveURL(/\/panel$/);
    await page.getByRole("complementary").getByRole("link", { name: "Mekân yönetimi" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Mekân yönetimi" })).toBeVisible();
    await page.getByRole("link", { name: /^Yönet\s*: Örnek Mekân/ }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Örnek Mekân" })).toBeVisible();

    await page.getByLabel("Yeni alan adı").fill(host);
    await page.getByRole("button", { name: "Alan adı ekle" }).click();
    await expect(page.getByRole("status").first()).toContainText("Alan adı eklendi");
    await expect(page.getByText(host, { exact: true })).toBeVisible();

    // The screen-reader suffix joins the name with a space ("Doğrula : host").
    await page.getByRole("button", { name: `Doğrula : ${host}` }).click();
    await expect(page.getByText("Alan adı etkin.")).toBeVisible();

    page.once("dialog", (dialog) => void dialog.accept());
    await page.getByRole("button", { name: `Kaldır : ${host}` }).click();
    await expect(page.getByText(host, { exact: true })).toHaveCount(0);
  } finally {
    await removePanelUser(admin);
    await removeDomain(host);
  }
});

test("the demo platform admin sees the platform and changes nothing", async ({ page }) => {
  await signInAsDemo(page, "Platform yöneticisi");
  await page.goto("/panel/platform/kullanicilar");
  await expect(page.getByRole("heading", { level: 1, name: "Kullanıcılar" })).toBeVisible();
  await expect(page.getByRole("note").filter({ hasText: "yalnızca görüntülenir" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Platform yöneticisi yap/ })).toHaveCount(0);
});

test("a venue owner gets the panel's 404 on platform pages", async ({ page }) => {
  test.skip(test.info().project.name !== "desktop", "runs once");
  const owner = await createPanelUser({
    tag: "sahip-plat",
    membership: { venue: "ornek", role: "owner" },
  });
  try {
    await signIn(page, owner);
    await expect(page).toHaveURL(/\/panel\/ornek$/);
    await page.goto("/panel/platform/mekanlar");
    await expect(page.getByRole("heading", { name: "Bu sayfaya ulaşılamıyor" })).toBeVisible();
  } finally {
    await removePanelUser(owner);
  }
});
