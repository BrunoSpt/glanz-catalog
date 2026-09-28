// GLANZ SEMI JOIAS — entry point.
// Product cards are rendered at build time by Eleventy; this script only adds interactivity.
// Code is in English; every user-facing string stays in Brazilian Portuguese.
import { initCardCarousel, initHeroCarousel } from './carousel.js';
import { initDirectButtons } from './direct-message.js';

document.querySelectorAll('.card').forEach(initCardCarousel);

const heroTrack = document.getElementById('heroTrack');
const heroDots = document.getElementById('heroDots');
if(heroTrack && heroDots) initHeroCarousel(heroTrack, heroDots);

initDirectButtons();
