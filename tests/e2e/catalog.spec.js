// End-to-end tests for the production build, run on iPhone (WebKit) and desktop (Chromium).
// Expectations are derived from src/_data, so they keep working when the catalog changes.
import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { slugify } from "../../lib/slugify.js";
import { installmentPlan } from "../../src/js/installments.js";
import { collectionText } from "../../src/js/collection.js";

const data = (file) => JSON.parse(readFileSync(`src/_data/${file}`, "utf8"));
const site = data("site.json");
const categories = data("categories.json");
const products = data("products.json");
const policies = data("storePolicies.json");

const productPath = (product) => `products/${slugify(product.name)}/`;
const brl = (value) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
const normalizeSpaces = (text) => text.replace(/\s+/g, " ").trim(); // Intl uses a non-breaking space
const productWithPhoto = products.find((p) => p.photos.length && !p.soldOut);
const soldPiece = products.find((p) => p.soldOut);
// Same order as the category pages: available pieces first, sold ones last
const inCategory = (slug) => {
  const items = products.filter((p) => p.category === slug);
  return [...items.filter((p) => !p.soldOut), ...items.filter((p) => p.soldOut)];
};
const isPhone = (testInfo) => testInfo.project.name.startsWith("iphone");

// Never leave the site: links to Instagram are blocked during tests
test.beforeEach(async ({ context }) => {
  await context.route(/ig\.me|instagram\.com/, (route) => route.abort());
});

function trackErrors(page) {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" && !/ig\.me|instagram/.test(message.text())) errors.push(message.text());
  });
  return errors;
}

// One test per page: quick in parallel and a clear report of which page failed
const pagePaths = ["", ...categories.map((c) => `${c.slug}.html`), ...products.map(productPath)];
for (const path of pagePaths) {
  test(`renders /${path || "(home)"} without errors, broken images or hidden photos`, async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto(path, { waitUntil: "networkidle" });

    const broken = await page.evaluate(() =>
      [...document.images].filter((img) => img.complete && img.naturalWidth === 0).map((img) => img.src)
    );
    expect(broken).toEqual([]);

    // Loaded photos must become visible right away (regression: they used to wait 3s).
    // Real photos only: the sunburst placeholder icons are intentionally translucent.
    await expect
      .poll(() =>
        page.evaluate(() =>
          [...document.querySelectorAll(".carousel .slide:not(.placeholder) img, .carousel-hero .slide:not(.placeholder) img")].filter(
            (img) => img.complete && img.naturalWidth > 0 && getComputedStyle(img).opacity !== "1"
          ).length
        ),
        { timeout: 2000 }
      )
      .toBe(0);
    expect(errors).toEqual([]);
  });
}

test("unknown addresses show the store's 404 page", async ({ page }) => {
  const response = await page.goto("this/page/does-not-exist");
  expect(response.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Página não encontrada" })).toBeVisible();
  await expect(page.locator("link[rel=stylesheet][href*='styles.css']")).toHaveCount(1);
});

test("links to pieces that left the collection explain it and show what's available", async ({ page }) => {
  const response = await page.goto("products/peca-de-uma-colecao-antiga/");
  expect(response.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Essa peça não está mais disponível");
  const shown = await page.locator('section[aria-labelledby="available-title"] .card').count();
  expect(shown).toBe(Math.min(8, products.filter((p) => !p.soldOut).length));
});

test("category pages list their products with formatted prices", async ({ page }) => {
  for (const category of categories) {
    const items = inCategory(category.slug);
    await page.goto(`${category.slug}.html`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(category.label);
    await expect(page.locator(".kicker")).toHaveText(`Catálogo · ${items.length} ${items.length === 1 ? "peça" : "peças"}`);
    await expect(page.locator(".card")).toHaveCount(items.length);
    if (items.length) {
      const firstPrice = await page.locator(".card .price-current").first().textContent();
      expect(normalizeSpaces(firstPrice)).toBe(normalizeSpaces(brl(items[0].price)));
    }
  }
});

test("home shows new arrivals from the data", async ({ page }) => {
  await page.goto("");
  // the current 2-month cycle is worked out in the browser from today's date
  await expect(page.locator(".collection-note")).toHaveText(`Peças únicas · ${collectionText(new Date(), site.collection)}`);
  const expected = products.filter((p) => p.isNew && !p.soldOut).length; // sold pieces aren't "new"
  const section = page.locator('section[aria-labelledby="novidades"]');
  if (expected) await expect(section.locator(".card")).toHaveCount(expected);
  else await expect(section).toHaveCount(0);
  await expect(page.locator("#como-comprar .step")).toHaveCount(data("howToBuy.json").length);
});

test("how to buy explains installments, delivery and warranty", async ({ page }) => {
  await page.goto("#como-comprar");
  const policy = (name) => page.locator(".policy", { has: page.locator("summary", { hasText: name }) });

  await policy("Parcelamento").locator("summary").click();
  await expect(policy("Parcelamento").locator("li")).toHaveCount(policies.installments.length);
  await expect(policy("Parcelamento")).toContainText(`${policies.installments.at(-1).count}x sem juros`);

  await policy("Entrega").locator("summary").click();
  await expect(policy("Entrega")).toContainText(policies.delivery[0]);

  const warranty = policy("Garantia");
  await expect(warranty.getByText(policies.warranty.howToClaim)).toBeHidden(); // closed by default
  await warranty.locator("summary").click();
  await expect(warranty.getByText(policies.warranty.summary)).toBeVisible();
  await expect(warranty.getByText(policies.warranty.howToClaim)).toBeVisible();
});

test("product pages show interest-free installments when the price allows", async ({ page }) => {
  for (const product of products.filter((p) => !p.soldOut).slice(0, 6)) {
    await page.goto(productPath(product));
    const plan = installmentPlan(product.price, policies.installments);
    const line = page.locator(".detail-info .installments");
    if (plan) expect(normalizeSpaces(await line.textContent())).toBe(normalizeSpaces(`ou ${plan.count}x de ${brl(plan.value)} sem juros`));
    else await expect(line).toHaveCount(0);
  }
});

test("product page shows guarantees and a Direct message linking to the piece", async ({ page }) => {
  await page.goto(productPath(productWithPhoto));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(productWithPhoto.name);
  for (const guarantee of site.guarantees) {
    await expect(page.locator(".guarantees-detail")).toContainText(guarantee.text);
  }
  const direct = page.locator(".detail-actions a[data-message]");
  const productUrl = new URL(productPath(productWithPhoto), site.url).href;
  await expect(direct).toHaveAttribute("href", new RegExp(`^https://ig\\.me/m/${site.instagram}\\?text=`));
  expect(decodeURIComponent((await direct.getAttribute("href")).split("text=")[1])).toContain(productUrl);

  // Tapping it also copies the message (Instagram doesn't always pre-fill it)
  await direct.click();
  await expect(page.locator("#toast")).toHaveText("Mensagem copiada — é só colar no Direct");
});

test("interest list: add, keep after reload, copy the message, remove", async ({ page }) => {
  const availableIn = (slug) => inCategory(slug).filter((p) => !p.soldOut);
  const category = categories.find((c) => availableIn(c.slug).length >= 2);
  const [first, second] = availableIn(category.slug);
  await page.goto(`${category.slug}.html`);
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  const hearts = page.locator(".card [data-list-toggle]");
  await hearts.nth(0).click();
  await hearts.nth(1).click();
  await expect(page.locator(".list-button [data-list-count]")).toHaveText("2");

  await page.reload(); // stored on the device
  await expect(page.locator(".list-button [data-list-count]")).toHaveText("2");
  await expect(hearts.nth(0)).toHaveAttribute("aria-pressed", "true");

  await page.locator(".list-button").click();
  const drawer = page.locator("#interestList");
  await expect(drawer).toBeVisible();
  const message = await drawer.locator("[data-list-message-box]").inputValue();
  expect(message).toContain(site.listMessage);
  expect(normalizeSpaces(message)).toContain(normalizeSpaces(`${first.name} (${brl(first.price)})`));
  expect(normalizeSpaces(message)).toContain(normalizeSpaces(`${second.name} (${brl(second.price)})`));

  // total of the list, with installments when it reaches a threshold
  const total = Math.round((first.price + second.price) * 100) / 100;
  expect(normalizeSpaces(await drawer.locator("[data-list-total]").textContent())).toBe(normalizeSpaces(brl(total)));
  const plan = installmentPlan(total, policies.installments);
  const installments = normalizeSpaces(await drawer.locator("[data-list-installments]").textContent());
  expect(installments).toBe(plan ? normalizeSpaces(`ou ${plan.count}x de ${brl(plan.value)} sem juros`) : "");

  // Step 1: copy with visible confirmation (regression: copying failed inside the open drawer)
  await drawer.locator("[data-list-copy]").click();
  await expect(drawer.locator("[data-list-copy-label]")).toHaveText("Lista copiada");
  await expect(drawer.locator("#toast")).toBeVisible();

  await drawer.getByRole("button", { name: `Remover ${first.name} da lista` }).click();
  await expect(page.locator(".list-button [data-list-count]")).toHaveText("1");
  await drawer.locator("[data-list-close]").click();
  await expect(drawer).toBeHidden();
});

test("photo viewer on phones: opens without zoom, pinch to zoom", async ({ page }, testInfo) => {
  test.skip(!isPhone(testInfo), "touch only");
  await page.goto(productPath(productWithPhoto));
  await page.locator("[data-zoom-index]").first().click();
  const viewer = page.locator("[data-lightbox]");
  await expect(viewer).toBeVisible();

  const image = viewer.locator("[data-lightbox-image]");
  await expect(image).toHaveAttribute("style", /scale\(1\)/); // no instant zoom
  await expect(viewer.locator(".lightbox-zoom")).toBeHidden(); // no +/- on touch screens
  await expect(viewer.locator(".lightbox-hint-touch")).toBeVisible();

  // Two-finger pinch (synthetic touch pointers) and Safari's own gesture events blocked
  const result = await viewer.evaluate((dialog) => {
    const stage = dialog.querySelector("[data-lightbox-stage]");
    const gesture = new Event("gesturestart", { cancelable: true });
    stage.dispatchEvent(gesture);
    const r = dialog.querySelector("[data-lightbox-image]").getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    const fire = (type, id, px) => stage.dispatchEvent(new PointerEvent(type, { pointerId: id, pointerType: "touch", clientX: px, clientY: y, bubbles: true }));
    fire("pointerdown", 1, x - 20); fire("pointerdown", 2, x + 20);
    for (let step = 1; step <= 5; step++) { fire("pointermove", 1, x - 20 - step * 6); fire("pointermove", 2, x + 20 + step * 6); }
    fire("pointerup", 2, x + 50); fire("pointerup", 1, x - 50);
    return { gestureBlocked: gesture.defaultPrevented };
  });
  expect(result.gestureBlocked).toBe(true);
  await expect(image).toHaveAttribute("style", /scale\(2\.5\)/);

  await viewer.locator("[data-lightbox-close]").click();
  await expect(viewer).toBeHidden();
});

test("photo viewer on desktop: wheel and +/- buttons zoom", async ({ page }, testInfo) => {
  test.skip(isPhone(testInfo), "mouse only");
  await page.goto(productPath(productWithPhoto));
  await page.locator("[data-zoom-index]").first().click();
  const viewer = page.locator("[data-lightbox]");
  const image = viewer.locator("[data-lightbox-image]");
  await expect(viewer.locator(".lightbox-zoom")).toBeVisible();

  const box = await image.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.wheel(0, -400);
  await expect(image).not.toHaveAttribute("style", /scale\(1\)/);

  for (let i = 0; i < 6; i++) await viewer.locator("[data-zoom-out]").click();
  await expect(image).toHaveAttribute("style", /scale\(1\)/); // never below the original size
  await viewer.locator("[data-zoom-in]").click();
  await expect(image).toHaveAttribute("style", /scale\(1\.6\)/);
});

test("phone details: no blue tap flash, Direct button label on one line", async ({ page }, testInfo) => {
  test.skip(!isPhone(testInfo), "phones only");
  await page.goto(`${categories[0].slug}.html`);
  // -webkit-tap-highlight-color only exists in iOS Safari (desktop WebKit ignores it),
  // so check that the published stylesheet turns it off
  const css = await (await page.request.get("css/styles.css")).text();
  expect(css).toMatch(/-webkit-tap-highlight-color:\s*transparent/);
  const heights = await page.locator(".card .btn-direct").evaluateAll((buttons) => buttons.map((b) => b.getBoundingClientRect().height));
  for (const height of heights) expect(height).toBeLessThanOrEqual(46); // one line (min-height 44px)
});

test("a sold piece shows 'Vendida', comes last and can't be added to the list", async ({ page }) => {
  test.skip(!soldPiece, "no sold piece in the catalog right now");
  const items = inCategory(soldPiece.category);
  await page.goto(`${soldPiece.category}.html`);
  const lastCard = page.locator(".card").last();
  await expect(lastCard).toContainText(items[items.length - 1].name);
  const soldCard = page.locator(".card", { hasText: soldPiece.name });
  await expect(soldCard.locator(".badge-sold-out")).toHaveText("Vendida");
  await expect(soldCard.locator("[data-list-toggle]")).toHaveCount(0);

  await page.goto(productPath(soldPiece));
  await expect(page.locator(".detail-actions [data-list-toggle]")).toHaveCount(0);
  await expect(page.locator(".detail-actions a[data-message]")).toContainText("Perguntar por peças parecidas");
});

test("a saved interest list drops pieces that were sold or left the collection", async ({ page }) => {
  const kept = products.find((p) => !p.soldOut);
  const saved = [
    { id: "peca-de-uma-colecao-antiga", name: "Peça antiga", price: "R$ 10,00", url: "#", image: "" },
    ...(soldPiece ? [{ id: slugify(soldPiece.name), name: soldPiece.name, price: "R$ 1,00", url: "#", image: "" }] : []),
    // stale price: must be refreshed from the current catalog
    { id: slugify(kept.name), name: kept.name, price: "R$ 1,00", url: "#", image: "" },
  ];
  await page.goto("");
  await page.evaluate((items) => localStorage.setItem("glanz:interest-list", JSON.stringify(items)), saved);
  await page.reload();

  await expect(page.locator(".list-button [data-list-count]")).toHaveText("1");
  await page.locator(".list-button").click();
  const drawer = page.locator("#interestList");
  const removed = saved.length - 1;
  await expect(drawer.locator("[data-list-notice]")).toContainText(removed === 1 ? "1 peça da sua lista" : `${removed} peças da sua lista`);
  const message = await drawer.locator("[data-list-message-box]").inputValue();
  expect(normalizeSpaces(message)).toContain(normalizeSpaces(`${kept.name} (${brl(kept.price)})`));
  expect(message).not.toContain("Peça antiga");
});
