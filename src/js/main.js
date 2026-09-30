// GLANZ SEMI JOIAS — entry point.
// Pages are rendered at build time by Eleventy; this script only adds interactivity.
// Code is in English; every user-facing string stays in Brazilian Portuguese.
import { initCardCarousel, initHeroCarousel } from './carousel.js';
import { initDirectButtons } from './direct-message.js';
import { initInterestList } from './interest-list.js';
import { initLightbox } from './lightbox.js';
import { initNotFound } from './not-found.js';
import { initCollectionNote } from './collection.js';
import { initSearch } from './search.js';
import { initShareButtons } from './share.js';

// iOS Safari only applies :active styles on touch when a touch listener exists
// (the CSS tap feedback replaces the browser's blue tap highlight)
document.addEventListener('touchstart', () => {}, { passive: true });

// Photos fade in once loaded (see "photos fade in" in styles.css)
document.querySelectorAll('.carousel img, .carousel-hero img').forEach(img => {
  const markLoaded = () => img.classList.add('is-loaded');
  if(img.complete) markLoaded();
  else {
    img.addEventListener('load', markLoaded, { once: true });
    img.addEventListener('error', markLoaded, { once: true });
  }
});

// Product cards and the product page gallery share the same carousel markup
document.querySelectorAll('.card, [data-gallery]').forEach(initCardCarousel);

const heroTrack = document.getElementById('heroTrack');
const heroDots = document.getElementById('heroDots');
if(heroTrack && heroDots) initHeroCarousel(heroTrack, heroDots);

initDirectButtons();
initInterestList();
initLightbox();
initShareButtons();
initNotFound();
initCollectionNote();
initSearch();
