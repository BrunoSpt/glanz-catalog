// GLANZ SEMI JOIAS — catálogo montado a partir do produtos.json

// sincroniza os pontinhos do carrossel de um card com a foto visível
function initCardCarousel(card){
  const carousel = card.querySelector('.carousel');
  const dotsWrap = card.querySelector('.dots');
  const slides = carousel.querySelectorAll('.slide');
  if(slides.length <= 1) return; // 1 foto só: sem pontinhos

  // cria um pontinho por foto, igual ao carrossel da home
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

// cria um elemento com classe e texto (textContent evita problema com caracteres especiais nos nomes)
function el(tag, className, text){
  const node = document.createElement(tag);
  if(className) node.className = className;
  if(text != null) node.textContent = text;
  return node;
}

const formatPrice = (value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const directMessage = (nomePeca) => 'Olá! Tenho interesse na peça: ' + nomePeca;

// ig.me/m/<usuário> abre a conversa no Direct; o ?text= preenche a mensagem
// nas versões do Instagram que suportam (não é garantido)
function directLink(instagram, nomePeca){
  const base = 'https://ig.me/m/' + instagram;
  return nomePeca ? base + '?text=' + encodeURIComponent(directMessage(nomePeca)) : base;
}

// aviso rápido no rodapé da tela
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

// como o texto pré-preenchido nem sempre funciona, copia a mensagem pra cliente colar no Direct
function copyDirectMessage(nomePeca){
  const text = directMessage(nomePeca);
  const done = () => showToast('Mensagem copiada — é só colar no Direct');

  // método antigo primeiro: funciona em mais lugares (inclusive navegadores internos de apps)
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

function renderCard(produto, instagram){
  const card = el('div', 'card');
  const carousel = el('div', 'carousel');

  if(produto.fotos && produto.fotos.length){
    produto.fotos.forEach((foto, i) => {
      const slide = el('div', 'slide');
      const img = el('img');
      img.src = foto;
      img.alt = produto.nome + (produto.fotos.length > 1 ? ` — foto ${i + 1}` : '') + ' — GLANZ Semi Joias';
      img.loading = 'lazy';
      slide.appendChild(img);
      carousel.appendChild(slide);
    });
  } else {
    const slide = el('div', 'slide placeholder');
    const icon = el('img');
    icon.src = 'assets/marca/sunburst.png';
    icon.width = 160;
    icon.height = 165;
    icon.alt = '';
    slide.append(icon, el('span', null, 'Foto em breve'));
    carousel.appendChild(slide);
  }
  if(produto.exemplo){
    carousel.firstElementChild.prepend(el('span', 'badge-demo', 'Exemplo'));
  }

  const info = el('div', 'info');
  const ask = el('a', 'ask', 'Perguntar no Direct →');
  ask.href = directLink(instagram, produto.nome);
  ask.target = '_blank';
  ask.rel = 'noopener';
  ask.addEventListener('click', () => copyDirectMessage(produto.nome));
  info.append(
    el('p', 'name serif', produto.nome),
    el('p', 'price', formatPrice(produto.preco)),
    ask
  );

  card.append(carousel, el('div', 'dots'), info);
  return card;
}

function renderCategory(grid, data){
  const categoria = grid.dataset.categoria;
  const produtos = data.produtos.filter(p => p.categoria === categoria);

  const count = document.getElementById('productCount');
  if(count) count.textContent = `Catálogo · ${produtos.length} ${produtos.length === 1 ? 'peça' : 'peças'}`;

  if(!produtos.length){
    grid.appendChild(el('p', 'grid-message', 'Novas peças em breve.'));
    return;
  }
  produtos.forEach(produto => {
    const card = renderCard(produto, data.instagram);
    grid.appendChild(card);
    initCardCarousel(card);
  });
}

// usuário do Instagram vem do produtos.json: atualiza links e @ do rodapé em todas as páginas
function applyInstagram(instagram){
  document.querySelectorAll('[data-ig-link]').forEach(a => { a.href = directLink(instagram); });
  document.querySelectorAll('[data-ig-handle]').forEach(s => { s.textContent = '@' + instagram; });
}

fetch('produtos.json')
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
    console.error('Não foi possível carregar produtos.json:', err);
    const grid = document.getElementById('productGrid');
    if(grid) grid.appendChild(el('p', 'grid-message', 'Não foi possível carregar as peças. Tente recarregar a página.'));
  });

// ---- carrossel autoplay da home (destaques do catálogo) ----
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

  // quem ativou "reduzir movimento" no celular não recebe a troca automática de fotos
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!reduceMotion){
    setInterval(() => {
      if(!paused) goTo(index + 1);
    }, 3200);
  }

  // pausa o autoplay quando a pessoa mexe no carrossel, retoma depois de um tempo parada
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
