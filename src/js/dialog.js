// Opens/closes <dialog> elements (interest list, photo viewer).
// Uses the native modal dialog where available; older browsers without <dialog>
// support (e.g. iOS before 15.4) get a simple fixed-position fallback instead of an error.

const supportsDialog = typeof HTMLDialogElement === 'function' && 'showModal' in HTMLDialogElement.prototype;

export function openDialog(dialog){
  if(supportsDialog){
    dialog.showModal();
    return;
  }
  dialog.classList.add('is-fallback');
  dialog.setAttribute('open', '');
  document.documentElement.classList.add('dialog-open');
}

export function closeDialog(dialog){
  if(supportsDialog){
    dialog.close();
    return;
  }
  dialog.removeAttribute('open');
  document.documentElement.classList.remove('dialog-open');
  // the native dialog fires "close"; keep listeners working in the fallback
  dialog.dispatchEvent(new Event('close'));
}

// Escape closes the fallback too (the native dialog already does this)
if(!supportsDialog){
  document.addEventListener('keydown', (event) => {
    if(event.key !== 'Escape') return;
    document.querySelectorAll('dialog[open]').forEach(closeDialog);
  });
}
