import { expect, test } from "@playwright/test";
import { resetMockApi } from "./helpers";

test.beforeEach(async ({ request }) => {
  await resetMockApi(request);
});

test("primary navigation and cart remain usable", async ({ page }) => {
  await page.goto("/");
  const navigation = page.getByRole("navigation", { name: "Основна навігація" });
  await expect(navigation).toBeVisible();

  for (const name of ["Головна", "Магазин", "Події", "Про мене"]) {
    const link = navigation.getByRole("link", { name });
    await link.scrollIntoViewIfNeeded();
    await expect(link).toBeVisible();
  }

  await navigation.getByRole("link", { name: "Магазин" }).click();
  await expect(page).toHaveURL(/\/books$/);
  await page.getByRole("link", { name: /Test Book/ }).first().click();
  await expect(page).toHaveURL(/\/books\/test-book$/);

  const cartButton = navigation.getByRole("button", { name: /Кошик/ });
  await cartButton.scrollIntoViewIfNeeded();
  await cartButton.click();
  await expect(page.getByRole("dialog", { name: "Кошик" })).toBeVisible();
});
