import { expect, test } from "@playwright/test";

// Temporary CI diagnostic: removed after the upload and cancellation paths are verified.
test("ZVY-30 diagnostic probe captures a failed browser test", async ({ page }) => {
  await page.goto("/books/test-book");
  await expect(page.getByRole("heading", { name: "Test Book", exact: true })).toBeVisible();
  expect("controlled artifact probe").toBe("expected diagnostic failure");
});
