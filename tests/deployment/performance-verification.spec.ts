import { expect, test as base, type Locator, type Page } from "@playwright/test";
import { blockInvoiceWrites } from "../support/cutover-safety";
import { expectNoA11yViolations } from "../e2e/a11y";

// Explicit deployed verification only: never part of the deterministic local suite.
const test = base.extend<{ blockedInvoiceRequests: string[] }>({
  blockedInvoiceRequests: [async ({ context }, use, testInfo) => {
    const blocked = await blockInvoiceWrites(context);
    await use(blocked);
    await testInfo.attach("invoice-safety", {
      body: JSON.stringify({ blockedInvoiceRequests: blocked }), contentType: "application/json",
    });
    expect(blocked, "invalid checkout must not attempt an invoice write").toEqual([]);
  }, { auto: true }],
});
test.use({ serviceWorkers: "block" });
test.setTimeout(60_000);

const routes = ["/", "/books", "/about", "/events", "/return-policy",
  "/books/zvychajna", "/books/inaksha", "/books/zvychajna-and-inaksha",
  "/books/pid_shepit_snihu", "/books/brunette-stories", "/books/inaksha-art"];
const canonical = (process.env.CUTOVER_CANONICAL_BASE_URL ?? "https://zvychajna.pp.ua").replace(/\/$/, "");

async function trapFocus(page: Page, dialog: Locator) {
  await expect.poll(() => dialog.evaluate(node => node.contains(document.activeElement))).toBe(true);
  for (const key of ["Tab", "Shift+Tab"]) {
    for (let count = 0; count < 18; count += 1) {
      await page.keyboard.press(key);
      expect(await dialog.evaluate(node => node.contains(document.activeElement)), key).toBe(true);
    }
  }
}

for (const route of routes) {
  test(`deployed ${route} preserves layout, image delivery, metadata and accessible controls`, async ({ page, request }, testInfo) => {
    const fonts: string[] = [];
    page.on("request", req => { if (req.resourceType() === "font") fonts.push(req.url()); });
    const response = await page.goto(route);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const mainImage = page.getByRole("main").locator("img").first();
    if (await mainImage.count()) {
      await expect.poll(() => mainImage.evaluate(node => (node as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    }
    const evidence = await page.evaluate(() => ({
      width: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      images: [...document.querySelectorAll<HTMLImageElement>("main img")].map(img => ({
        alt: img.alt, src: img.currentSrc, loading: img.loading,
        priority: img.getAttribute("fetchpriority"), sizes: img.sizes,
        width: img.getBoundingClientRect().width, height: img.getBoundingClientRect().height,
        loaded: img.complete && img.naturalWidth > 0,
      })),
    }));
    expect(evidence.scrollWidth).toBeLessThanOrEqual(evidence.width + 1);
    const expectedViewport = testInfo.project.use.viewport?.width;
    if (expectedViewport) expect(evidence.width).toBeLessThanOrEqual(expectedViewport);
    expect(fonts.filter(url => /fontawesome|fa-(?:solid|regular|brands)/i.test(url)), "icon-font requests must stay absent").toEqual([]);
    if (route.startsWith("/books/") || route === "/books") {
      await expect(mainImage).toHaveAttribute("loading", "eager");
      await expect(mainImage).toHaveAttribute("fetchpriority", "high");
    }
    const html = await (await request.get(route)).text();
    expect(html).toMatch(/<title>[^<]+<\/title>/);
    expect(html).toMatch(/<meta name="description" content="[^"]+"/);
    expect(html).toContain(`<link rel="canonical" href="${canonical}${route === "/" ? "" : route}"`);
    if (route.startsWith("/books/")) {
      const jsonLd = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)]
        .map(match => JSON.parse(match[1]) as Record<string, unknown>);
      const products = jsonLd.filter(value => value["@type"] === "Product"
        || (Array.isArray(value["@type"]) && value["@type"].includes("Product")));
      expect(products).toHaveLength(1);
      expect(products[0].url).toBe(`${canonical}${route}`);
      expect(products[0].offers).toEqual(expect.arrayContaining([
        expect.objectContaining({ priceCurrency: "UAH" }),
      ]));
    }
    await testInfo.attach("route-evidence", {
      body: JSON.stringify({ route, ...evidence, fonts }), contentType: "application/json",
    });
    if (["/", "/books", "/about", "/events", "/books/zvychajna"].includes(route)) {
      const path = testInfo.outputPath("route.jpg");
      await page.screenshot({ path, fullPage: true, type: "jpeg", quality: 75 });
      await testInfo.attach("route-screenshot", { path, contentType: "image/jpeg" });
    }
    await expectNoA11yViolations(page, `deployed ${route}`);
  });
}

for (const format of ["Паперова", "Електронна"]) {
  test(`deployed ${format} cart and invalid checkout preserve focus and delivery fields`, async ({ page }) => {
    await page.goto("/books/zvychajna");
    await page.getByRole("radio", { name: new RegExp(format) }).check();
    const opener = page.getByRole("button", { name: /Купити/ });
    await opener.click();
    const cart = page.getByRole("dialog", { name: "Кошик", exact: true });
    await expect(cart).toBeVisible();
    await expectNoA11yViolations(page, `deployed ${format} cart`);
    await trapFocus(page, cart);
    if (format === "Електронна") {
      await expect(cart.getByRole("button", { name: "Збільшити кількість" })).toHaveCount(0);
    } else {
      await expect(cart.getByRole("button", { name: "Збільшити кількість" })).toBeVisible();
    }
    await cart.getByRole("button", { name: "Оформити замовлення" }).click();
    const checkout = page.getByRole("dialog", { name: "Оформлення замовлення", exact: true });
    await expect(checkout).toBeVisible();
    await expectNoA11yViolations(page, `deployed ${format} checkout`);
    await trapFocus(page, checkout);
    await checkout.getByRole("button", { name: "Підтвердити замовлення", exact: true }).click();
    for (const error of ["Введіть ім'я", "Введіть прізвище", "Введіть дійсний email"]) {
      await expect(checkout.getByText(error, { exact: true })).toBeVisible();
    }
    if (format === "Паперова") {
      await expect(checkout.getByText("Оберіть відділення Нової Пошти", { exact: true })).toBeVisible();
      await expect(checkout.getByRole("textbox", { name: /Телефон/ })).toBeVisible();
    } else {
      await expect(checkout.getByRole("textbox", { name: /Телефон/ })).toHaveCount(0);
      await expect(checkout.getByText("Оберіть відділення Нової Пошти", { exact: true })).toHaveCount(0);
    }
    await expectNoA11yViolations(page, `deployed ${format} invalid checkout`);
    await page.keyboard.press("Escape");
    await expect(checkout).toBeHidden();
    await expect(opener).toBeFocused();
  });
}

test("deployed mixed-cart totals and quantity rules remain consistent", async ({ page }) => {
  await page.goto("/books/zvychajna");
  const price = async (format: string) => Number((await page.getByRole("radio", { name: new RegExp(format) })
    .evaluate(node => node.closest("label")?.textContent))?.match(/([\d.]+)\s*грн/)?.[1]);
  const paper = await price("Паперова");
  const digital = await price("Електронна");
  expect(Number.isFinite(paper) && Number.isFinite(digital)).toBe(true);
  await page.getByRole("button", { name: "Додати в кошик", exact: true }).click();
  await page.getByRole("radio", { name: /Електронна/ }).check();
  await page.getByRole("button", { name: "Додати в кошик", exact: true }).click();
  await page.getByRole("navigation").getByRole("button", { name: /Кошик/ }).click();
  const cart = page.getByRole("dialog", { name: "Кошик", exact: true });
  const total = cart.locator('[class*="totalValue"]');
  await expect(total).toHaveText(`${paper + digital} грн`);
  await expect(cart.getByRole("button", { name: "Збільшити кількість" })).toHaveCount(1);
  await cart.getByRole("button", { name: "Збільшити кількість" }).click();
  await expect(total).toHaveText(`${paper * 2 + digital} грн`);
  await cart.getByRole("button", { name: "Зменшити кількість" }).click();
  await cart.getByRole("button", { name: "Зменшити кількість" }).click();
  await expect(total).toHaveText(`${paper + digital} грн`);
});

test("deployed checkout code loads on first cart use", async ({ page }) => {
  const scripts: Promise<string>[] = [];
  page.on("response", response => {
    if (response.request().resourceType() === "script" && response.url().includes("/_next/static/chunks/")) {
      scripts.push(response.text().catch(() => ""));
    }
  });
  await page.goto("/return-policy");
  await page.waitForLoadState("networkidle");
  expect((await Promise.all(scripts)).some(code => code.includes("Відділення Нової Пошти"))).toBe(false);
  await page.getByRole("navigation").getByRole("button", { name: /Кошик/ }).click();
  await expect.poll(async () => (await Promise.all(scripts)).some(code => code.includes("Відділення Нової Пошти"))).toBe(true);
});

test("deployed gallery and excerpt retain lazy loading, keyboard focus and accessibility", async ({ page, request }, testInfo) => {
  const html = await (await request.get("/books/inaksha-art")).text();
  expect((html.match(/<img\b[^>]*>/g) ?? []).filter(tag => tag.includes("inaksha-art"))).toHaveLength(1);
  await page.goto("/books/inaksha-art");
  const gallery = page.getByRole("group", { name: /Зображення:/ });
  await page.getByRole("button", { name: "Наступне фото", exact: true }).click();
  await expect(gallery.locator("img").nth(1)).toHaveAttribute("loading", "lazy");
  await expect.poll(() => gallery.locator("img").nth(1).evaluate(node => (node as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  await page.goto("/books/zvychajna");
  const opener = page.getByRole("button", { name: "Читати уривок", exact: true });
  const excerptResponse = page.waitForResponse(response => response.url().endsWith("/content/excerpts/zvychajna.html"));
  await opener.click();
  expect((await excerptResponse).ok()).toBe(true);
  const excerpt = page.getByRole("dialog", { name: /Читати уривок/ });
  await expect(excerpt).toBeVisible();
  await expect(excerpt.getByText("Завантаження...", { exact: true })).toBeHidden();
  await expect(excerpt.locator('[class*="body"] p').first()).toBeVisible();
  await expect(excerpt).not.toContainText(/тимчасово недоступний|Помилка завантаження/);
  await trapFocus(page, excerpt);
  const scrollRegion = await excerpt.locator('[class*="body"]').evaluate(node => ({
    clientHeight: node.clientHeight, scrollHeight: node.scrollHeight,
    tabIndex: (node as HTMLElement).tabIndex,
  }));
  await page.keyboard.press("Escape");
  await expect(excerpt).toBeHidden();
  await expect(opener).toBeFocused();
  await testInfo.attach("gallery-excerpt-behavior", {
    body: JSON.stringify({ galleryNavigation: "passed", focusTrap: "passed", escape: "passed", focusRestoration: "passed", scrollRegion }),
    contentType: "application/json",
  });
  const reopenedResponse = page.waitForResponse(response => response.url().endsWith("/content/excerpts/zvychajna.html"));
  await opener.click();
  expect((await reopenedResponse).ok()).toBe(true);
  await expect(excerpt.getByText("Завантаження...", { exact: true })).toBeHidden();
  await expect(excerpt.locator('[class*="body"] p').first()).toBeVisible();
  await expectNoA11yViolations(page, "deployed loaded excerpt");
});

test("deployed portrait reserves its ratio and leading event photos retain priority", async ({ page }) => {
  let releaseImage!: () => void;
  const imageReady = new Promise<void>(resolve => { releaseImage = resolve; });
  await page.route("**/_next/image?**", async route => { await imageReady; await route.continue(); });
  try {
    await page.goto("/about", { waitUntil: "domcontentloaded" });
    const portrait = page.getByRole("img", { name: "Лілія Кухарець", exact: true });
    const before = await portrait.boundingBox();
    expect(before).not.toBeNull();
    expect(before!.height / before!.width).toBeCloseTo(4 / 3, 2);
    releaseImage();
    await expect.poll(() => portrait.evaluate(node => (node as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    const after = await portrait.boundingBox();
    expect(after!.height).toBeCloseTo(before!.height, 0);
    expect(after!.width).toBeCloseTo(before!.width, 0);
  } finally { releaseImage(); }
  await page.unroute("**/_next/image?**");
  await page.goto("/events");
  const galleries = page.getByRole("group", { name: /Зображення події:/ });
  expect(await galleries.count()).toBeGreaterThanOrEqual(3);
  for (let index = 0; index < 2; index += 1) {
    await expect(galleries.nth(index).locator("img").first()).toHaveAttribute("loading", "eager");
    await expect(galleries.nth(index).locator("img").first()).toHaveAttribute("fetchpriority", "high");
  }
  await expect(galleries.nth(2).locator("img").first()).toHaveAttribute("loading", "lazy");
});
