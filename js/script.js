// GLANZ SEMI JOIAS — sincroniza os pontinhos do carrossel com o slide visível
document.querySelectorAll('.carousel').forEach(carousel => {
  const dotsWrap = carousel.closest('.card')?.querySelector('.dots');
  const slides = carousel.querySelectorAll('.slide');
  if(!dotsWrap || slides.length <= 1) return; // 1 foto só: sem pontinhos

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

  const timer = setInterval(() => {
    if(!paused) goTo(index + 1);
  }, 3200);

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
