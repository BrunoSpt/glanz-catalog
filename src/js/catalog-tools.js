// Sort and filter on the category pages.
// The cards are already on the page (rendered at build time in A–Z order); this only reorders
// and hides them. The choice is kept in the address (?ordem=menor-preco&filtro=disponiveis&preco=80-130),
// so it survives a reload or going back to the page, and the store can send a filtered link.
import { DEFAULT_SORT, isSort, sortProducts, priceRanges, inRange } from './catalog-order.js';

const FILTERS = {
  disponiveis: item => !item.soldOut,
  promocao: item => item.sale,
};

const pieces = n => `${n} ${n === 1 ? 'peça' : 'peças'}`;

export function initCatalogTools(){
  const tools = document.querySelector('[data-catalog-tools]');
  const grid = document.querySelector('[data-catalog-grid]');
  if(!tools || !grid) return;

  const select = tools.querySelector('[data-sort]');
  const filterButtons = [...tools.querySelectorAll('[data-filter]')];
  const rangeButtons = [...tools.querySelectorAll('[data-price-range]')];
  const empty = grid.querySelector('[data-filter-empty]');
  const count = document.querySelector('[data-catalog-count]');
  const rules = JSON.parse(document.body.dataset.installments || '[]');
  const ranges = Object.fromEntries(priceRanges(rules.map(rule => rule.above)).map(range => [range.id, range]));

  const items = [...grid.querySelectorAll('.card')].map(card => ({
    card,
    name: card.dataset.name,
    price: Number(card.dataset.priceValue),
    soldOut: card.classList.contains('is-sold-out'),
    sale: card.hasAttribute('data-sale'),
  }));

  // Only values that match a control on this page are accepted from the address
  function readAddress(){
    const params = new URLSearchParams(location.search);
    const sort = params.get('ordem');
    const filters = (params.get('filtro') || '').split(',');
    const range = params.get('preco');
    return {
      sort: isSort(sort) ? sort : DEFAULT_SORT,
      filters: filterButtons.map(b => b.dataset.filter).filter(f => filters.includes(f)),
      range: rangeButtons.some(b => b.dataset.priceRange === range) && ranges[range] ? range : null,
    };
  }

  // replaceState: changing a filter doesn't add a step to the browser's back button
  function writeAddress(){
    const params = new URLSearchParams(location.search);
    const set = (key, value) => value ? params.set(key, value) : params.delete(key);
    set('ordem', state.sort === DEFAULT_SORT ? '' : state.sort);
    set('filtro', state.filters.join(','));
    set('preco', state.range || '');
    const query = params.toString();
    history.replaceState(history.state, '', `${location.pathname}${query ? `?${query}` : ''}${location.hash}`);
  }

  function render(){
    select.value = state.sort;
    filterButtons.forEach(b => b.setAttribute('aria-pressed', String(state.filters.includes(b.dataset.filter))));
    rangeButtons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.priceRange === state.range)));

    const matches = item => state.filters.every(f => FILTERS[f](item)) && (!state.range || inRange(item.price, ranges[state.range]));
    let shown = 0;
    sortProducts(items, state.sort).forEach(item => {
      item.card.hidden = !matches(item);
      if(!item.card.hidden) shown++;
      grid.insertBefore(item.card, empty); // the "no pieces" message stays last
    });
    if(empty) empty.hidden = shown > 0;
    if(count) count.textContent = shown === items.length ? pieces(items.length) : `${shown} de ${pieces(items.length)}`;
  }

  function update(){
    render();
    writeAddress();
  }

  let state = readAddress();
  render();

  select.addEventListener('change', () => {
    state.sort = isSort(select.value) ? select.value : DEFAULT_SORT;
    update();
  });

  // "Disponíveis" and "Promoção" can be combined
  filterButtons.forEach(button => button.addEventListener('click', () => {
    const filter = button.dataset.filter;
    state.filters = state.filters.includes(filter) ? state.filters.filter(f => f !== filter) : [...state.filters, filter];
    update();
  }));

  // One price range at a time; tapping the selected one again clears it
  rangeButtons.forEach(button => button.addEventListener('click', () => {
    const range = button.dataset.priceRange;
    state.range = state.range === range ? null : range;
    update();
  }));

  // Clears the filters but keeps the chosen order
  grid.querySelector('[data-clear-filters]')?.addEventListener('click', () => {
    state = { ...state, filters: [], range: null };
    update();
  });
}
