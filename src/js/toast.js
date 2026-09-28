// Short notice at the bottom of the screen

let toastTimer = null;

export function showToast(text){
  let toast = document.getElementById('toast');
  if(!toast){
    toast = document.createElement('div');
    toast.className = 'toast';
    toast.id = 'toast';
    toast.setAttribute('role', 'status');
  }
  // An open modal <dialog> (interest list, photo zoom) sits in the browser's top layer,
  // above everything else in the page, so the toast must live inside it to be seen
  const host = document.querySelector('dialog[open]') || document.body;
  if(toast.parentElement !== host) host.appendChild(toast);

  toast.textContent = text;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3500);
}
