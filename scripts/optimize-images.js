// Prepares photos for the site and registers the products: `npm run images`
//
// Put the original photos (JPG, PNG, WebP or HEIC, any size) in a subfolder of photos-inbox/:
//   - one per category — the category slug ("rings") or its Portuguese label
//     ("Anéis", "Pulseiras", "Pingente"…) — for product photos;
//   - "Destaques" (or "highlights") for home carousel photos that aren't of a single
//     piece (a model wearing the jewelry, compositions, campaign shots).
//
// Product photos are named after the piece, optionally with its price and photo number:
//   "Anel Laço - 59,90.jpg"   -> product "Anel Laço", R$ 59,90
//   "Anel Laço (2).jpg"       -> second photo of "Anel Laço"
//   "Anel Laço.jpg"           -> price 0: the data validation blocks publishing until it's set
//
// For each photo this script:
//   - fixes the rotation stored by phone cameras,
//   - resizes to 1200px wide (never enlarges), keeping the proportions,
//   - saves as WebP (quality 80) in src/assets/products/<category>/ or src/assets/highlights/,
//   - moves the original to photos-inbox/processed/ so it isn't converted again,
//   - adds the product to src/_data/products.json (or the photo/price to an existing product).
// Highlights still need a human-written description, so their highlights.json lines are printed.
//
// Messages are in Portuguese: this tool is meant for the store owner.
import { readdirSync, mkdirSync, renameSync, statSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { slugify } from "../lib/slugify.js";

const INBOX = "photos-inbox";
const PROCESSED = path.join(INBOX, "processed");
const ASSETS = path.join("src", "assets");
const PRODUCTS_FILE = path.join("src", "_data", "products.json");
const WIDTH = 1200;
const QUALITY = 80;
const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"]);

const HIGHLIGHTS = { label: "Destaques", kind: "highlight", dir: "highlights", assetPath: "assets/highlights" };

// ---- file names ----

// "1.299,90" / "59,90" / "59.90" / "59" -> number
function parsePrice(text) {
  const normalized = text.includes(",") ? text.replace(/\./g, "").replace(",", ".") : text;
  const value = Number(normalized);
  return Number.isFinite(value) && value > 0 ? Math.round(value * 100) / 100 : null;
}

// "Anel Laço - R$ 59,90 (2)_.jpg" -> { name: "Anel Laço", price: 59.9, photoNumber: 2 }
export function parsePhotoName(fileName) {
  let base = path.parse(fileName).name.replace(/_+$/, "").trim();
  let photoNumber = 1;
  const numbered = base.match(/^(.*?)\s*\((\d+)\)$/);
  if (numbered) {
    base = numbered[1];
    photoNumber = Number(numbered[2]);
  }
  let price = null;
  // " - ", or the dashes phones and text editors auto-replace it with (" – ", " — ")
  const priced = base.match(/^(.*?)\s+[-–—]\s+(?:R\$\s*)?(\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?|\d+(?:[.,]\d{1,2})?)$/i);
  if (priced) {
    price = parsePrice(priced[2]);
    if (price !== null) base = priced[1];
  }
  return { name: base.trim(), price, photoNumber };
}

// ---- products.json (kept grouped by category, one product per line) ----

function formatProduct(p) {
  const parts = [`"name": ${JSON.stringify(p.name)}`, `"category": "${p.category}"`, `"price": ${p.price.toFixed(2)}`];
  if ("compareAtPrice" in p) parts.push(`"compareAtPrice": ${p.compareAtPrice.toFixed(2)}`);
  parts.push(`"photos": [${p.photos.map((photo) => JSON.stringify(photo)).join(", ")}]`);
  for (const key of ["sample", "isNew", "soldOut"]) {
    if (key in p) parts.push(`"${key}": ${JSON.stringify(p[key])}`);
  }
  return `  { ${parts.join(", ")} }`;
}

function writeProducts(products, categories) {
  const groups = categories
    .map((c) => products.filter((p) => p.category === c.slug).map(formatProduct))
    .filter((group) => group.length);
  writeFileSync(PRODUCTS_FILE, `[\n${groups.map((g) => g.join(",\n")).join(",\n\n")}\n]\n`);
}

// ---- images ----

const kb = (bytes) => `${Math.round(bytes / 1024)} KB`;
const brl = (value) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

async function convert(inputPath, outputPath) {
  // Read into memory first: sharp would otherwise keep the file open, and on Windows
  // an open file can't be moved to photos-inbox/processed afterwards (EBUSY)
  const image = sharp(readFileSync(inputPath)).rotate(); // apply the camera's orientation
  const { width, height } = await image.metadata().then((m) =>
    // metadata() reports the stored size; swap when the photo is rotated 90°
    m.orientation >= 5 ? { width: m.height, height: m.width } : { width: m.width, height: m.height }
  );
  const info = await image
    .resize({ width: WIDTH, withoutEnlargement: true })
    .webp({ quality: QUALITY, effort: 6 })
    .toFile(outputPath);
  return { original: { width, height }, output: info };
}

// ---- main ----

async function main() {
  const categories = JSON.parse(readFileSync("src/_data/categories.json", "utf8"));
  const products = JSON.parse(readFileSync(PRODUCTS_FILE, "utf8"));

  // Where the photos of an inbox folder go:
  // "Destaques" -> home carousel; "Anéis" / "aneis" / "rings" -> rings (singular works too: "Pingente")
  function targetFor(folder) {
    const key = slugify(folder);
    if (["destaques", "destaque", "highlights"].includes(key)) return HIGHLIGHTS;
    const category = categories.find((c) => {
      const label = slugify(c.label);
      return key === c.slug || key === label || `${key}s` === label;
    });
    return category && {
      label: category.label,
      kind: "product",
      slug: category.slug,
      dir: path.join("products", category.slug),
      assetPath: `assets/products/${category.slug}`,
    };
  }

  if (!existsSync(INBOX)) {
    mkdirSync(INBOX);
    console.log(`Criei a pasta ${INBOX}/. Coloque as fotos em subpastas por categoria (ex.: ${INBOX}/Anéis/) ou em ${INBOX}/Destaques/ e rode de novo.`);
    return;
  }

  const folders = readdirSync(INBOX).filter((f) => f !== "processed" && statSync(path.join(INBOX, f)).isDirectory());
  const highlightLines = [];
  const summary = { added: [], updated: [], withoutPrice: [] };
  let converted = 0;
  let problems = 0;

  for (const folder of folders) {
    const target = targetFor(folder);
    if (!target) {
      console.log(`\n⚠ Pasta "${folder}" ignorada: use o nome de uma categoria (${categories.map((c) => c.label).join(", ")}) ou "Destaques".`);
      problems++;
      continue;
    }
    // "(2)" photos after the first one, so a piece exists before its extra photos are added
    const files = readdirSync(path.join(INBOX, folder))
      .filter((f) => IMAGE_EXTENSIONS.has(path.extname(f).toLowerCase()))
      .sort((a, b) => parsePhotoName(a).photoNumber - parsePhotoName(b).photoNumber || a.localeCompare(b));
    if (!files.length) continue;

    console.log(`\n${target.label} (${files.length} foto${files.length === 1 ? "" : "s"})`);
    mkdirSync(path.join(ASSETS, target.dir), { recursive: true });
    mkdirSync(path.join(PROCESSED, target.dir), { recursive: true });

    for (const file of files) {
      const inputPath = path.join(INBOX, folder, file);
      const { name, price, photoNumber } = parsePhotoName(file);
      const outputName = `${slugify(name)}${photoNumber > 1 ? `-${photoNumber}` : ""}.webp`;
      const outputPath = path.join(ASSETS, target.dir, outputName);
      const replacing = existsSync(outputPath);

      try {
        const { original, output } = await convert(inputPath, outputPath);
        const warnings = [];
        const ratio = original.width / original.height;
        if (Math.abs(ratio - 0.8) > 0.03) {
          warnings.push(`não está em 4:5 (em pé) e será cortada ${target.kind === "highlight" ? "no carrossel" : "nos cards"}`);
        }
        if (original.width < 800) warnings.push(`é pequena (${original.width}px de largura) e pode ficar sem nitidez`);

        console.log(`  ✓ ${outputName}  ${output.width}x${output.height}  ${kb(statSync(inputPath).size)} → ${kb(output.size)}${replacing ? "  (substituiu a anterior)" : ""}`);
        warnings.forEach((w) => console.log(`    ⚠ A foto ${w}.`));
        renameSync(inputPath, path.join(PROCESSED, target.dir, file));
        converted++;

        const image = `${target.assetPath}/${outputName}`;
        if (target.kind === "highlight") {
          highlightLines.push(
            `  { "image": "${image}", "width": ${output.width}, "height": ${output.height}, "alt": ${JSON.stringify(name)}, "caption": "" },`
          );
          continue;
        }

        // Register the product: same name (accents/case ignored) = same piece
        const existing = products.find((p) => slugify(p.name) === slugify(name));
        if (existing) {
          const changes = [];
          if (!existing.photos.includes(image)) {
            existing.photos.push(image);
            changes.push("foto adicionada");
          }
          if (price !== null && price !== existing.price) {
            existing.price = price;
            changes.push(`preço ${brl(price)}`);
          }
          if (changes.length && !summary.added.includes(existing.name)) summary.updated.push(`${existing.name} (${changes.join(", ")})`);
        } else {
          products.push({ name, category: target.slug, price: price ?? 0, photos: [image] });
          summary.added.push(name);
        }
      } catch (error) {
        problems++;
        const isHeic = /\.hei[cf]$/i.test(file);
        console.log(`  ✗ ${file}: não foi possível converter${isHeic ? " (foto HEIC do iPhone: exporte como JPG e tente de novo)" : ` (${error.message})`}`);
      }
    }
  }

  if (!converted && !problems) {
    console.log(`Nenhuma foto encontrada. Coloque as fotos em subpastas de ${INBOX}/ por categoria (ex.: ${INBOX}/Anéis/) ou em ${INBOX}/Destaques/.`);
    return;
  }

  if (summary.added.length || summary.updated.length) writeProducts(products, categories);
  summary.withoutPrice = products.filter((p) => p.price === 0).map((p) => p.name);

  console.log(`\n${converted} foto${converted === 1 ? "" : "s"} pronta${converted === 1 ? "" : "s"} em ${ASSETS}/. As originais foram para ${PROCESSED}/.`);
  if (summary.added.length) console.log(`\nPeças novas cadastradas no ${PRODUCTS_FILE}:\n${summary.added.map((n) => `  + ${n}`).join("\n")}`);
  if (summary.updated.length) console.log(`\nPeças atualizadas:\n${summary.updated.map((n) => `  ~ ${n}`).join("\n")}`);
  if (summary.withoutPrice.length) {
    console.log(`\n⚠ Sem preço (o site não é publicado enquanto estiverem com preço 0). Preencha no ${PRODUCTS_FILE}:`);
    console.log(summary.withoutPrice.map((n) => `  - ${n}`).join("\n"));
  }
  if (highlightLines.length) {
    console.log(`\nPara o carrossel da página inicial, cole estas linhas no src/_data/highlights.json.`);
    console.log(`Troque o "alt" por uma descrição da foto e, se quiser, escreva um "caption" (o texto que aparece sobre a foto).\n`);
    console.log(highlightLines.join("\n"));
  }
  if (problems) process.exitCode = 1;
}

// Run only when called as a script (parsePhotoName can be imported by tests)
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
