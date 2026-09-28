// Instagram Direct links: Instagram doesn't always honor the pre-filled text in ig.me links,
// so the message is also copied for the customer to paste in Direct.
import { copyText } from './clipboard.js';
import { showToast } from './toast.js';

export function initDirectButtons(root = document){
  // Event delegation: also covers links whose message is set later
  // (the interest list fills in its "Enviar lista no Direct" link after this runs).
  // The link itself still opens Instagram; copying happens alongside it.
  root.addEventListener('click', (event) => {
    const link = event.target.closest('a[data-message]');
    if(!link || !link.dataset.message) return;
    copyText(link.dataset.message)
      .then(() => showToast('Mensagem copiada — é só colar no Direct'))
      .catch(() => {});
  });
}
