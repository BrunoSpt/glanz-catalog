// Interest list: customers mark pieces with the heart button and send them all
// in one Instagram Direct message. Stored only on the customer's device (localStorage).
import { copyText } from './clipboard.js';
import { installmentPlan } from './installments.js';
import { openDialog, closeDialog } from './dialog.js';
import { showToast } from './toast.js';

const STORAGE_KEY = 'glanz:interest-list';

function load(){
  try {
    const items = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(items) ? items : [];
  } catch(e) {
    return []; // storage blocked (private mode) or corrupted
  }
}

function save(items){
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch(e) { /* list still works for this visit */ }
}

// Pieces currently available, embedded in every page at build time ({ id: { name, price, url, image } })
function readCatalog(){
  try {
    return JSON.parse(document.getElementById('catalogIndex')?.textContent || 'null');
  } catch(e) {
    return null;
  }
}

// The collection is replaced every 2 months and pieces are unique: keep only pieces that are
// still available, refreshing their name, price, photo and link from the current catalog
function syncWithCatalog(saved, catalog){
  if(!catalog) return { items: saved, removed: 0 };
  const items = saved.filter(item => catalog[item.id]).map(item => ({ id: item.id, ...catalog[item.id] }));
  return { items, removed: saved.length - items.length };
}

function removedNotice(count){
  return count === 1
    ? '1 peça da sua lista não está mais disponível: foi vendida ou saiu da coleção.'
    : `${count} peças da sua lista não estão mais disponíveis: foram vendidas ou saíram da coleção.`;
}

function el(tag, className, text){
  const node = document.createElement(tag);
  if(className) node.className = className;
  if(text != null) node.textContent = text;
  return node;
}

export function initInterestList(){
  const dialog = document.getElementById('interestList');
  if(!dialog) return;

  const { instagram, listMessage, placeholderImage } = document.body.dataset;
  const listEl = dialog.querySelector('[data-list-items]');
  const emptyEl = dialog.querySelector('[data-list-empty]');
  const footEl = dialog.querySelector('[data-list-foot]');
  const sendLink = dialog.querySelector('[data-list-send]');
  const messageBox = dialog.querySelector('[data-list-message-box]');
  const copyButton = dialog.querySelector('[data-list-copy]');
  const copyLabel = dialog.querySelector('[data-list-copy-label]');
  const removeIcon = dialog.querySelector('[data-list-close] svg');
  const noticeEl = dialog.querySelector('[data-list-notice]');
  const totalEl = dialog.querySelector('[data-list-total]');
  const installmentsEl = dialog.querySelector('[data-list-installments]');
  const installmentRules = JSON.parse(document.body.dataset.installments || '[]');
  const brl = (value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const catalog = readCatalog();
  const synced = syncWithCatalog(load(), catalog);
  let items = synced.items;
  if(synced.removed){
    save(items);
    noticeEl.textContent = removedNotice(synced.removed);
    noticeEl.hidden = false;
    showToast(synced.removed === 1 ? 'Uma peça saiu da sua lista' : `${synced.removed} peças saíram da sua lista`);
  }
  const has = (id) => items.some(item => item.id === id);

  function buildMessage(){
    const lines = items.map(item => `• ${item.name} (${item.price})`);
    return [listMessage, ...lines].join('\n');
  }

  function renderItem(item){
    const li = el('li', 'drawer-item');
    const thumb = el('img', 'drawer-thumb' + (item.image ? '' : ' placeholder'));
    thumb.src = item.image || placeholderImage;
    thumb.alt = '';
    const text = el('div');
    const link = el('a', null, item.name);
    link.href = item.url;
    text.append(link, el('span', 'item-price', item.price));
    const remove = el('button', 'icon-button');
    remove.type = 'button';
    remove.setAttribute('aria-label', `Remover ${item.name} da lista`);
    remove.append(removeIcon.cloneNode(true));
    remove.addEventListener('click', () => toggle(item));
    li.append(thumb, text, remove);
    return li;
  }

  function render(){
    // header counters
    document.querySelectorAll('[data-list-count]').forEach(count => {
      count.textContent = items.length;
      count.hidden = items.length === 0;
    });
    document.querySelectorAll('[data-list-open]').forEach(button => {
      if(button.classList.contains('list-button')){
        button.setAttribute('aria-label', `Abrir lista de interesse (${items.length} ${items.length === 1 ? 'peça' : 'peças'})`);
      }
    });
    // heart buttons
    document.querySelectorAll('[data-list-toggle]').forEach(button => {
      const inList = has(button.dataset.id);
      button.setAttribute('aria-pressed', String(inList));
      button.setAttribute('aria-label', `${inList ? 'Remover' : 'Adicionar'} ${button.dataset.name} ${inList ? 'da' : 'à'} lista de interesse`);
      const label = button.querySelector('.toggle-label');
      if(label) label.textContent = inList ? 'Na sua lista' : 'Adicionar à lista';
    });
    // drawer
    listEl.replaceChildren(...items.map(renderItem));
    emptyEl.hidden = items.length > 0;
    footEl.hidden = items.length === 0;
    // total and interest-free installments (prices come from the current catalog)
    const total = items.reduce((sum, item) => sum + (item.priceValue || 0), 0);
    const plan = installmentPlan(total, installmentRules);
    totalEl.textContent = brl(total);
    installmentsEl.textContent = plan ? `ou ${plan.count}x de ${brl(plan.value)} sem juros` : '';

    const message = buildMessage();
    messageBox.value = message;
    messageBox.rows = Math.min(6, items.length + 1);
    setCopied(false);
    sendLink.dataset.message = message;
    sendLink.href = `https://ig.me/m/${instagram}?text=${encodeURIComponent(message)}`;
  }

  function setCopied(copied){
    copyButton.classList.toggle('is-done', copied);
    copyLabel.textContent = copied ? 'Lista copiada' : 'Copiar lista';
  }

  // Step 1 of sending: copy the message, with visible confirmation
  copyButton.addEventListener('click', () => {
    copyText(messageBox.value)
      .then(() => {
        setCopied(true);
        showToast('Lista copiada — agora abra o Direct e cole');
      })
      .catch(() => {
        // Leave the text selected so the customer can copy it by hand
        messageBox.focus();
        messageBox.select();
        messageBox.setSelectionRange(0, messageBox.value.length);
        showToast('Não deu para copiar — segure o dedo no texto');
      });
  });

  function toggle(item){
    if(has(item.id)){
      items = items.filter(i => i.id !== item.id);
      showToast('Removida da sua lista');
    } else {
      items = [...items, item];
      showToast('Adicionada à sua lista');
    }
    save(items);
    render();
  }

  document.querySelectorAll('[data-list-toggle]').forEach(button => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      const { id, name, price, url, image } = button.dataset;
      // the catalog entry also carries the numeric price used for the total
      toggle(catalog?.[id] ? { id, ...catalog[id] } : { id, name, price, url, image });
    });
  });

  document.querySelectorAll('[data-list-open]').forEach(button => {
    button.addEventListener('click', () => openDialog(dialog));
  });
  dialog.querySelectorAll('[data-list-close]').forEach(button => {
    button.addEventListener('click', () => closeDialog(dialog));
  });
  // click on the dimmed backdrop closes the drawer
  dialog.addEventListener('click', (event) => {
    if(event.target === dialog) closeDialog(dialog);
  });

  // keep several open tabs in sync
  window.addEventListener('storage', (event) => {
    if(event.key === STORAGE_KEY){
      items = syncWithCatalog(load(), catalog).items;
      render();
    }
  });

  render();
}
