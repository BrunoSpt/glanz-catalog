// Generates the PNG icons from src/assets/brand/favicon.svg: `npm run icons`
//   - favicon-32.png: browsers that don't use the SVG favicon
//   - apple-touch-icon.png (180px): iPhone home screen. iOS rounds the corners itself and
//     shows transparent corners as black, so this one is a full square.
// Run it again whenever favicon.svg changes.
import { readFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const BRAND = path.join("src", "assets", "brand");
const svg = readFileSync(path.join(BRAND, "favicon.svg"), "utf8");
const fullSquare = svg.replace(/(<rect\b[^>]*?)\s+rx="[^"]*"/, "$1");

const render = (source, size, file) =>
  sharp(Buffer.from(source), { density: 72 * Math.ceil(size / 180) * 4 })
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toFile(path.join(BRAND, file))
    .then(() => console.log(`${file} (${size}px)`));

await render(svg, 32, "favicon-32.png");
await render(fullSquare, 180, "apple-touch-icon.png");
