import { expect, test } from "@playwright/test";

import { createPanelUser, ownClientAddress, removePanelUser, signIn } from "./panel-users";
import { venueUrl } from "./routes";

/**
 * Panel availability on the phone (D-20; REQ-022, plan §12 "en sık iş" 1). Runs on the mobile
 * project only, on a fixture product other specs do not read (Ezogelin çorbası).
 */
const PRODUCT = "Ezogelin çorbası";

test.beforeEach(async ({ page }) => {
  await ownClientAddress(page);
});

test("@mobile staff mark a product sold out in one tap; the menu shows it; undo brings it back", async ({
  page,
}) => {
  test.skip(test.info().project.name !== "mobile", "phone flow");
  const staff = await createPanelUser({
    tag: "musait",
    membership: { venue: "ornek", role: "staff" },
  });
  try {
    await signIn(page, staff);
    await expect(page).toHaveURL(/\/panel\/ornek$/);
    await page
      .getByRole("navigation", { name: "Panel sekmeleri" })
      .getByRole("link", { name: "Müsaitlik" })
      .click();
    await page.getByRole("searchbox", { name: "Ürün ara" }).fill("ezogelin");
    await page.getByRole("button", { name: `Tükendi : ${PRODUCT}` }).click();
    await expect(page.getByText("Gün sonuna kadar tükendi")).toBeVisible();
    await expect(page.getByRole("button", { name: `Geri al : ${PRODUCT}` })).toBeVisible();

    const visitor = await page.context().newPage();
    await visitor.goto(venueUrl("ornek"));
    await expect(visitor.getByRole("listitem").filter({ hasText: PRODUCT }).first()).toContainText(
      "Tükendi",
    );
    await visitor.close();

    await page.getByRole("button", { name: `Geri al : ${PRODUCT}` }).click();
    await expect(page.getByText("Yeniden serviste")).toBeVisible();
    await expect(page.getByRole("button", { name: `Tükendi : ${PRODUCT}` })).toBeVisible();
  } finally {
    await removePanelUser(staff);
  }
});
