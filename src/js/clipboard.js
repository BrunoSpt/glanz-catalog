// Copies text to the clipboard, resolving when done.
// Must be called directly from a click/tap handler (browsers only allow copying on user action).

function legacyCopy(text){
  const area = document.createElement('textarea');
  area.value = text;
  // readonly: no on-screen keyboard on phones; 16px avoids iOS zooming the page
  area.setAttribute('readonly', '');
  area.style.cssText = 'position:fixed;top:0;left:-9999px;font-size:16px;opacity:0';
  // While a modal <dialog> is open the rest of the page is inert (not focusable or selectable),
  // so the helper textarea must live inside the open dialog
  (document.querySelector('dialog[open]') || document.body).appendChild(area);

  // iOS ignores select() on its own; setSelectionRange is what selects the text there
  area.select();
  area.setSelectionRange(0, text.length);

  let copied = false;
  try { copied = document.execCommand('copy'); } catch(e) {}
  area.remove();
  return copied;
}

export function copyText(text){
  // Legacy method first: synchronous, so it keeps the user's tap "permission",
  // and it also works on plain http and in in-app browsers such as Instagram's
  if(legacyCopy(text)) return Promise.resolve();

  if(navigator.clipboard && window.isSecureContext){
    return navigator.clipboard.writeText(text);
  }
  return Promise.reject(new Error('Clipboard unavailable'));
}
