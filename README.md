# GLANZ Semi Joias — Digital Catalog

Mobile-first product catalog for **GLANZ Semi Joias**, a jewelry store in Petrolina, Brazil. Customers browse pieces by category and ask about any item through Instagram Direct with one tap.

**Live site:** https://brunospt.github.io/projeto-catalago-semijoias/

> The codebase is in English; the user interface is in Brazilian Portuguese (pt-BR), the store's language.
> The store owner's guide (in Portuguese) is at [`docs/store-guide.pt-BR.md`](docs/store-guide.pt-BR.md).

## Features

- **Data-driven catalog:** every product lives in [`products.json`](products.json); category pages render their cards from it, so adding a product never touches HTML.
- **Instagram Direct integration:** each card opens a Direct chat with the store and a pre-written message naming the piece. Instagram doesn't always honor pre-filled text, so the message is also copied to the clipboard, with a toast telling the customer to paste it.
- **Home carousel** with autoplay that pauses on interaction, plus swipeable photo carousels on product cards.
- **Link previews:** Open Graph tags and a 1200×630 share image, so links shared on Instagram/WhatsApp show a rich preview.
- **Performance:** WebP images and explicit `width`/`height` on images to avoid layout shift.
- **Accessibility:** respects `prefers-reduced-motion` (no autoplay or animations), semantic navigation with `aria-current`, alt text on product photos.
- **No build step, no dependencies:** plain HTML, CSS and vanilla JavaScript, deployed on GitHub Pages.

## Project structure

```
index.html              Home: category chips + highlights carousel
rings.html              Category pages (Anéis, Brincos, Colares, Pulseiras, Pingentes)
earrings.html
necklaces.html
bracelets.html
pendants.html
products.json           Catalog data + store Instagram username
css/styles.css          Shared styles (brand palette as CSS variables)
js/script.js            Card rendering, carousels, Instagram Direct links
assets/brand/           Logo, icons, favicon, share image
assets/products/        Product photos (WebP)
docs/                   Store owner's guide (pt-BR)
```

## Product data

```json
{ "name": "Brinco Coração Cristal", "category": "earrings", "price": 49.90, "photos": ["assets/products/heart-earring.webp"] }
```

| Field      | Description |
|------------|-------------|
| `name`     | Product name shown to customers (pt-BR); also used in the Direct message. |
| `category` | `rings`, `earrings`, `necklaces`, `bracelets` or `pendants` — matches the page's `data-category`. |
| `price`    | Number in BRL, formatted as `R$ 49,90` via `Intl`. |
| `photos`   | Image paths. More than one turns the card into a swipeable carousel; empty shows a placeholder. |
| `sample`   | Optional. `true` shows an "Exemplo" badge for demo items. |

The top-level `instagram` field sets the store's username for every Direct link and footer handle.

## Running locally

`products.json` is loaded with `fetch`, so the site must be served over HTTP:

```bash
python -m http.server 8765
```

Then open http://localhost:8765.

## Deployment

GitHub Pages serves the `main` branch root. Open Graph tags need absolute URLs and currently point to `https://brunospt.github.io/projeto-catalago-semijoias/`; update `og:url` and `og:image` on every page if the site moves to another domain.
