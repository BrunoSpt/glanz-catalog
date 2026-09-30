// Product search: filters the catalog index embedded in every page as the customer types.
// No server involved, so it works instantly even on a slow connection.
import { openDialog, closeDialog } from './dialog.js';

// "Coração" -> "coracao": accents and case don't matter
export const normalize = (text) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

// Every word typed must appear in the piece's name or category ("brinco zirconia", "anel coracao")
export function searchCatalog(entries, query){
  const words = normalize(query).split(/\s+/).filter(Boolean);
  if(!words.length) return [];
  return entries.filter(entry => {
    const haystack = normalize(`${entry.name} ${entry.category}`);
    return words.every(word => haystack.includes(word));
  });
}

function el(tag, className, text){
  const node = document.createElement(tag);
  if(className) node.className = className;
  if(text != null) node.textContent = text;
  return node;
}

export function initSearch(){
  const dialog = document.getElementById('search');
  if(!dialog) return;

  let catalog = {};
  try { catalog = JSON.parse(document.getElementById('catalogIndex')?.textContent || '{}'); } catch(e) {}
  // the index lists available pieces first, sold ones last
  const entries = Object.values(catalog);

  const input = dialog.querySelector('[data-search-input]');
  const results = dialog.querySelector('[data-search-results]');
  const status = dialog.querySelector('[data-search-status]');
  const empty = dialog.querySelector('[data-search-empty]');
  const { placeholderImage } = document.body.dataset;

  function renderResult(entry){
    const li = el('li', 'search-result' + (entry.soldOut ? ' is-sold-out' : ''));
    const link = el('a');
    link.href = entry.url;
    const thumb = el('img', 'search-thumb' + (entry.image ? '' : ' placeholder'));
    thumb.src = entry.image || placeholderImage;
    thumb.alt = '';
    thumb.loading = 'lazy';
    const text = el('span', 'search-text');
    text.append(
      el('span', 'search-name', entry.name),
      el('span', 'search-meta', `${entry.category} · ${entry.soldOut ? 'Vendida' : entry.price}`)
    );
    link.append(thumb, text);
    li.append(link);
    return li;
  }

  function update(){
    const query = input.value;
    const found = searchCatalog(entries, query);
    results.replaceChildren(...found.map(renderResult));
    const searching = normalize(query).length > 0;
    empty.hidden = !searching || found.length > 0;
    status.textContent = !searching ? ''
      : found.length === 0 ? 'Nenhuma peça encontrada'
      : found.length === 1 ? '1 peça encontrada'
      : `${found.length} peças encontradas`;
  }

  input.addEventListener('input', update);
  // "Search" on the phone keyboard: go straight to the only result, otherwise just hide the keyboard
  input.addEventListener('keydown', (event) => {
    if(event.key !== 'Enter') return;
    const first = results.querySelector('a');
    if(results.children.length === 1 && first) first.click();
    else input.blur();
  });

  document.querySelectorAll('[data-search-open]').forEach(button => {
    button.addEventListener('click', () => {
      openDialog(dialog);
      input.focus(); // inside the tap, so iPhone also opens the keyboard
    });
  });
  dialog.querySelector('[data-search-close]').addEventListener('click', () => closeDialog(dialog));
  dialog.addEventListener('click', (event) => {
    if(event.target === dialog) closeDialog(dialog);
  });
}
