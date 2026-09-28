# GLANZ Semi Joias — Digital Catalog

Mobile-first product catalog for **GLANZ Semi Joias**, a jewelry store in Petrolina, Brazil. Customers browse pieces by category and ask about any item through Instagram Direct with one tap.

**Live site:** https://brunospt.github.io/glanz-catalog/

> The codebase is in English; the user interface is in Brazilian Portuguese (pt-BR), the store's language.
> The store owner's guide (in Portuguese) is at [`docs/store-guide.pt-BR.md`](docs/store-guide.pt-BR.md).

## Features

- **Static site generated with [Eleventy](https://www.11ty.dev/):** one shared layout and one category template generate every page, so header, navigation and metadata live in a single place.
- **Data-driven catalog:** products, categories, home highlights and site settings are JSON files in `src/_data/`. Product cards are rendered at build time, so pages show the catalog immediately without waiting for JavaScript.
- **Data validation:** every build checks the catalog data (JSON syntax, unknown fields, categories, prices, missing photos) and fails with a clear message, locally and in CI.
- **Instagram Direct integration:** each card opens a Direct chat with the store and a pre-written message naming the piece. Instagram doesn't always honor pre-filled text, so the message is also copied to the clipboard, with a toast telling the customer to paste it.
- **Carousels:** home highlights with autoplay that pauses on interaction; swipeable photo carousels on product cards.
- **Link previews:** Open Graph tags and a 1200×630 share image on every page.
- **Performance:** WebP images, explicit image dimensions to avoid layout shift, small vanilla JS modules and no runtime dependencies.
- **Accessibility:** respects `prefers-reduced-motion`, semantic navigation with `aria-current`, alt text on product photos.
- **Continuous deployment:** GitHub Actions builds and deploys to GitHub Pages on every push to `main`; pull requests are built and validated without deploying.

## Project structure

```
src/
  _data/
    site.json              Site URL, name, Instagram username, share image
    categories.json        Category slug, label and description
    products.json          Products
    highlights.json        Home carousel slides
  _includes/
    layouts/base.njk       Shared page layout (<head>, header, footer)
    partials/
      category-chips.njk   Category navigation
      product-card.njk     Product card macro
  index.njk                Home page
  category.njk             One template → one page per category (rings.html, earrings.html…)
  404.njk                  Not found page
  css/styles.css
  js/
    main.js                Entry point
    carousel.js            Card and home carousels
    direct-message.js      Copy-to-clipboard for Instagram Direct buttons
    toast.js               Toast notification
  assets/
    brand/                 Logo, icons, favicon, share image
    products/              Product photos (WebP)
scripts/validate-data.js   Catalog data validation (runs before every build)
docs/                      Store owner's guide (pt-BR)
.github/workflows/         Build and deploy pipeline
eleventy.config.js         Eleventy configuration and template filters
```

## Product data

`src/_data/products.json` is a list of products:

```json
{ "name": "Brinco Coração Cristal", "category": "earrings", "price": 49.90, "photos": ["assets/products/heart-earring.webp"] }
```

| Field      | Description |
|------------|-------------|
| `name`     | Product name shown to customers (pt-BR); also used in the Direct message. |
| `category` | A `slug` from `categories.json`: `rings`, `earrings`, `necklaces`, `bracelets` or `pendants`. |
| `price`    | Number in BRL, rendered as `R$ 49,90`. |
| `photos`   | Image paths relative to `src/`. More than one turns the card into a swipeable carousel; empty shows a placeholder. |
| `sample`   | Optional. `true` shows an "Exemplo" badge for demo items. |

Adding a category only requires a new entry in `categories.json`; its page is generated automatically.

## Development

Requires Node.js 20 or newer.

```bash
npm install
npm start          # dev server with live reload at http://localhost:8080
npm run build      # production build into _site/
npm run validate   # check the catalog data only
```

## Deployment

The workflow in `.github/workflows/deploy.yml` builds the site and publishes `_site/` to GitHub Pages on every push to `main` (repository **Settings → Pages → Source: GitHub Actions**).

The site URL is set once in `src/_data/site.json` (`url`), which is used to build the absolute URLs required by Open Graph tags.
