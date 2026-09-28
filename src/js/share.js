// "Compartilhar" buttons: native share sheet on phones, copy the link elsewhere
import { copyText } from './clipboard.js';
import { showToast } from './toast.js';

export function initShareButtons(root = document){
  root.querySelectorAll('[data-share]').forEach(button => {
    button.addEventListener('click', async () => {
      const data = { title: button.dataset.shareTitle, url: button.dataset.shareUrl };
      if(navigator.share){
        try { await navigator.share(data); } catch(e) { /* user closed the share sheet */ }
        return;
      }
      copyText(data.url)
        .then(() => showToast('Link da peça copiado'))
        .catch(() => {});
    });
  });
}
