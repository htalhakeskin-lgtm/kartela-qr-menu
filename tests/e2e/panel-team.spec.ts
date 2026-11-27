import { randomUUID } from "node:crypto";

import { expect, test } from "@playwright/test";

import { DEMO_VENUE_ACCOUNTS } from "../../src/config/demo-accounts";
import {
  createPanelUser,
  latestOutbox,
  ownClientAddress,
  removePanelUser,
  removeUserByEmail,
  signIn,
  signInAsDemo,
} from "./panel-users";

/**
 * Panel foundation II (D-18b; SCR-117…119, plan §8, BR-YTK-003 in the integration suite):
 * invitation → acceptance → sign-in, settings, the audit log and password reset, against the
 * running server and its demo outbox (PLATFORM_DEMO=true: no e-mail leaves the system).
 */
const staff = DEMO_VENUE_ACCOUNTS.find((account) => account.role === "staff");
if (!staff) throw new Error("demo staff account missing");

test.beforeEach(async ({ page }) => {
  await ownClientAddress(page);
});

test("SCR-118: an owner invites, the invitee sets a password and lands on the venue", async ({
  page,
  browser,
}) => {
  test.skip(test.info().project.name !== "desktop", "one account flow is enough");
  const owner = await createPanelUser({
    tag: "davet-eden",
    membership: { venue: "ornek", role: "owner" },
  });
  const invitee = `e2e-davetli-${randomUUID().slice(0, 8)}@test.example.com`;
  try {
    await signIn(page, owner);
    await expect(page).toHaveURL(/\/panel\/ornek$/);
    await page.goto("/panel/ornek/ekip");
    await page.getByLabel("E-posta").fill(invitee);
    await page.getByLabel("Rol", { exact: true }).selectOption("staff");
    await page.getByRole("button", { name: "Davet gönder" }).click();
    await expect(page.getByRole("status")).toContainText(`Davet ${invitee} adresine gönderildi`);
    await expect(
      page.getByRole("region", { name: "Bekleyen davetler" }).getByText(invitee, { exact: true }),
    ).toBeVisible();

    const { acceptUrl } = await latestOutbox(invitee, "panelInvitation");
    const guest = await browser.newContext();
    const guestPage = await guest.newPage();
    await ownClientAddress(guestPage);
    const response = await guestPage.goto(acceptUrl ?? "");
    expect(response?.headers()["referrer-policy"]).toBe("no-referrer");
    await expect(guestPage.getByRole("heading", { level: 1 })).toContainText("ekibine davet");
    await guestPage.getByLabel("Adınız ve soyadınız").fill("Deniz Davetli");
    const password = `e2e-yeni-parola-${randomUUID()}`;
    await guestPage.getByLabel("Parola", { exact: true }).fill(password);
    await guestPage.getByLabel("Parola (tekrar)").fill(password);
    await guestPage.getByRole("button", { name: "Daveti kabul et" }).click();
    await expect(guestPage).toHaveURL(/\/panel\/ornek$/);
    await expect(guestPage.getByRole("link", { name: "Ayarlar" })).toHaveCount(0);

    // The used link does not open again.
    await guestPage.goto(acceptUrl ?? "");
    await expect(guestPage.getByRole("heading", { name: "Davet geçersiz" })).toBeVisible();
    await guest.close();

    await page.goto("/panel/ornek/ekip");
    await expect(
      page.getByRole("region", { name: /^Üyeler/ }).getByText("Deniz Davetli", { exact: true }),
    ).toBeVisible();
    await page.goto("/panel/ornek/gecmis?grup=members");
    await expect(page.getByText("ekibe katıldı").first()).toBeVisible();
    await expect(page.getByText("ekibe davet etti").first()).toBeVisible();
  } finally {
    await removePanelUser(owner);
    await removeUserByEmail(invitee);
  }
});

test("SCR-117: a failed save keeps what was typed; a save shows the result", async ({ page }) => {
  test.skip(test.info().project.name !== "desktop", "one account flow is enough");
  const owner = await createPanelUser({
    tag: "ayar",
    membership: { venue: "ornek", role: "owner" },
  });
  try {
    await signIn(page, owner);
    await expect(page).toHaveURL(/\/panel\/ornek$/);
    await page.goto("/panel/ornek/ayarlar");
    const address = page.getByLabel("Adres", { exact: true });
    const before = await address.inputValue();
    await page.getByLabel("Telefon", { exact: true }).fill("123");
    await page.getByRole("button", { name: "Kaydet" }).click();
    await expect(
      page.getByText("Telefon numarasını 0532 123 45 67 biçiminde girin."),
    ).toBeVisible();
    await expect(page.getByLabel("Telefon", { exact: true })).toHaveValue("123");
    await expect(address).toHaveValue(before);

    await page.reload(); // the stored values again
    await page.getByRole("button", { name: "Kaydet" }).click();
    await expect(page.getByRole("status")).toContainText("Ayarlar kaydedildi");
  } finally {
    await removePanelUser(owner);
  }
});

test("plan §8: staff do not see settings, team or audit; a typed address says why", async ({
  page,
}) => {
  await signInAsDemo(page, staff.label);
  for (const name of ["Ayarlar", "Ekip", "İşlem geçmişi"]) {
    await expect(page.getByRole("link", { name, exact: true })).toHaveCount(0);
  }
  await page.goto("/panel/rakim/ayarlar");
  await expect(page.getByText("Bu sayfa için rolünüzün yetkisi yok.")).toBeVisible();
});

test("password reset: the link sets a new password, the old one stops working", async ({
  page,
}) => {
  test.skip(test.info().project.name !== "desktop", "one account flow is enough");
  const user = await createPanelUser({
    tag: "sifre",
    membership: { venue: "rakim", role: "staff" },
  });
  try {
    await page.goto("/panel/giris");
    await page.getByRole("link", { name: "Parolamı unuttum" }).click();
    await expect(page).toHaveURL(/\/panel\/giris\/sifre$/);
    await expect(page.getByRole("heading", { level: 1, name: "Parolamı unuttum" })).toBeVisible();
    await page.getByLabel("E-posta").fill(user.email);
    await page.getByRole("button", { name: "Bağlantı gönder" }).click();
    // The answer waits for the e-mail to be written; on a loaded CI runner that can pass 5 s.
    await expect(page.getByRole("status")).toContainText("Bu adrese ait bir hesap varsa", {
      timeout: 15_000,
    });

    // Better Auth may send the reset e-mail after answering: wait for the outbox.
    let resetUrl = "";
    await expect
      .poll(async () => {
        resetUrl =
          (await latestOutbox(user.email, "passwordReset").catch(() => null))?.resetUrl ?? "";
        return resetUrl;
      })
      .toContain("/panel/giris/sifre/yeni?belirtec=");
    const newPassword = `e2e-yenilenen-${randomUUID()}`;
    await page.goto(resetUrl);
    await page.getByLabel("Yeni parola", { exact: true }).fill(newPassword);
    await page.getByLabel("Yeni parola (tekrar)").fill(newPassword);
    await page.getByRole("button", { name: "Parolayı kaydet" }).click();
    await expect(page).toHaveURL(/\/panel\/giris\?parola=yenilendi$/);

    await signIn(page, user);
    await expect(page.locator("form").getByRole("alert")).toHaveText(
      "E-posta ya da parola hatalı.",
    );
    await signIn(page, { email: user.email, password: newPassword });
    await expect(page).toHaveURL(/\/panel\/rakim$/);
  } finally {
    await removePanelUser(user);
  }
});

test("an unknown address gets the same answer and no e-mail", async ({ page }) => {
  test.skip(test.info().project.name !== "desktop", "runs once");
  await page.goto("/panel/giris/sifre");
  await page.getByLabel("E-posta").fill(`kimse-${randomUUID().slice(0, 8)}@test.example.com`);
  await page.getByRole("button", { name: "Bağlantı gönder" }).click();
  await expect(page.getByRole("status")).toContainText("Bu adrese ait bir hesap varsa");
});
