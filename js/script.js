// GLANZ SEMI JOIAS — catalog rendered from products.json
// Code is in English; every user-facing string stays in Brazilian Portuguese.

// Syncs a card's carousel dots with the visible photo
function initCardCarousel(card){
  const carousel = card.querySelector('.carousel');
  const dotsWrap = card.querySelector('.dots');
  const slides = carousel.querySelectorAll('.slide');
  if(slides.length <= 1) return; // single photo: no dots

  // one dot per photo, same as the home carousel
  slides.forEach((_, i) => {
    const dot = document.createElement('span');
    if(i === 0) dot.classList.add('active');
    dotsWrap.appendChild(dot);
  });
  const dots = Array.from(dotsWrap.children);
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        const idx = Array.from(slides).indexOf(entry.target);
        dots.forEach((d, i) => d.classList.toggle('active', i === idx));
      }
    });
  }, { root: carousel, threshold: 0.6 });

  slides.forEach(slide => observer.observe(slide));
}

// Creates an element with class and text (textContent keeps special characters in names safe)
function el(tag, className, text){
  const node = document.createElement(tag);
  if(className) node.className = className;
  if(text != null) node.textContent = text;
  return node;
}

const formatPrice = (value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const directMessage = (productName) => 'Olá! Tenho interesse na peça: ' + productName;

// ig.me/m/<username> opens the Instagram Direct chat; ?text= pre-fills the message
// on Instagram versions that support it (not guaranteed)
function directLink(instagram, productName){
  const base = 'https://ig.me/m/' + instagram;
  return productName ? base + '?text=' + encodeURIComponent(directMessage(productName)) : base;
}

// Short notice at the bottom of the screen
let toastTimer = null;
function showToast(text){
  let toast = document.getElementById('toast');
  if(!toast){
    toast = el('div', 'toast');
    toast.id = 'toast';
    toast.setAttribute('role', 'status');
    document.body.appendChild(toast);
  }
  toast.textContent = text;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3500);
}

// The pre-filled text is unreliable, so the message is also copied for the customer to paste in Direct
function copyDirectMessage(productName){
  const text = directMessage(productName);
  const done = () => showToast('Mensagem copiada — é só colar no Direct');

  // Legacy method first: works in more places (including in-app browsers)
  const area = el('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none';
  document.body.appendChild(area);
  area.select();
  let copied = false;
  try { copied = document.execCommand('copy'); } catch(e) {}
  area.remove();
  if(copied) return done();

  if(navigator.clipboard){
    navigator.clipboard.writeText(text).then(done).catch(() => {});
  }
}

function renderCard(product, instagram){
  const card = el('div', 'card');
  const carousel = el('div', 'carousel');

  if(product.photos && product.photos.length){
    product.photos.forEach((photo, i) => {
      const slide = el('div', 'slide');
      const img = el('img');
      img.src = photo;
      img.alt = product.name + (product.photos.length > 1 ? ` — foto ${i + 1}` : '') + ' — GLANZ Semi Joias';
      img.loading = 'lazy';
      slide.appendChild(img);
      carousel.appendChild(slide);
    });
  } else {
    const slide = el('div', 'slide placeholder');
    const icon = el('img');
    icon.src = 'assets/brand/sunburst.png';
    icon.width = 160;
    icon.height = 165;
    icon.alt = '';
    slide.append(icon, el('span', null, 'Foto em breve'));
    carousel.appendChild(slide);
  }
  if(product.sample){
    carousel.firstElementChild.prepend(el('span', 'badge-demo', 'Exemplo'));
  }

  const info = el('div', 'info');
  const ask = el('a', 'ask', 'Perguntar no Direct →');
  ask.href = directLink(instagram, product.name);
  ask.target = '_blank';
  ask.rel = 'noopener';
  ask.addEventListener('click', () => copyDirectMessage(product.name));
  info.append(
    el('p', 'name serif', product.name),
    el('p', 'price', formatPrice(product.price)),
    ask
  );

  card.append(carousel, el('div', 'dots'), info);
  return card;
}

function renderCategory(grid, data){
  const category = grid.dataset.category;
  const products = data.products.filter(p => p.category === category);

  const count = document.getElementById('productCount');
  if(count) count.textContent = `Catálogo · ${products.length} ${products.length === 1 ? 'peça' : 'peças'}`;

  if(!products.length){
    grid.appendChild(el('p', 'grid-message', 'Novas peças em breve.'));
    return;
  }
  products.forEach(product => {
    const card = renderCard(product, data.instagram);
    grid.appendChild(card);
    initCardCarousel(card);
  });
}

// The Instagram username comes from products.json: updates links and the footer handle on every page
function applyInstagram(instagram){
  document.querySelectorAll('[data-ig-link]').forEach(a => { a.href = directLink(instagram); });
  document.querySelectorAll('[data-ig-handle]').forEach(s => { s.textContent = '@' + instagram; });
}

fetch('products.json')
  .then(res => {
    if(!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  })
  .then(data => {
    applyInstagram(data.instagram);
    const grid = document.getElementById('productGrid');
    if(grid) renderCategory(grid, data);
  })
  .catch(err => {
    console.error('Could not load products.json:', err);
    const grid = document.getElementById('productGrid');
    if(grid) grid.appendChild(el('p', 'grid-message', 'Não foi possível carregar as peças. Tente recarregar a página.'));
  });

// ---- home autoplay carousel (catalog highlights) ----
(function(){
  const track = document.getElementById('heroTrack');
  const dotsWrap = document.getElementById('heroDots');
  if(!track || !dotsWrap) return;

  const slides = track.querySelectorAll('.slide');
  slides.forEach((_, i) => {
    const dot = document.createElement('span');
    if(i === 0) dot.classList.add('active');
    dotsWrap.appendChild(dot);
  });
  const dots = Array.from(dotsWrap.children);

  let index = 0;
  let paused = false;
  let resumeTimer = null;

  function goTo(i){
    index = (i + slides.length) % slides.length;
    track.scrollTo({ left: index * track.clientWidth, behavior: 'smooth' });
    dots.forEach((d, di) => d.classList.toggle('active', di === index));
  }

  // No automatic slide changes for users who enabled "reduce motion"
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!reduceMotion){
    setInterval(() => {
      if(!paused) goTo(index + 1);
    }, 3200);
  }

  // Pause autoplay while the user interacts; resume after a moment of inactivity
  track.addEventListener('pointerdown', () => {
    paused = true;
    clearTimeout(resumeTimer);
  });
  track.addEventListener('scroll', () => {
    const i = Math.round(track.scrollLeft / track.clientWidth);
    dots.forEach((d, di) => d.classList.toggle('active', di === i));
    index = i;
    clearTimeout(resumeTimer);
    resumeTimer = setTimeout(() => { paused = false; }, 4000);
  }, { passive: true });
})();
