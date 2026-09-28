// Carousels: photo carousels on product cards and the autoplay highlights carousel on the home page

function createDots(container, count){
  for(let i = 0; i < count; i++){
    const dot = document.createElement('span');
    if(i === 0) dot.classList.add('active');
    container.appendChild(dot);
  }
  return Array.from(container.children);
}

const setActiveDot = (dots, index) => dots.forEach((d, i) => d.classList.toggle('active', i === index));

// Syncs a card's carousel dots with the visible photo
export function initCardCarousel(card){
  const carousel = card.querySelector('.carousel');
  const dotsWrap = card.querySelector('.dots');
  const slides = Array.from(carousel.querySelectorAll('.slide'));
  if(slides.length <= 1) return; // single photo: no dots

  const dots = createDots(dotsWrap, slides.length);
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting) setActiveDot(dots, slides.indexOf(entry.target));
    });
  }, { root: carousel, threshold: 0.6 });

  slides.forEach(slide => observer.observe(slide));
}

// Home highlights: autoplay that pauses while the user interacts
export function initHeroCarousel(track, dotsWrap){
  const slides = track.querySelectorAll('.slide');
  const dots = createDots(dotsWrap, slides.length);

  let index = 0;
  let paused = false;
  let resumeTimer = null;

  function goTo(i){
    index = (i + slides.length) % slides.length;
    track.scrollTo({ left: index * track.clientWidth, behavior: 'smooth' });
    setActiveDot(dots, index);
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
    index = Math.round(track.scrollLeft / track.clientWidth);
    setActiveDot(dots, index);
    clearTimeout(resumeTimer);
    resumeTimer = setTimeout(() => { paused = false; }, 4000);
  }, { passive: true });
}
