// Minimal static server for the end-to-end tests: serves the production build (_site/)
// the way Cloudflare Pages does — under the site's path prefix, index.html for folders,
// and 404.html for anything missing. No dependencies.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { readFileSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve("_site");
const PORT = Number(process.env.PORT || 8090);
const site = JSON.parse(readFileSync("src/_data/site.json", "utf8"));
const PREFIX = new URL(site.url).pathname; // "/" (or "/folder/" for a site in a subfolder)

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

async function resolveFile(urlPath) {
  if (!urlPath.startsWith(PREFIX)) return null;
  let file = path.join(ROOT, decodeURIComponent(urlPath.slice(PREFIX.length)));
  if (!file.startsWith(ROOT)) return null; // no path traversal
  try {
    if ((await stat(file)).isDirectory()) file = path.join(file, "index.html");
    await stat(file);
    return file;
  } catch {
    return null;
  }
}

createServer(async (req, res) => {
  const { pathname } = new URL(req.url, "http://localhost");
  if (pathname === "/" && PREFIX !== "/") {
    res.writeHead(302, { Location: PREFIX }).end();
    return;
  }
  const file = await resolveFile(pathname);
  const target = file || path.join(ROOT, "404.html");
  res.writeHead(file ? 200 : 404, { "Content-Type": TYPES[path.extname(target)] || "application/octet-stream" });
  res.end(await readFile(target));
}).listen(PORT, () => console.log(`Serving _site at http://localhost:${PORT}${PREFIX}`));
