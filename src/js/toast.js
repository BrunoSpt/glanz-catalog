// Short notice at the bottom of the screen

let toastTimer = null;

export function showToast(text){
  let toast = document.getElementById('toast');
  if(!toast){
    toast = document.createElement('div');
    toast.className = 'toast';
    toast.id = 'toast';
    toast.setAttribute('role', 'status');
    document.body.appendChild(toast);
  }
  toast.textContent = text;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3500);
}
