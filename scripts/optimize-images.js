// Prepares photos for the site: `npm run images`
//
// Put the original photos (JPG, PNG, WebP or HEIC, any size, any file name) in a
// subfolder of photos-inbox/:
//   - one per category — the category slug ("rings") or its Portuguese label
//     ("Anéis", "Pulseiras", "Pingente"…) — for product photos;
//   - "Destaques" (or "highlights") for home carousel photos that aren't of a single
//     piece (a model wearing the jewelry, compositions, campaign shots).
// For each photo this script:
//   - fixes the rotation stored by phone cameras,
//   - resizes to 1200px wide (never enlarges), keeping the proportions,
//   - saves as WebP (quality 80) in src/assets/products/<category>/ or src/assets/highlights/,
//   - moves the original to photos-inbox/processed/ so it isn't converted again,
// and prints the lines to paste in products.json (price 0 on purpose: the data
// validation blocks publishing until a real price is set) or highlights.json.
//
// Messages are in Portuguese: this tool is meant for the store owner.
import { readdirSync, mkdirSync, renameSync, statSync, existsSync, readFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { slugify } from "../lib/slugify.js";

const INBOX = "photos-inbox";
const PROCESSED = path.join(INBOX, "processed");
const ASSETS = path.join("src", "assets");
const WIDTH = 1200;
const QUALITY = 80;
const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"]);

const categories = JSON.parse(readFileSync("src/_data/categories.json", "utf8"));

const HIGHLIGHTS = { label: "Destaques", kind: "highlight", dir: "highlights", assetPath: "assets/highlights" };

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

// "Anel Laço_.jpg" -> "Anel Laço"
const photoName = (fileName) => path.parse(fileName).name.replace(/_+$/, "").trim();

const kb = (bytes) => `${Math.round(bytes / 1024)} KB`;

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

async function main() {
  if (!existsSync(INBOX)) {
    mkdirSync(INBOX);
    console.log(`Criei a pasta ${INBOX}/. Coloque as fotos em subpastas por categoria (ex.: ${INBOX}/Anéis/) ou em ${INBOX}/Destaques/ e rode de novo.`);
    return;
  }

  const folders = readdirSync(INBOX).filter((f) => f !== "processed" && statSync(path.join(INBOX, f)).isDirectory());
  const productLines = [];
  const highlightLines = [];
  let converted = 0;
  let problems = 0;

  for (const folder of folders) {
    const target = targetFor(folder);
    if (!target) {
      console.log(`\n⚠ Pasta "${folder}" ignorada: use o nome de uma categoria (${categories.map((c) => c.label).join(", ")}) ou "Destaques".`);
      problems++;
      continue;
    }
    const files = readdirSync(path.join(INBOX, folder)).filter((f) => IMAGE_EXTENSIONS.has(path.extname(f).toLowerCase()));
    if (!files.length) continue;

    console.log(`\n${target.label} (${files.length} foto${files.length === 1 ? "" : "s"})`);
    mkdirSync(path.join(ASSETS, target.dir), { recursive: true });
    mkdirSync(path.join(PROCESSED, target.dir), { recursive: true });

    for (const file of files) {
      const inputPath = path.join(INBOX, folder, file);
      const name = photoName(file);
      const outputName = `${slugify(name)}.webp`;
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
        const image = `${target.assetPath}/${outputName}`;
        if (target.kind === "highlight") {
          highlightLines.push(
            `  { "image": "${image}", "width": ${output.width}, "height": ${output.height}, "alt": ${JSON.stringify(name)}, "caption": "" },`
          );
        } else {
          productLines.push(
            `  { "name": ${JSON.stringify(name)}, "category": "${target.slug}", "price": 0, "photos": ["${image}"] },`
          );
        }
        converted++;
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

  console.log(`\n${converted} foto${converted === 1 ? "" : "s"} pronta${converted === 1 ? "" : "s"} em ${ASSETS}/. As originais foram para ${PROCESSED}/.`);
  if (productLines.length) {
    console.log(`\nPara cadastrar, cole estas linhas no src/_data/products.json e troque o "price": 0 pelo preço de cada peça.`);
    console.log("(Enquanto algum preço estiver 0, o site não é publicado.)\n");
    console.log(productLines.join("\n"));
  }
  if (highlightLines.length) {
    console.log(`\nPara o carrossel da página inicial, cole estas linhas no src/_data/highlights.json.`);
    console.log(`Troque o "alt" por uma descrição da foto e, se quiser, escreva um "caption" (o texto que aparece sobre a foto).\n`);
    console.log(highlightLines.join("\n"));
  }
  if (problems) process.exitCode = 1;
}

main();
