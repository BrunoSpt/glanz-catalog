import { readFileSync } from "node:fs";
import { HtmlBasePlugin } from "@11ty/eleventy";
import { validateData } from "./scripts/validate-data.js";
import { slugify } from "./lib/slugify.js";

const site = JSON.parse(readFileSync("./src/_data/site.json", "utf8"));

// The site lives in a subfolder on GitHub Pages ("/glanz-catalog/"); derived from site.url
// so the address is still defined in one place
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
  eleventyConfig.addFilter("byCategory", (products, slug) => products.filter((p) => p.category === slug));
  // products | flagged("isNew") -> products with isNew: true
  eleventyConfig.addFilter("flagged", (products, key) => products.filter((p) => p[key] === true));
  eleventyConfig.addFilter("related", (products, product, limit = 4) =>
    products.filter((p) => p.category === product.category && p.name !== product.name).slice(0, limit)
  );
  eleventyConfig.addFilter("categoryOf", (categories, slug) => categories.find((c) => c.slug === slug));

  // ---- URLs ----
  eleventyConfig.addFilter("productSlug", (product) => slugify(product.name));
  eleventyConfig.addFilter("productUrl", productUrl);
  // For URLs the base plugin can't see (data-* attributes read by JavaScript)
  eleventyConfig.addFilter("withBase", (path) => pathPrefix + path.replace(/^\//, ""));
  // "/rings.html" -> "https://brunospt.github.io/glanz-catalog/rings.html"
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
