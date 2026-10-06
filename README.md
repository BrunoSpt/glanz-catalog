# GLANZ Semi Joias — Digital Catalog

Mobile-first product catalog for **GLANZ Semi Joias**, a jewelry store in Petrolina, Brazil. Customers browse pieces by category and ask about any item through Instagram Direct with one tap.

**Live site:** https://glanzsemijoias.pages.dev/

> The codebase is in English; the user interface is in Brazilian Portuguese (pt-BR), the store's language.
> The store owner's guide (in Portuguese) is at [`docs/store-guide.pt-BR.md`](docs/store-guide.pt-BR.md).

## Features

- **Static site generated with [Eleventy](https://www.11ty.dev/):** one shared layout and one category template generate every page, so header, navigation and metadata live in a single place.
- **Data-driven catalog:** products, categories, the home hero photo and site settings are JSON files in `src/_data/`. Product cards are rendered at build time, so pages show the catalog immediately without waiting for JavaScript.
- **Data validation:** every build checks the catalog data (JSON syntax, unknown fields, categories, prices, missing photos) and fails with a clear message, locally and in CI.
- **Product pages:** every product gets its own shareable page (`/products/<name>/`) with a photo gallery, full-screen zoom, store guarantees, related products and a share button (native share sheet on phones, copy link elsewhere).
- **Sort and filter:** category pages open in alphabetical order; customers can sort by price and filter by availability, sale and price range. Price ranges follow the installment thresholds ("Até R$ 80", "R$ 80 a R$ 130"…), so a budget filter also tells the number of installments. Only filters that change something on that page are shown. The choice is kept in the address (`?ordem=menor-preco&preco=80-130`), so it survives a reload and the store can send a filtered link. The order rules (`js/catalog-order.js`) are shared by the build and the browser.
- **Search:** a magnifier in the header (and a search shortcut on the home page) opens instant search over the current collection, embedded in every page at build time — no server. Accent- and case-insensitive, matches name and category, lists available pieces first and marks sold ones.
- **Interest list:** customers heart the pieces they like and send the whole list in a single Instagram Direct message. Stored in `localStorage` on the customer's device; no backend.
- **Instagram Direct integration:** each product opens a Direct chat with a pre-written message naming the piece and linking to its page. Instagram doesn't always honor pre-filled text, so the message is also copied to the clipboard, with a toast telling the customer to paste it.
- **Unique pieces, rotating collection:** every piece is one of a kind and the collection is replaced every two months. Sold pieces stay visible as "Vendida" (listed last, can't be added to the list); interest lists saved on customers' phones automatically drop pieces that were sold or left the collection; links to past pieces land on a "piece no longer available" page that shows what is available now; the home page shows the current collection ("coleção de setembro e outubro"), worked out in the browser from the date, so it rolls over every two months with no manual update.
- **Store policies:** payment methods, interest-free installment rules, delivery and warranty live in `storePolicies.json`; product pages show the installment plan for their price and the interest list shows the total with its plan, all from the same rules (`js/installments.js`, shared by the build and the browser).
- **Badges:** "Promoção" (with the original price struck through) and "Vendida", driven by product fields.
- **Home page:** a campaign photo (or several, taking turns slowly; autoplay waits while the customer interacts and is off with reduced motion) with the current collection as the headline, category shortcuts styled like Instagram story highlights, one row of available pieces per category (swipeable on phones, four side by side on desktop), guarantees and a "Como comprar" guide.
- **Photo-first cards:** product cards are the photo, name and price, with a quiet Instagram Direct link; swipeable when a piece has several photos. The product page has the prominent Direct button.
- **Responsive layout:** two-column grid on phones, three on tablets and four on desktop; product pages switch to a two-column layout on larger screens.
- **Link previews:** Open Graph tags and a 1200×630 share image on every page.
- **Performance:** WebP images, explicit image dimensions to avoid layout shift, small vanilla JS modules and no runtime dependencies.
- **Accessibility:** respects `prefers-reduced-motion`, semantic navigation with `aria-current`, alt text on product photos.
- **End-to-end tests:** Playwright runs the production build on iPhone-sized WebKit (Safari's engine, including the narrowest 375px screen) and desktop Chromium, covering every page, the interest list, photo zoom and Instagram Direct links. Expectations are derived from the catalog data.
- **Continuous deployment:** GitHub Actions builds, tests and deploys to Cloudflare Pages on every push to `main`; pull requests are built and tested without deploying. A failing test blocks the deploy.

## Project structure

```
src/
  _data/
    site.json              Site URL, name, Instagram username, share image
    categories.json        Category slug, label and description
    products.json          Products
    hero.json              Home page hero photos (more than one: a slow carousel)
    howToBuy.json          "Como comprar" steps
    storePolicies.json     Payment methods, installments, delivery and warranty
  _includes/
    layouts/base.njk       Shared page layout (<head>, header, footer)
    partials/
      category-chips.njk   Category navigation (chips)
      category-circles.njk Home category shortcuts
      guarantees.njk       Store guarantees list
      icons.njk            Inline SVG icons
      product-card.njk     Product card, badges, price and button macros
  index.njk                Home page
  category.njk             One template → one page per category (rings/, earrings/…)
  product.njk              One template → one page per product (products/<slug>/)
  404.njk                  Not found page
  css/styles.css
  js/
    main.js                Entry point
    carousel.js            Card and gallery photo carousels
    hero-carousel.js       Home hero photos taking turns
    catalog-tools.js       Sort and filter on the category pages
    catalog-order.js       Product order and price ranges (also used by the build)
    interest-list.js       Interest list (localStorage + drawer)
    lightbox.js            Full-screen photo zoom
    share.js               Share button
    search.js              Instant product search
    collection.js          Current collection cycle notice
    installments.js        Installment rules (also used by the build)
    not-found.js           "Piece no longer available" message on the 404 page
    direct-message.js      Copy-to-clipboard for Instagram Direct links
    clipboard.js           Clipboard helper
    toast.js               Toast notification
  assets/
    brand/                 Logo, favicon (SVG, the "G" of the logo) and its PNG versions, share image
    highlights/            Home hero photos that aren't of a single product
    products/              Product photos (WebP)
lib/slugify.js             Product name → URL slug (shared by build and validation)
scripts/validate-data.js   Catalog data validation (runs before every build)
scripts/build-icons.js     PNG favicon and iPhone home screen icon from favicon.svg
scripts/optimize-images.js Photo pipeline (sharp): rotate, resize, WebP, rename; registers products (price from the file name) and prints hero.json lines
tests/
  e2e/catalog.spec.js      End-to-end tests (Playwright)
  serve-site.js            Serves _site/ like Cloudflare Pages for the tests
playwright.config.js       Test projects: iPhone 17, narrow iPhone, desktop Chrome
docs/                      Store owner's guide (pt-BR)
.github/workflows/         Build and deploy pipeline
eleventy.config.js         Eleventy configuration and template filters
```

## Product data

`src/_data/products.json` is a list of products:

```json
{ "name": "Anel Laço", "category": "rings", "price": 143.00, "photos": ["assets/products/rings/anel-laco.webp"] }
```

| Field      | Description |
|------------|-------------|
| `name`     | Product name shown to customers (pt-BR); also used in the Direct message. |
| `category` | A `slug` from `categories.json`: `rings`, `earrings`, `necklaces`, `bracelets` or `pendants`. |
| `price`    | Number in BRL, rendered as `R$ 49,90`. |
| `photos`   | Image paths relative to `src/`. More than one turns the card into a swipeable carousel; empty shows a placeholder. |
| `compareAtPrice` | Optional. Original price, greater than `price`; shows the "Promoção" badge and strikes it through. |
| `soldOut`  | Optional. `true` marks the piece as sold: "Vendida" badge, listed last and excluded from interest lists. |
| `sample`   | Optional. `true` shows an "Exemplo" badge for demo items. |

Product page URLs are derived from the name (`Anel Laço` → `/products/anel-laco/`), so names must be unique; the validation enforces it.

Adding a category only requires a new entry in `categories.json` (an optional `image` shows in its home shortcut); its page is generated automatically.

Store-wide guarantees shown on product pages and the home page live in `site.json` (`guarantees`; entries with `"homeOnly": true` are shown on the home page only), as does the collection cycle (`collection.firstCycle` and `collection.months`).

## Browser support

Current Chrome, Edge, Firefox and Safari, with special care for **iPhone (iOS Safari 15+)**, the store's main audience:

- `<dialog>` is used where supported, with a small fallback for iOS < 15.4 (`js/dialog.js`).
- Prefixed properties for Safari (`-webkit-backdrop-filter`, `-webkit-user-select`) and `vh` fallbacks for `dvh`.
- Hover styles only apply on devices that can hover (no "stuck" hover after a tap on iPhone).
- The browser's blue tap highlight is replaced by the brand's own press feedback.
- Photo zoom handles iOS pinch gestures itself, so the page doesn't zoom behind the viewer.
- Copy-to-clipboard selects text the way iOS requires, including inside open dialogs.

## Development

Requires Node.js 20 or newer.

```bash
npm install
npm start          # dev server with live reload at http://localhost:8080/
npm run build      # production build into _site/
npm run validate   # check the catalog data only
npm run icons      # regenerate the PNG icons from src/assets/brand/favicon.svg
npm run images     # convert photos in photos-inbox/<category or Destaques>/ to 1200px WebP in src/assets/

npm run test:install   # once: download the WebKit and Chromium test browsers
npm test               # build, serve and run the end-to-end tests
```

## Deployment

The workflow in `.github/workflows/deploy.yml` builds and tests the site on every push and pull request. On `main`, it then publishes `_site/` to **Cloudflare Pages** (project `glanzsemijoias`) with Wrangler. It needs two repository secrets: `CLOUDFLARE_API_TOKEN` (a token with the *Account → Cloudflare Pages → Edit* permission) and `CLOUDFLARE_ACCOUNT_ID`.

If a test fails, nothing is deployed and the Playwright report is attached to the run. The site is built and tested in GitHub Actions rather than by Cloudflare so that the iPhone tests keep blocking a broken deploy.

The site URL is set once in `src/_data/site.json` (`url`). It drives the absolute URLs required by Open Graph tags and, if the site is ever hosted in a subfolder, the path prefix that Eleventy's HTML base plugin adds to every internal link. Pointing a custom domain at the Cloudflare project only requires updating that `url`.
