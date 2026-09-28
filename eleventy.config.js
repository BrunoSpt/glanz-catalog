import { readFileSync } from "node:fs";
import { validateData } from "./scripts/validate-data.js";

const site = JSON.parse(readFileSync("./src/_data/site.json", "utf8"));

const brlFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export default function (eleventyConfig) {
  // Fail the build early when the catalog data has mistakes
  eleventyConfig.on("eleventy.before", () => {
    const errors = validateData();
    if (errors.length) {
      throw new Error(`Catalog data has ${errors.length} error(s):\n- ${errors.join("\n- ")}`);
    }
  });

  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("src/assets");

  eleventyConfig.setNunjucksEnvironmentOptions({ autoescape: true, throwOnUndefined: false });

  // 49.9 -> "R$ 49,90"
  eleventyConfig.addFilter("brl", (value) => brlFormatter.format(value));

  eleventyConfig.addFilter("byCategory", (products, slug) => products.filter((p) => p.category === slug));

  // "Olá! Tenho interesse na peça: <name>"
  eleventyConfig.addFilter("directMessage", (productName) => site.directMessage + productName);

  // ig.me/m/<username> opens the Instagram Direct chat; ?text= pre-fills the message
  // on Instagram versions that support it (not guaranteed)
  eleventyConfig.addFilter("directLink", (productName) => {
    const base = `https://ig.me/m/${site.instagram}`;
    return productName ? `${base}?text=${encodeURIComponent(site.directMessage + productName)}` : base;
  });

  // "/rings.html" -> "https://brunospt.github.io/glanz-catalog/rings.html"
  eleventyConfig.addFilter("absoluteUrl", (pagePath) => new URL(pagePath.replace(/^\//, ""), site.url).href);

  return {
    dir: { input: "src", output: "_site" },
    templateFormats: ["njk"],
    htmlTemplateEngine: "njk",
  };
}
