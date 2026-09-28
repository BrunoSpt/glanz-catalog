// 404 page: links to pieces from past collections (/products/...) get a friendlier message,
// since pieces are unique and the collection is replaced every 2 months

export function initNotFound(){
  const head = document.querySelector('[data-not-found]');
  if(!head || !/\/products\//.test(location.pathname)) return;

  const { productKicker, productTitle, productText } = head.dataset;
  head.querySelector('[data-not-found-kicker]').textContent = productKicker;
  head.querySelector('[data-not-found-title]').textContent = productTitle;
  head.querySelector('[data-not-found-text]').textContent = productText;
  document.title = `${productTitle} — ${document.title.split(' — ').pop()}`;
}
