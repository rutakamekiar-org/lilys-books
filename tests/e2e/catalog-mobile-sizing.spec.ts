import { expect, test, type Locator, type Page } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import baseline from "../../docs/storefront-baseline/catalog-snapshot.json";
import { makeProduct, mockApiUrl, resetMockApi } from "./helpers";

function card(page: Page, name: string) {
  return page.getByRole("article").filter({ has: page.getByRole("heading", { name, exact: true }) });
}

async function contained(child: Locator, parent: Locator) {
  await expect(child).toBeVisible();
  const [inner, outer] = await Promise.all([child.boundingBox(), parent.boundingBox()]);
  expect(inner).not.toBeNull();
  expect(outer).not.toBeNull();
  expect(inner!.x).toBeGreaterThanOrEqual(outer!.x);
  expect(inner!.x + inner!.width).toBeLessThanOrEqual(outer!.x + outer!.width);
  expect(inner!.y).toBeGreaterThanOrEqual(outer!.y);
  expect(inner!.y + inner!.height).toBeLessThanOrEqual(outer!.y + outer!.height);
  expect(await child.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
}

async function selection(page: Page, expected: { itemId: string; quantity: number; format: string }[]) {
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("cart") ?? "[]")
    .map((item: { itemId: string; quantity: number; format: string }) => ({
      itemId: item.itemId, quantity: item.quantity, format: item.format,
    })))).toEqual(expected);
}

test.beforeEach(async ({ page, request }) => {
  await resetMockApi(request);
  await page.route("**/*", route => ["127.0.0.1", "localhost"].includes(new URL(route.request().url()).hostname)
    ? route.continue() : route.abort());
});

for (const width of [320, 360, 390, 520, 521, 640, 768, 1440]) {
  test.describe(`catalog sizing at ${width}px`, () => {
    test.use({ viewport: { width, height: width === 1440 ? 900 : 844 }, hasTouch: width <= 520 });

    test("keeps full formats and prices contained with separate edition targets", async ({ page, request }) => {
      const merchandise = makeProduct({
        type: 2, name: "Long-label merchandise", slug: "long-label-merchandise",
        items: [{ ...makeProduct().items[0], name: "Колекційні листівки-ілюстрації", price: 12345.67 }],
      });
      expect((await request.post(`${mockApiUrl}/__control/products`, { data: merchandise })).ok()).toBe(true);
      await page.goto("/books");
      await expect(card(page, merchandise.name)).toBeVisible();
      await page.evaluate(() => document.fonts.ready);

      const pageTitle = page.getByRole("heading", { name: "Книги та мерч", exact: true });
      const headingStyle = await pageTitle.evaluate(element => ({
        size: parseFloat(getComputedStyle(element).fontSize),
        weight: parseFloat(getComputedStyle(element).fontWeight),
      }));
      expect(headingStyle.weight).toBeGreaterThanOrEqual(700);
      if (width <= 520) {
        expect(headingStyle.size).toBeGreaterThanOrEqual(28);
        expect(headingStyle.size).toBeLessThanOrEqual(30);
        expect(headingStyle.size).toBeGreaterThan(await page.getByRole("heading", { level: 2 }).first()
          .evaluate(element => parseFloat(getComputedStyle(element).fontSize)));
      } else expect(headingStyle.size).toBe(32);

      const cards = page.getByRole("article");
      const first = await cards.nth(0).boundingBox();
      const second = await cards.nth(1).boundingBox();
      expect(first).not.toBeNull();
      expect(second).not.toBeNull();
      expect(first!.y).toBe(second!.y);
      expect(second!.x).toBeGreaterThan(first!.x + first!.width);
      if (width <= 520) {
        const third = await cards.nth(2).boundingBox();
        expect(third!.y).toBeGreaterThan(first!.y);
        expect(third!.x).toBe(first!.x);
      }

      // Check ordinary, digital, unavailable and long merchandise formats. The
      // long-label fixture exercises mobile wrapping; desktop retains its layout.
      const checkedCards = width <= 520 ? cards : cards.filter({ hasNot: page.getByRole("heading", { name: merchandise.name }) });
      for (const book of await checkedCards.all()) {
        const rows = book.locator('[class*="formatRow"]');
        let previousButtonBottom = 0;
        let previousPriceBottom: number | null = null;
        for (const row of await rows.all()) {
          const label = row.locator('[class*="formatName"]');
          const price = row.locator('[class*="formatPrice"]');
          const button = row.getByRole("button");
          await contained(button, row);
          const buttonBox = (await button.boundingBox())!;
          expect(buttonBox.y).toBeGreaterThanOrEqual(previousButtonBottom);
          previousButtonBottom = buttonBox.y + buttonBox.height;
          if (width <= 520) {
            await contained(label, row);
            await contained(price, row);
            const textBounds = (element: Element) => {
              const range = document.createRange();
              range.selectNodeContents(element);
              const { x, y, width, height } = range.getBoundingClientRect();
              return { x, y, width, height };
            };
            const labelBox = await label.evaluate(textBounds);
            const priceBox = await price.evaluate(textBounds);
            expect(priceBox.y - (labelBox.y + labelBox.height),
              `Label ${await label.textContent()} and price ${await price.textContent()} must not overlap: ${JSON.stringify({ labelBox, priceBox, buttonBox })}`)
              .toBeGreaterThanOrEqual(0);
            expect(labelBox.x + labelBox.width).toBeLessThanOrEqual(buttonBox.x);
            expect(priceBox.x + priceBox.width).toBeLessThanOrEqual(buttonBox.x);
            expect(Math.abs(priceBox.y + priceBox.height / 2 - (buttonBox.y + buttonBox.height / 2))).toBeLessThanOrEqual(1);
            const withinOptionGap = priceBox.y - (labelBox.y + labelBox.height);
            // Glyph bounds vary with the OS font. Keep the gap smaller than a
            // text em, and smaller than the spacing between separate editions.
            expect(withinOptionGap).toBeLessThan(await price.evaluate(element => parseFloat(getComputedStyle(element).fontSize)));
            expect(await price.evaluate(element => parseFloat(getComputedStyle(element).fontWeight)))
              .toBeGreaterThan(await label.evaluate(element => parseFloat(getComputedStyle(element).fontWeight)));
            if (previousPriceBottom !== null) {
              expect(labelBox.y - previousPriceBottom).toBeGreaterThan(withinOptionGap);
            }
            previousPriceBottom = priceBox.y + priceBox.height;
            for (const text of [label, price]) {
              expect(await text.evaluate(element => parseFloat(getComputedStyle(element).fontSize))).toBeGreaterThanOrEqual(14);
            }
            expect(buttonBox.width).toBeGreaterThanOrEqual(44);
            expect(buttonBox.height).toBeGreaterThanOrEqual(44);
          } else {
            expect(buttonBox.width).toBe(28);
            expect(buttonBox.height).toBe(28);
            expect(await price.evaluate(element => parseFloat(getComputedStyle(element).fontSize))).toBeCloseTo(14.08, 1);
          }
        }
      }
      await expect(card(page, merchandise.name).getByText("Колекційні листівки-ілюстрації", { exact: true })).toBeVisible();
      await expect(card(page, merchandise.name).getByText("12345.67 грн", { exact: true })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    });
  });
}

for (const width of [360, 390, 1440]) {
  test.describe(`catalog interaction and evidence at ${width}px`, () => {
    test.use({ viewport: { width, height: width === 1440 ? 900 : 844 }, hasTouch: width < 520 });

    test("touch and keyboard add only the intended edition and preserve unavailable/in-cart behavior", async ({ page, request }) => {
      const product = makeProduct({
        name: "Edition Test Book",
        items: [
          { ...makeProduct().items[0], isAvailable: false, canPreorder: true, price: 499, discountPrice: 449 },
          { ...makeProduct().items[0], id: "31000000-0000-4000-8000-000000000002", name: "Електронна Edition Test Book", type: 2, format: 2, price: 199 },
        ],
      });
      expect((await request.post(`${mockApiUrl}/__control/products`, { data: product })).ok()).toBe(true);
      await page.goto("/books");
      const book = card(page, product.name);
      const paper = book.getByRole("button", { name: `Додати в кошик: Паперова, ${product.name}` });
      const digital = book.getByRole("button", { name: `Додати в кошик: Електронна, ${product.name}` });
      await expect(paper).toBeEnabled();
      await expect(digital).toBeEnabled();
      await contained(book.getByText("Передзамовлення", { exact: true }), paper.locator(".."));
      if (width < 520) await paper.tap();
      else await paper.click();
      await selection(page, [{ itemId: product.items[0].id, quantity: 1, format: "paper" }]);
      await digital.focus();
      await expect(digital).toBeFocused();
      await digital.press("Enter");
      await selection(page, [
        { itemId: product.items[0].id, quantity: 1, format: "paper" },
        { itemId: product.items[1].id, quantity: 1, format: "digital" },
      ]);
      const alreadyAdded = book.getByRole("button", { name: `Вже в кошику: Електронна, ${product.name}` });
      await alreadyAdded.press("Space");
      const cart = page.getByRole("dialog", { name: "Кошик", exact: true });
      await expect(cart).toBeVisible();
      await expect(cart.locator(`[data-cart-item-id="${product.items[0].id}"]`).getByText("449 грн за шт.", { exact: true })).toBeVisible();
      await expect(cart.locator(`[data-cart-item-id="${product.items[1].id}"]`).getByText("199 грн за шт.", { exact: true })).toBeVisible();
      await expect(cart.getByText("648 грн", { exact: true }).last()).toBeVisible();
      await cart.getByRole("button", { name: "Закрити", exact: true }).press("Escape");
      await expect(alreadyAdded).toBeFocused();
      await selection(page, [
        { itemId: product.items[0].id, quantity: 1, format: "paper" },
        { itemId: product.items[1].id, quantity: 1, format: "digital" },
      ]);
      await expect(card(page, "Unavailable Book").getByRole("button", { name: /Додати в кошик/ })).toBeDisabled();
      expect((await (await request.get(`${mockApiUrl}/__control/state`)).json()).invoiceRequests).toBe(0);
    });

    test("records matching before and after catalog views", async ({ page }, info) => {
      const phase = process.env.ZVY73_EVIDENCE_PHASE;
      test.skip(!phase, "Evidence capture is opt-in.");
      if (phase !== "before" && phase !== "after") throw new Error("Unknown evidence phase");
      const products = baseline.map(product => ({
        ...product,
        imageUrl: product.imageUrl.replace(/^https:\/\/zvychajna\.pp\.ua(?=\/images\/)/, ""),
        imageUrls: product.imageUrls.map(url => url.replace(/^https:\/\/zvychajna\.pp\.ua(?=\/images\/)/, "")),
      }));
      await page.route("**/api/products", route => route.fulfill({ json: products }));
      await page.goto("/books");
      await expect(page.getByRole("article")).toHaveCount(products.length);
      await page.evaluate(async () => {
        await document.fonts.ready;
        await Promise.all(Array.from(document.images).map(image => image.decode().catch(() => {})));
      });
      const metrics = await page.getByRole("article").evaluateAll(articles => articles.map(article => {
        const box = article.getBoundingClientRect();
        const title = article.querySelector("h2")!;
        const titleStyle = getComputedStyle(title);
        const formats = article.querySelector('[class*="formats"]')!;
        return {
          title: title.textContent, x: box.x, y: box.y, width: box.width, height: box.height,
          titleSize: titleStyle.fontSize, titleLineHeight: titleStyle.lineHeight, titleClamp: titleStyle.webkitLineClamp,
          formatsHeight: formats.getBoundingClientRect().height,
          buttonSizes: Array.from(article.querySelectorAll("button")).map(button => ({
            width: button.getBoundingClientRect().width, height: button.getBoundingClientRect().height,
          })),
        };
      }));
      const directory = path.join(process.cwd(), "docs/storefront-catalog-sizing", phase);
      const heading = await page.getByRole("heading", { level: 1 }).evaluate(element => {
        const box = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return { y: box.y, height: box.height, size: style.fontSize, weight: style.fontWeight };
      });
      await mkdir(directory, { recursive: true });
      const stem = `SCR-02-default-${width}x${width === 1440 ? 900 : 844}`;
      const filename = path.join(directory, `${stem}.jpg`);
      await page.screenshot({ path: filename, type: "jpeg", quality: 90, fullPage: true, animations: "disabled", caret: "hide" });
      await writeFile(path.join(directory, `${stem}.json`), JSON.stringify({
        viewport: { width, height: width === 1440 ? 900 : 844 },
        pageHeight: await page.evaluate(() => document.documentElement.scrollHeight), heading, cards: metrics,
      }, null, 2));
      await info.attach(`catalog ${phase}`, { path: filename, contentType: "image/jpeg" });
      if (phase === "after") {
        const before = JSON.parse(await readFile(path.join(directory, "..", "before", `${stem}.json`), "utf8"));
        if (width === 1440) expect(metrics).toEqual(before.cards);
        else {
          expect(metrics.map(({ title, x, width, titleSize, titleLineHeight, titleClamp }) => ({ title, x, width, titleSize, titleLineHeight, titleClamp })))
            .toEqual(before.cards.map(({ title, x, width, titleSize, titleLineHeight, titleClamp }: typeof metrics[number]) => ({ title, x, width, titleSize, titleLineHeight, titleClamp })));
          const previous = JSON.parse(await readFile(path.join(directory, "..", "density-before", `${stem}.json`), "utf8"));
          expect(metrics[0].y).toBeLessThan(previous.cards[0].y - 20);
          for (let index = 0; index < metrics.length; index++) {
            const reduction = 1 - metrics[index].formatsHeight / previous.cards[index].formatsHeight;
            expect(reduction).toBeGreaterThanOrEqual(0.08);
            expect(reduction).toBeLessThanOrEqual(0.12);
          }
          const initial = JSON.parse(await readFile(path.join(directory, "..", "initial-after", `${stem}.json`), "utf8"));
          expect(metrics.map(({ title, x, width, titleSize, titleLineHeight, titleClamp }) => ({ title, x, width, titleSize, titleLineHeight, titleClamp })))
            .toEqual(initial.cards.map(({ title, x, width, titleSize, titleLineHeight, titleClamp }: typeof metrics[number]) => ({ title, x, width, titleSize, titleLineHeight, titleClamp })));
          for (let index = 0; index < metrics.length; index++) {
            expect(metrics[index].formatsHeight).toBeLessThan(initial.cards[index].formatsHeight);
          }
          expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThan(initial.pageHeight);
        }
      }
    });
  });
}
