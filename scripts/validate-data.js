// Validates the catalog data in src/_data before every build.
// Catches the mistakes most likely when editing JSON by hand: syntax errors,
// misspelled fields, unknown categories, invalid prices and missing photos.
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { slugify } from "../lib/slugify.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "src");
const DATA = path.join(SRC, "_data");

const PRODUCT_FIELDS = new Set(["name", "category", "price", "compareAtPrice", "photos", "sample", "isNew", "soldOut"]);
const BOOLEAN_FIELDS = ["sample", "isNew", "soldOut"];

function readJson(file, errors) {
  const fullPath = path.join(DATA, file);
  try {
    return JSON.parse(readFileSync(fullPath, "utf8"));
  } catch (err) {
    errors.push(`${file}: invalid JSON — ${err.message}`);
    return null;
  }
}

export function validateData() {
  const errors = [];
  const site = readJson("site.json", errors);
  const categories = readJson("categories.json", errors);
  const products = readJson("products.json", errors);
  const policies = readJson("storePolicies.json", errors);
  const highlights = readJson("highlights.json", errors);
  if (errors.length) return errors;

  if (!/^https:\/\/.+\/$/.test(site.url)) errors.push(`site.json: "url" must start with https:// and end with "/"`);
  if (!site.instagram || site.instagram.startsWith("@")) errors.push(`site.json: "instagram" must be the username without "@"`);
  const collection = site.collection || {};
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(collection.firstCycle || "")) {
    errors.push(`site.json: "collection.firstCycle" must be the month a cycle started, like "2026-09"`);
  }
  if (!Number.isInteger(collection.months) || collection.months < 1 || collection.months > 12) {
    errors.push(`site.json: "collection.months" must be a whole number of months, like 2`);
  }

  // storePolicies.json: installments drive the prices shown, so they must be well-formed
  if (!Array.isArray(policies.installments)) {
    errors.push(`storePolicies.json: "installments" must be a list like [{ "above": 80, "count": 2 }]`);
  } else {
    policies.installments.forEach((rule, i) => {
      if (typeof rule.above !== "number" || rule.above < 0 || !Number.isInteger(rule.count) || rule.count < 2) {
        errors.push(`storePolicies.json: installment rule #${i + 1} needs "above" (a price) and "count" (2 or more)`);
      }
    });
  }
  if (!Array.isArray(policies.paymentMethods) || !policies.paymentMethods.length || !policies.paymentMethods.every((m) => typeof m === "string")) {
    errors.push(`storePolicies.json: "paymentMethods" must be a list like ["Pix", "Cartão de crédito"]`);
  }
  if (!Array.isArray(policies.delivery) || !policies.delivery.every((line) => typeof line === "string")) {
    errors.push(`storePolicies.json: "delivery" must be a list of sentences`);
  }
  const warranty = policies.warranty || {};
  for (const key of ["summary", "howToClaim"]) {
    if (typeof warranty[key] !== "string" || !warranty[key].trim()) errors.push(`storePolicies.json: "warranty.${key}" is required`);
  }
  for (const key of ["covers", "doesNotCover"]) {
    if (!Array.isArray(warranty[key])) errors.push(`storePolicies.json: "warranty.${key}" must be a list`);
  }

  const slugs = new Set();
  categories.forEach((c, i) => {
    if (!c.slug || !c.label) errors.push(`categories.json #${i + 1}: "slug" and "label" are required`);
    if (slugs.has(c.slug)) errors.push(`categories.json: duplicate slug "${c.slug}"`);
    slugs.add(c.slug);
    if (c.image && !existsSync(path.join(SRC, c.image))) errors.push(`categories.json ("${c.slug}"): image not found "src/${c.image}"`);
  });

  if (!Array.isArray(products)) return [...errors, "products.json: must be a list of products"];

  const productSlugs = new Map();
  products.forEach((p, i) => {
    const where = `products.json #${i + 1}${p.name ? ` ("${p.name}")` : ""}`;
    for (const key of Object.keys(p)) {
      if (!PRODUCT_FIELDS.has(key)) errors.push(`${where}: unknown field "${key}"`);
    }
    if (typeof p.name !== "string" || !p.name.trim()) errors.push(`${where}: "name" is required`);
    if (!slugs.has(p.category)) errors.push(`${where}: unknown category "${p.category}" (use one of: ${[...slugs].join(", ")})`);
    if (typeof p.price !== "number" || !(p.price > 0)) errors.push(`${where}: "price" must be a positive number, e.g. 49.90`);
    if (!Array.isArray(p.photos)) {
      errors.push(`${where}: "photos" must be a list, e.g. [] or ["assets/products/photo.webp"]`);
    } else {
      p.photos.forEach((photo) => {
        if (!existsSync(path.join(SRC, photo))) errors.push(`${where}: photo not found "src/${photo}"`);
      });
    }
    for (const key of BOOLEAN_FIELDS) {
      if (key in p && typeof p[key] !== "boolean") errors.push(`${where}: "${key}" must be true or false`);
    }
    if ("compareAtPrice" in p && !(typeof p.compareAtPrice === "number" && p.compareAtPrice > p.price)) {
      errors.push(`${where}: "compareAtPrice" (original price) must be a number greater than "price"`);
    }
    // Each product gets its own page at /products/<slug>/, so names must be unique
    if (typeof p.name === "string") {
      const slug = slugify(p.name);
      if (productSlugs.has(slug)) errors.push(`${where}: same page address as product #${productSlugs.get(slug)} — use a different name`);
      else productSlugs.set(slug, i + 1);
    }
  });

  // highlights.json: home carousel; a slide is either a photo or a "coming soon" placeholder
  if (!Array.isArray(highlights)) {
    errors.push("highlights.json: must be a list of slides");
  } else {
    highlights.forEach((h, i) => {
      const where = `highlights.json #${i + 1}`;
      if (typeof h.comingSoon === "string") return;
      if (typeof h.image !== "string" || !existsSync(path.join(SRC, h.image))) {
        errors.push(`${where}: photo not found "src/${h.image}"`);
      }
      // width/height let the browser reserve the space before the photo loads
      if (!Number.isInteger(h.width) || h.width <= 0 || !Number.isInteger(h.height) || h.height <= 0) {
        errors.push(`${where}: "width" and "height" must be the photo size in pixels, e.g. 1200 and 1500`);
      }
      if (typeof h.alt !== "string" || !h.alt.trim()) errors.push(`${where}: "alt" (photo description) is required`);
      if ("caption" in h && typeof h.caption !== "string") errors.push(`${where}: "caption" must be text`);
    });
  }

  return errors;
}

// CLI: `npm run validate`
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const errors = validateData();
  if (errors.length) {
    console.error(`Catalog data has ${errors.length} error(s):\n- ${errors.join("\n- ")}`);
    process.exit(1);
  }
  console.log("Catalog data OK");
}
