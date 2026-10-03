// Home hero: when hero.json has more than one photo, they take turns while the headline stays put.
// Photos change slowly, wait while the customer is touching or swiping them, and never move
// on their own for people who turned on "reduce motion". The dots also let mouse users switch photos.

const INTERVAL = 5500;     // time each photo stays on screen
const RESUME_AFTER = 8000; // after the customer interacts

export function initHeroCarousel(){
  const root = document.querySelector('[data-hero-carousel]');
  if(!root) return;
  const track = root.querySelector('.hero-track');
  const dots = Array.from(root.querySelectorAll('.hero-dots button'));
  const count = dots.length;

  const visibleIndex = () => Math.round(track.scrollLeft / track.clientWidth);
  const goTo = (i) => track.scrollTo({ left: i * track.clientWidth, behavior: 'smooth' });

  function markDot(index){
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
      if(i === index) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });
  }
  track.addEventListener('scroll', () => markDot(visibleIndex()), { passive: true });

  let pausedUntil = 0;
  const pause = () => { pausedUntil = Date.now() + RESUME_AFTER; };
  track.addEventListener('pointerdown', pause);
  track.addEventListener('touchstart', pause, { passive: true });
  track.addEventListener('wheel', pause, { passive: true });

  dots.forEach((dot, i) => dot.addEventListener('click', () => {
    pause();
    goTo(i);
  }));

  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  setInterval(() => {
    if(document.hidden || Date.now() < pausedUntil) return;
    goTo((visibleIndex() + 1) % count);
  }, INTERVAL);
}
