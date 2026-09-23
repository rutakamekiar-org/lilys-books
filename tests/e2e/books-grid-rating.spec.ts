import { expect, test, type Locator, type Page } from "@playwright/test";
import { mockApiUrl, resetMockApi } from "./helpers";

function bookCard(page: Page, name: string): Locator {
  return page.getByRole("article").filter({
    has: page.getByRole("heading", { name, exact: true }),
  });
}

async function expectContainedBy(child: Locator, parent: Locator) {
  const [childBox, parentBox] = await Promise.all([child.boundingBox(), parent.boundingBox()]);
  expect(childBox).not.toBeNull();
  expect(parentBox).not.toBeNull();

  expect(childBox!.x).toBeGreaterThanOrEqual(parentBox!.x - 1);
  expect(childBox!.y).toBeGreaterThanOrEqual(parentBox!.y - 1);
  expect(childBox!.x + childBox!.width).toBeLessThanOrEqual(parentBox!.x + parentBox!.width + 1);
  expect(childBox!.y + childBox!.height).toBeLessThanOrEqual(parentBox!.y + parentBox!.height + 1);
}

test.beforeEach(async ({ request }) => {
  await resetMockApi(request);
});

test("shows embedded Goodreads data and omits the label when data is unavailable", async ({ page }) => {
  const ratingRequests: string[] = [];
  page.on("request", request => {
    if (request.url().includes("/api/ratings/") || request.url().includes("goodreads.com")) {
      ratingRequests.push(request.url());
    }
  });

  await page.goto("/books");

  const ratedCard = bookCard(page, "Test Book");
  const rating = ratedCard.getByLabel(/4\.25 з 5 на Goodreads/);
  await expect(rating).toBeVisible();
  await expect(rating).toHaveText("4.25· 120");

  const unratedCard = bookCard(page, "Unavailable Book");
  await expect(unratedCard.getByLabel(/Goodreads/)).toHaveCount(0);
  expect(ratingRequests).toEqual([]);
});

test("keeps the ratings count when Goodreads has no review count", async ({ page, request }) => {
  const state = await (await request.get(`${mockApiUrl}/__control/state`)).json();
  const product = state.products.find((candidate: { slug: string }) => candidate.slug === "test-book");
  expect(product).toBeDefined();
  await request.post(`${mockApiUrl}/__control/products`, {
    data: {
      ...product,
      externalBookRatings: [{ ...product.externalBookRatings[0], reviewsCount: null }],
    },
  });

  await page.goto("/books");
  await expect(bookCard(page, "Test Book").getByLabel(/120 оцінок/)).toHaveText("4.25· 120");
});

test("uses the detail page's star shape and color", async ({ page }) => {
  await page.goto("/books");
  const cardStar = bookCard(page, "Test Book")
    .getByLabel(/4\.25 з 5 на Goodreads/)
    .locator("span[aria-hidden='true']").first();
  const cardStyle = await cardStar.evaluate(element => ({
    mask: getComputedStyle(element).maskImage,
    fill: getComputedStyle(element, "::before").backgroundColor,
  }));

  await page.goto("/books/test-book");
  const detailStar = page.getByRole("link", { name: /4\.25 з 5 на Goodreads/ })
    .locator("span[aria-hidden='true']").first();
  const detailStyle = await detailStar.evaluate(element => ({
    mask: getComputedStyle(element).maskImage,
    fill: getComputedStyle(element, "::before").backgroundColor,
  }));

  expect(cardStyle.mask).toContain("url(");
  expect(cardStyle).toEqual(detailStyle);
});

test("keeps the rating readable and separate from essential card content", async ({ page }) => {
  for (const viewport of [{ width: 1280, height: 900 }, { width: 320, height: 720 }]) {
    await page.setViewportSize(viewport);
    await page.goto("/books");

    const card = bookCard(page, "Test Book");
    const title = card.getByRole("heading", { name: "Test Book", exact: true });
    const rating = card.getByLabel(/4\.25 з 5 на Goodreads/);
    const formats = card.getByRole("group", { name: "Формати книги Test Book" });

    await expect(rating).toBeVisible();
    await expectContainedBy(rating, card);

    const [titleBox, ratingBox, formatsBox] = await Promise.all([
      title.boundingBox(),
      rating.boundingBox(),
      formats.boundingBox(),
    ]);
    expect(titleBox).not.toBeNull();
    expect(ratingBox).not.toBeNull();
    expect(formatsBox).not.toBeNull();
    expect(ratingBox!.y).toBeGreaterThanOrEqual(titleBox!.y + titleBox!.height - 1);
    expect(ratingBox!.y + ratingBox!.height).toBeLessThanOrEqual(formatsBox!.y + 1);

    const singleOptionCard = bookCard(page, "Unavailable Book");
    const singleTitle = singleOptionCard.getByRole("heading", { name: "Unavailable Book" });
    const singleFormats = singleOptionCard.getByRole("group", { name: "Формати книги Unavailable Book" });
    const [singleCardBox, singleTitleBox, singleFormatsBox] = await Promise.all([
      singleOptionCard.boundingBox(),
      singleTitle.boundingBox(),
      singleFormats.boundingBox(),
    ]);
    expect(singleCardBox).not.toBeNull();
    expect(singleTitleBox).not.toBeNull();
    expect(singleFormatsBox).not.toBeNull();
    expect(Math.abs(formatsBox!.y - singleFormatsBox!.y)).toBeLessThanOrEqual(1);
    const spaceAboveOptions = singleFormatsBox!.y - (singleTitleBox!.y + singleTitleBox!.height);
    const spaceBelowOptions = singleCardBox!.y + singleCardBox!.height -
      (singleFormatsBox!.y + singleFormatsBox!.height);
    expect(spaceAboveOptions).toBeLessThan(80);
    expect(spaceBelowOptions).toBeGreaterThan(20);
  }
});

test("preserves product navigation and quick-add actions", async ({ page }) => {
  await page.goto("/books");
  const card = bookCard(page, "Test Book");

  await card.getByRole("button", { name: "Додати в кошик: Паперова, Test Book" }).click();
  await expect(card.getByRole("button", { name: "Вже в кошику: Паперова, Test Book" })).toBeVisible();

  await card.getByRole("link", { name: /Test Book/ }).click();
  await expect(page).toHaveURL(/\/books\/test-book$/);
});
