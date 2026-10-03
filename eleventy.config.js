import { readFileSync } from "node:fs";
import { HtmlBasePlugin } from "@11ty/eleventy";
import { validateData } from "./scripts/validate-data.js";
import { slugify } from "./lib/slugify.js";
import { installmentPlan } from "./src/js/installments.js";
import { sortProducts, priceRanges, inRange } from "./src/js/catalog-order.js";

const site = JSON.parse(readFileSync("./src/_data/site.json", "utf8"));
const policies = JSON.parse(readFileSync("./src/_data/storePolicies.json", "utf8"));
const categories = JSON.parse(readFileSync("./src/_data/categories.json", "utf8"));

// Path the site lives under: "/" on its own address, "/folder/" if it is ever hosted in a subfolder.
// Derived from site.url so the address is defined in one place
const pathPrefix = new URL(site.url).pathname;

const brlFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const productUrl = (product) => `/products/${slugify(product.name)}/`;
const absoluteUrl = (path) => new URL(path.replace(/^\//, ""), site.url).href;

export default function (eleventyConfig) {
  // Fail the build early when the catalog data has mistakes
  eleventyConfig.on("eleventy.before", () => {
    const errors = validateData();
    if (errors.length) {
      throw new Error(`Catalog data has ${errors.length} error(s):\n- ${errors.join("\n- ")}`);
    }
  });

  // Rewrites root-relative href/src ("/css/styles.css") to include the path prefix
  eleventyConfig.addPlugin(HtmlBasePlugin);

  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("src/assets");

  eleventyConfig.setNunjucksEnvironmentOptions({ autoescape: true, throwOnUndefined: false });

  // ---- formatting ----
  // 49.9 -> "R$ 49,90"
  eleventyConfig.addFilter("brl", (value) => brlFormatter.format(value));

  // ---- product lists ----
  // Pieces are unique: a sold piece stays visible (badge "Vendida") but after the available ones
  const availableFirst = (products) => [...products].sort((a, b) => Number(!!a.soldOut) - Number(!!b.soldOut));
  // Category pages open in alphabetical order (sold pieces last); customers can re-sort them (js/catalog-tools.js)
  eleventyConfig.addFilter("byCategory", (products, slug) => sortProducts(products.filter((p) => p.category === slug)));
  eleventyConfig.addFilter("available", (products) => products.filter((p) => !p.soldOut));
  // Home page rows: available pieces of a category in the order they were registered (so the row
  // isn't always the first letters of the alphabet), up to `limit`
  eleventyConfig.addFilter("showcase", (products, slug, limit = 8) =>
    products.filter((p) => p.category === slug && !p.soldOut).slice(0, limit)
  );
  eleventyConfig.addFilter("related", (products, product, limit = 4) =>
    availableFirst(products.filter((p) => p.category === product.category && p.name !== product.name)).slice(0, limit)
  );
  // Price ranges (from the installment thresholds) that have at least one of these products
  eleventyConfig.addFilter("priceRanges", (products) =>
    priceRanges(policies.installments.map((rule) => rule.above)).filter((range) => products.some((p) => inRange(p.price, range)))
  );
  eleventyConfig.addFilter("categoryOf", (categories, slug) => categories.find((c) => c.slug === slug));

  // 98.9 -> { count: 2, value: "R$ 49,45" } following storePolicies.installments; null when 1x only
  eleventyConfig.addFilter("installment", (total) => {
    const plan = installmentPlan(total, policies.installments);
    return plan && { count: plan.count, value: brlFormatter.format(plan.value) };
  });

  // Every piece of the current collection as { id: { name, price, url, image, category, soldOut } },
  // available ones first. Used by js/search.js, and by js/interest-list.js so lists saved on a
  // customer's phone drop pieces that were sold or left the collection.
  eleventyConfig.addFilter("catalogIndex", (products) => {
    const index = Object.fromEntries(
      availableFirst(products)
        .map((p) => [
          slugify(p.name),
          {
            name: p.name,
            price: brlFormatter.format(p.price),
            priceValue: p.price,
            url: pathPrefix + productUrl(p).slice(1),
            image: p.photos.length ? pathPrefix + p.photos[0] : "",
            category: categories.find((c) => c.slug === p.category).label,
            soldOut: !!p.soldOut,
          },
        ])
    );
    return JSON.stringify(index).replace(/</g, "\\u003c"); // safe inside a <script> element
  });

  // ---- URLs ----
  eleventyConfig.addFilter("productSlug", (product) => slugify(product.name));
  eleventyConfig.addFilter("productUrl", productUrl);
  // For URLs the base plugin can't see (data-* attributes read by JavaScript)
  eleventyConfig.addFilter("withBase", (path) => pathPrefix + path.replace(/^\//, ""));
  // "/rings/" -> "https://glanzsemijoias.pages.dev/rings/"
  eleventyConfig.addFilter("absoluteUrl", absoluteUrl);

  // ---- Instagram Direct ----
  // "Olá! Tenho interesse na peça: <name>" + link to the product page, so the store knows exactly which piece
  eleventyConfig.addFilter("directMessage", (product) => `${site.directMessage}${product.name}\n${absoluteUrl(productUrl(product))}`);

  // ig.me/m/<username> opens the Instagram Direct chat; ?text= pre-fills the message
  // on Instagram versions that support it (not guaranteed)
  eleventyConfig.addFilter("directLink", (message) => {
    const base = `https://ig.me/m/${site.instagram}`;
    return message ? `${base}?text=${encodeURIComponent(message)}` : base;
  });

  return {
    dir: { input: "src", output: "_site" },
    pathPrefix,
    templateFormats: ["njk"],
    htmlTemplateEngine: "njk",
  };
}
