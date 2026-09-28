// "Perguntar no Direct" buttons: Instagram doesn't always honor the pre-filled text
// in ig.me links, so the message is also copied for the customer to paste in Direct.
import { showToast } from './toast.js';

function copyText(text){
  // Legacy method first: works in more places (including in-app browsers)
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none';
  document.body.appendChild(area);
  area.select();
  let copied = false;
  try { copied = document.execCommand('copy'); } catch(e) {}
  area.remove();
  if(copied) return Promise.resolve();

  return navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject(new Error('Clipboard unavailable'));
}

export function initDirectButtons(root = document){
  root.querySelectorAll('.ask[data-message]').forEach(button => {
    // The link itself still opens Instagram; copying happens alongside it
    button.addEventListener('click', () => {
      copyText(button.dataset.message)
        .then(() => showToast('Mensagem copiada — é só colar no Direct'))
        .catch(() => {});
    });
  });
}
