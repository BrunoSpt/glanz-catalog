// Photo carousels on product cards and the product page gallery: dots follow the visible photo

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
