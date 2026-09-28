// Validates the catalog data in src/_data before every build.
// Catches the mistakes most likely when editing JSON by hand: syntax errors,
// misspelled fields, unknown categories, invalid prices and missing photos.
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "src");
const DATA = path.join(SRC, "_data");

const PRODUCT_FIELDS = new Set(["name", "category", "price", "photos", "sample"]);

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
  if (errors.length) return errors;

  if (!/^https:\/\/.+\/$/.test(site.url)) errors.push(`site.json: "url" must start with https:// and end with "/"`);
  if (!site.instagram || site.instagram.startsWith("@")) errors.push(`site.json: "instagram" must be the username without "@"`);

  const slugs = new Set();
  categories.forEach((c, i) => {
    if (!c.slug || !c.label) errors.push(`categories.json #${i + 1}: "slug" and "label" are required`);
    if (slugs.has(c.slug)) errors.push(`categories.json: duplicate slug "${c.slug}"`);
    slugs.add(c.slug);
  });

  if (!Array.isArray(products)) return [...errors, "products.json: must be a list of products"];

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
    if ("sample" in p && typeof p.sample !== "boolean") errors.push(`${where}: "sample" must be true or false`);
  });

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
