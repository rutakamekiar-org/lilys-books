import { expect, test } from "@playwright/test";
import { makeProduct, mockApiUrl, resetMockApi } from "./helpers";

test.beforeEach(async ({ request }) => {
  await resetMockApi(request);
});

test("initial content and icons render without JavaScript or icon font requests", async ({ browser, baseURL }, testInfo) => {
  const context = await browser.newContext({
    baseURL,
    javaScriptEnabled: false,
    viewport: testInfo.project.use.viewport,
  });
  const page = await context.newPage();
  const fontRequests: string[] = [];
  page.on("request", request => {
    if (request.resourceType() === "font") fontRequests.push(request.url());
  });
  try {
    for (const path of ["/", "/books", "/books/test-book", "/books/brunette-stories", "/about", "/events", "/return-policy", "/missing-page"]) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      const cart = page.getByRole("button", { name: /Кошик/ });
      await cart.scrollIntoViewIfNeeded();
      await expect(cart.locator("svg")).toBeVisible();
      await expect(cart.locator("svg")).toHaveAttribute("aria-hidden", "true");
      await expect(page.getByRole("link", { name: "Instagram", exact: true }).locator("svg")).toBeVisible();
    }
    expect(fontRequests).toEqual([]);
  } finally {
    await context.close();
  }
});

test("portrait reserves its actual aspect ratio before its image arrives", async ({ page }) => {
  let releaseImage!: () => void;
  const imageReady = new Promise<void>(resolve => { releaseImage = resolve; });
  await page.route("**/_next/image?**", async route => {
    await imageReady;
    await route.continue();
  });
  try {
    await page.goto("/about", { waitUntil: "domcontentloaded" });
    const portrait = page.getByRole("img", { name: "Лілія Кухарець", exact: true });
    await expect(portrait).toBeVisible();
    const before = await portrait.boundingBox();
    expect(before).not.toBeNull();
    expect(before!.height / before!.width).toBeCloseTo(4 / 3, 2);
    releaseImage();
    await expect.poll(() => portrait.evaluate(node => (node as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    const after = await portrait.boundingBox();
    expect(after).not.toBeNull();
    expect(after!.height).toBeCloseTo(before!.height, 0);
    expect(after!.width).toBeCloseTo(before!.width, 0);
  } finally {
    releaseImage();
  }
});

test("leading event photos are prioritized while later cards and slides stay deferred", async ({ page }) => {
  await page.goto("/events");
  const galleries = page.getByRole("group", { name: /Зображення події:/ });
  await expect(galleries).toHaveCount(3);
  for (let index = 0; index < 2; index += 1) {
    const cover = galleries.nth(index).locator("img").first();
    await expect(cover).toHaveAttribute("loading", "eager");
    await expect(cover).toHaveAttribute("fetchpriority", "high");
  }
  await expect(galleries.nth(2).locator("img").first()).toHaveAttribute("loading", "lazy");
  await expect(galleries.nth(2).locator("img").first()).not.toHaveAttribute("fetchpriority", "high");
  await page.getByRole("button", { name: "Наступне фото" }).first().click();
  await expect(galleries.first().locator("img").nth(1)).toHaveAttribute("loading", "lazy");
  await expect(galleries.first().locator("img").nth(1)).not.toHaveAttribute("fetchpriority", "high");
});

test("checkout code waits for cart use and first-use checkout retains focus and validation", async ({ page }) => {
  const scripts: Promise<string>[] = [];
  page.on("response", response => {
    if (response.request().resourceType() === "script" && response.url().includes("/_next/static/chunks/")) {
      scripts.push(response.text());
    }
  });
  await page.goto("/return-policy");
  await page.waitForLoadState("networkidle");
  expect((await Promise.all(scripts)).some(code => code.includes("Відділення Нової Пошти"))).toBe(false);
  await page.getByRole("link", { name: "Магазин", exact: true }).click();
  await page.getByRole("button", { name: "Додати в кошик: Електронна, Test Book", exact: true }).click();
  const cartButton = page.getByRole("button", { name: "Кошик, 1 товарів", exact: true });
  await cartButton.click();
  await expect.poll(async () => (await Promise.all(scripts)).some(code => code.includes("Відділення Нової Пошти"))).toBe(true);
  await page.getByRole("button", { name: "Оформити замовлення", exact: true }).click();
  const checkout = page.getByRole("dialog", { name: "Оформлення замовлення", exact: true });
  await expect(checkout.getByRole("button", { name: "Закрити", exact: true })).toBeFocused();
  await checkout.getByRole("button", { name: "Підтвердити замовлення", exact: true }).click();
  await expect(checkout.getByRole("textbox", { name: /^Email/ })).toHaveAttribute("aria-invalid", "true");
  await page.keyboard.press("Escape");
  await expect(checkout).not.toBeVisible();
  await expect(cartButton).toBeFocused();
});

test("seasonal animation still appears in winter", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-01-15T12:00:00Z") });
  await page.goto("/return-policy");
  await expect(page.locator("canvas")).toHaveCount(1);
});

test("initial catalog covers are eager and subsequent covers stay lazy", async ({ page }) => {
  await page.goto("/books");
  const covers = page.getByRole("main").getByRole("img");
  await expect(covers).toHaveCount(3);
  for (let index = 0; index < 2; index += 1) {
    await expect(covers.nth(index)).toHaveAttribute("loading", "eager");
    await expect(covers.nth(index)).toHaveAttribute("fetchpriority", "high");
  }
  await expect(covers.nth(2)).toHaveAttribute("loading", "lazy");
  await expect(covers.nth(2)).not.toHaveAttribute("fetchpriority", "high");
});

test("product cover is discoverable before hydration without preloading the gallery", async ({ browser, baseURL, request }, testInfo) => {
  const product = makeProduct({
    imageUrls: [1, 2, 3, 4].map(index => `/images/products/inaksha-art/inaksha-art${index}.webp`),
  });
  expect((await request.post(`${mockApiUrl}/__control/products`, { data: product })).ok()).toBe(true);
  const context = await browser.newContext({ baseURL, javaScriptEnabled: false, viewport: testInfo.project.use.viewport });
  try {
    const page = await context.newPage();
    await page.goto(`/books/${product.slug}`);
    const gallery = page.getByRole("group", { name: `Зображення: ${product.name}` });
    await expect(gallery.locator("img")).toHaveCount(1);
    await expect(gallery.locator("img")).toHaveAttribute("loading", "eager");
    await expect(gallery.locator("img")).toHaveAttribute("fetchpriority", "high");
    const laterCoverRequests: string[] = [];
    page.on("request", request => {
      if (/inaksha-art[234]/.test(decodeURIComponent(request.url()))) laterCoverRequests.push(request.url());
    });
    await page.reload();
    expect(laterCoverRequests).toEqual([]);
  } finally {
    await context.close();
  }
});

test("gallery navigation loads later slides lazily", async ({ page }) => {
  await page.goto("/books/brunette-stories");
  const gallery = page.getByRole("group", { name: "Зображення: Excerpt Book" });
  await page.getByRole("button", { name: "Наступне фото" }).click();
  await expect(gallery.locator("img").nth(1)).toHaveAttribute("loading", "lazy");
  await expect(gallery.locator("img").nth(1)).not.toHaveAttribute("fetchpriority", "high");
});

test("API external links keep their labels and visible decorative SVG icons", async ({ page, request }) => {
  const product = makeProduct({
    externalLinks: [
      { label: "Відео", icon: "fa-brands fa-youtube", url: "https://example.invalid/video" },
      { label: "Збірка", icon: "fa-solid fa-book", url: "https://example.invalid/book" },
      { label: "Інший ресурс", icon: "fa-solid fa-unknown", url: "https://example.invalid/other" },
      { label: "Без значка", icon: null, url: "https://example.invalid/no-icon" },
    ],
  });
  expect((await request.post(`${mockApiUrl}/__control/products`, { data: product })).ok()).toBe(true);
  await page.goto(`/books/${product.slug}`);
  for (const label of ["Відео", "Збірка", "Інший ресурс", "Без значка"]) {
    const link = page.getByRole("link", { name: label, exact: true }).filter({ visible: true });
    await link.scrollIntoViewIfNeeded();
    await expect(link.locator("svg")).toBeVisible();
    await expect(link.locator("svg")).toHaveAttribute("aria-hidden", "true");
    await expect(link).toHaveAttribute("target", "_blank");
  }
});
