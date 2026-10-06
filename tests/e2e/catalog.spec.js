// End-to-end tests for the production build, run on iPhone (WebKit) and desktop (Chromium).
// Expectations are derived from src/_data, so they keep working when the catalog changes.
import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { slugify } from "../../lib/slugify.js";
import { installmentPlan } from "../../src/js/installments.js";
import { collectionTitle } from "../../src/js/collection.js";
import { searchCatalog } from "../../src/js/search.js";
import { sortProducts, priceRanges, inRange } from "../../src/js/catalog-order.js";

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
// Same order as the category pages open in: A–Z, sold pieces last
const inCategory = (slug) => sortProducts(products.filter((p) => p.category === slug));
const names = (items) => items.map((p) => p.name);
const visibleNames = async (page) => (await page.locator(".card:not([hidden]) .name").allTextContents()).map((n) => n.trim());
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
const pagePaths = ["", ...categories.map((c) => `${c.slug}/`), ...products.map(productPath)];
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
          [...document.querySelectorAll(".carousel .slide:not(.placeholder) img")].filter(
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
    await page.goto(`${category.slug}/`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(category.label);
    await expect(page.locator("[data-catalog-count]")).toHaveText(`${items.length} ${items.length === 1 ? "peça" : "peças"}`);
    await expect(page.locator(".card")).toHaveCount(items.length);
    if (items.length) {
      const firstPrice = await page.locator(".card .price-current").first().textContent();
      expect(normalizeSpaces(firstPrice)).toBe(normalizeSpaces(brl(items[0].price)));
    }
  }
});

test("home shows the collection, guarantees and steps from the data", async ({ page }) => {
  await page.goto("");
  // the current 2-month cycle is worked out in the browser from today's date
  await expect(page.locator("h1[data-collection]")).toHaveText(collectionTitle(new Date(), site.collection));
  // home strip shows every guarantee, including the home-only ones
  await expect(page.locator(".section-tight .guarantees li")).toHaveCount(site.guarantees.length);
  await expect(page.locator("#como-comprar .step")).toHaveCount(data("howToBuy.json").length);
});

const hero = data("hero.json");

test("home hero shows the collection photos; several take turns, one stays still", async ({ page }) => {
  await page.goto("");
  await expect(page.locator(".hero-slide img")).toHaveCount(hero.length);
  const dots = page.locator(".hero-dots button");
  if (hero.length === 1) {
    await expect(dots).toHaveCount(0);
    return;
  }
  const visible = () => page.evaluate(() => {
    const track = document.querySelector(".hero-track");
    return Math.round(track.scrollLeft / track.clientWidth);
  });
  await expect(dots.first()).toHaveAttribute("aria-current", "true");
  await expect.poll(visible, { timeout: 9000 }).toBe(1); // changes on its own
  await dots.last().click();
  await expect.poll(visible).toBe(hero.length - 1);
  await expect(dots.last()).toHaveAttribute("aria-current", "true");
});

test("home shows a row of available pieces for each category, linking to the full list", async ({ page }) => {
  await page.goto("");
  for (const category of categories) {
    const available = products.filter((p) => p.category === category.slug && !p.soldOut);
    const row = page.locator(`section[aria-labelledby="row-${category.slug}"]`);
    if (!available.length) {
      await expect(row).toHaveCount(0);
      continue;
    }
    // in registration order, up to 8 (the desktop layout shows the first 4)
    const expected = available.slice(0, 8).map((p) => p.name);
    expect((await row.locator(".card .name").allTextContents()).map((n) => n.trim())).toEqual(expected);
    const all = row.getByRole("link", { name: `Ver todos (${inCategory(category.slug).length})` });
    await expect(all).toHaveAttribute("href", new RegExp(`/${category.slug}/$`));
  }
});

test("product pages keep navigation light: breadcrumb only, no floating Direct button", async ({ page }) => {
  await page.goto(productPath(productWithPhoto));
  await expect(page.locator(".breadcrumb")).toBeVisible();
  await expect(page.locator(".chip-row")).toHaveCount(0);
  await expect(page.locator(".ig-float")).toHaveCount(0);
  await page.goto("");
  await expect(page.locator(".ig-float")).toBeVisible();
});

test("how to buy explains installments, delivery and warranty", async ({ page }) => {
  await page.goto("#como-comprar");
  const policy = (name) => page.locator(".policy", { has: page.locator("summary", { hasText: name }) });

  const payment = policy("Formas de pagamento");
  await payment.locator("summary").click();
  for (const method of policies.paymentMethods) await expect(payment).toContainText(method);
  await expect(payment.locator("li")).toHaveCount(policies.paymentMethods.length + policies.installments.length);
  await expect(payment).toContainText(`${policies.installments.at(-1).count}x sem juros`);

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
    // "homeOnly" claims (e.g. zircônia) may not apply to every piece, so product pages leave them out
    if (guarantee.homeOnly) await expect(page.locator(".guarantees-detail")).not.toContainText(guarantee.text);
    else await expect(page.locator(".guarantees-detail")).toContainText(guarantee.text);
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
  await page.goto(`${category.slug}/`);
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

test("phone details: no blue tap flash, Direct link label on one line", async ({ page }, testInfo) => {
  test.skip(!isPhone(testInfo), "phones only");
  await page.goto(`${categories[0].slug}/`);
  // -webkit-tap-highlight-color only exists in iOS Safari (desktop WebKit ignores it),
  // so check that the published stylesheet turns it off
  const css = await (await page.request.get("css/styles.css")).text();
  expect(css).toMatch(/-webkit-tap-highlight-color:\s*transparent/);
  const heights = await page.locator(".card .card-direct").evaluateAll((links) => links.map((l) => l.getBoundingClientRect().height));
  expect(heights.length).toBeGreaterThan(0);
  for (const height of heights) expect(height).toBeLessThanOrEqual(42); // one line (min-height 40px)
});

test("cards show the interest-free installments next to the price, when the price allows", async ({ page }) => {
  for (const category of categories) {
    await page.goto(`${category.slug}/`);
    // read every card at once: one locator per card would be slow with ~45 pieces
    const shown = await page.locator(".card").evaluateAll((cards) =>
      cards.map((card) => [card.querySelector(".name").textContent.trim(), card.querySelector(".card-installments")?.textContent ?? null])
    );
    const expected = inCategory(category.slug).map((product) => {
      const plan = installmentPlan(product.price, policies.installments);
      return [product.name, plan && !product.soldOut ? `ou ${plan.count}x de ${brl(plan.value)} sem juros` : null];
    });
    const normalize = (rows) => rows.map(([name, line]) => [name, line && normalizeSpaces(line)]);
    expect(normalize(shown)).toEqual(normalize(expected));
  }
});

test("category pages open in alphabetical order, with sold pieces last", async ({ page }) => {
  for (const category of categories) {
    const items = inCategory(category.slug);
    if (items.length < 2) continue;
    await page.goto(`${category.slug}/`);
    await expect(page.locator("[data-sort]")).toHaveValue("a-z");
    expect(await visibleNames(page)).toEqual(names(items));
  }
});

// The category with the most pieces has the most useful price ranges
const biggestCategory = [...categories].sort((a, b) => inCategory(b.slug).length - inCategory(a.slug).length)[0];

test("customers can sort and filter a category, and the choice stays in the address", async ({ page }) => {
  const items = inCategory(biggestCategory.slug);
  test.skip(items.length < 2, "no category with two or more pieces");
  await page.goto(`${biggestCategory.slug}/`);
  const sort = page.locator("[data-sort]");
  expect(await sort.evaluate((el) => getComputedStyle(el).fontSize)).toBe("16px"); // smaller fields make iOS zoom in

  await sort.selectOption("menor-preco");
  const byPrice = sortProducts(items, "menor-preco");
  expect(await visibleNames(page)).toEqual(names(byPrice));
  await expect(page).toHaveURL(/ordem=menor-preco/);

  const ranges = priceRanges(policies.installments.map((rule) => rule.above)).filter((r) => items.some((p) => inRange(p.price, r)));
  test.skip(ranges.length < 2, "all pieces of the category are in the same price range");
  const range = ranges[0];
  const filtered = byPrice.filter((p) => inRange(p.price, range));
  const rangeButton = page.locator(`[data-price-range="${range.id}"]`);
  await expect(rangeButton).toHaveText(range.label); // toHaveText normalizes the non-breaking space Intl uses
  await rangeButton.click();
  await expect(rangeButton).toHaveAttribute("aria-pressed", "true");
  expect(await visibleNames(page)).toEqual(names(filtered));
  await expect(page.locator("[data-catalog-count]")).toHaveText(`${filtered.length} de ${items.length} peças`);

  // a reload (or a link sent by the store) keeps the order and the filter
  await page.reload();
  await expect(sort).toHaveValue("menor-preco");
  await expect(rangeButton).toHaveAttribute("aria-pressed", "true");
  expect(await visibleNames(page)).toEqual(names(filtered));

  // tapping the selected range again shows every piece
  await rangeButton.click();
  await expect(rangeButton).toHaveAttribute("aria-pressed", "false");
  expect(await visibleNames(page)).toEqual(names(byPrice));
  await expect(page.locator("[data-catalog-count]")).toHaveText(`${items.length} peças`);
  await expect(page).not.toHaveURL(/preco=/);
});

test("a sold piece shows 'Vendida', comes last and can't be added to the list", async ({ page }) => {
  test.skip(!soldPiece, "no sold piece in the catalog right now");
  const items = inCategory(soldPiece.category);
  await page.goto(`${soldPiece.category}/`);
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

// Same entries the site searches: name + category label, available pieces first
const searchEntries = [...products.filter((p) => !p.soldOut), ...products.filter((p) => p.soldOut)].map((p) => ({
  name: p.name,
  category: categories.find((c) => c.slug === p.category).label,
  soldOut: !!p.soldOut,
}));

test("search finds pieces ignoring accents, from the header on any page", async ({ page }) => {
  await page.goto(`${categories[0].slug}/`);
  await page.getByRole("button", { name: "Buscar peças" }).click();
  const dialog = page.locator("#search");
  const input = dialog.locator("[data-search-input]");
  await expect(input).toBeFocused();

  // a word from a real product name, typed without accents and in capitals
  const word = productWithPhoto.name.split(" ").at(-1);
  const query = word.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase();
  await input.fill(query);
  const expected = searchCatalog(searchEntries, query);
  await expect(dialog.locator(".search-result")).toHaveCount(expected.length);
  await expect(dialog.locator(".search-result").first()).toContainText(expected[0].name);

  await dialog.locator(".search-result a", { hasText: productWithPhoto.name }).click();
  await expect(page).toHaveURL(new RegExp(productPath(productWithPhoto)));
});

test("search shows sold pieces as sold and suggests categories when nothing matches", async ({ page }) => {
  await page.goto("");
  await page.locator(".search-shortcut").click(); // shortcut on the home page
  const dialog = page.locator("#search");
  const input = dialog.locator("[data-search-input]");

  if (soldPiece) {
    await input.fill(soldPiece.name);
    await expect(dialog.locator(".search-result", { hasText: soldPiece.name })).toContainText("Vendida");
  }

  await input.fill("peça que não existe xyz");
  await expect(dialog.locator(".search-result")).toHaveCount(0);
  await expect(dialog.locator("[data-search-status]")).toHaveText("Nenhuma peça encontrada");
  await expect(dialog.locator("[data-search-empty]")).toBeInViewport(); // right under the field, not pushed down
  await expect(dialog.locator(".search-categories .chip")).toHaveCount(categories.length);

  await dialog.locator("[data-search-close]").click();
  await expect(dialog).toBeHidden();
});
