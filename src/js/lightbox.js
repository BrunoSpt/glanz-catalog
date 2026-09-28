// Product page photo viewer: tap a photo to open it full screen, then zoom at your own pace.
//   Phones:  pinch with two fingers to zoom, drag with one finger to pan,
//            swipe sideways (not zoomed) to change photo.
//   Desktop: mouse wheel zooms toward the cursor, drag to pan, + / − buttons and keys.

import { openDialog, closeDialog } from './dialog.js';

const MIN_SCALE = 1;
const MAX_SCALE = 5;
const BUTTON_STEP = 1.6;
const SWIPE_DISTANCE = 60;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const midpoint = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

export function initLightbox(root = document){
  const dialog = root.querySelector('[data-lightbox]');
  if(!dialog) return;

  const stage = dialog.querySelector('[data-lightbox-stage]');
  const image = dialog.querySelector('[data-lightbox-image]');
  const triggers = Array.from(root.querySelectorAll('[data-zoom-index]'));
  const photos = triggers.map(trigger => {
    const img = trigger.querySelector('img');
    return { src: img.currentSrc || img.src, alt: img.alt };
  });

  let index = 0;
  // image transform: screen = base + offset + scale * point (transform-origin: 0 0)
  let scale = 1;
  let offset = { x: 0, y: 0 };

  function apply(){
    image.style.transform = `translate(${offset.x}px, ${offset.y}px) scale(${scale})`;
    stage.classList.toggle('is-zoomed', scale > 1);
  }

  function reset(){
    scale = 1;
    offset = { x: 0, y: 0 };
    apply();
  }

  // Untransformed top-left corner and size of the image, in screen coordinates
  function baseBox(){
    const rect = image.getBoundingClientRect();
    return { left: rect.left - offset.x, top: rect.top - offset.y, width: rect.width / scale, height: rect.height / scale };
  }

  // Keep part of the zoomed image under the center of the screen so it can't be dragged away
  function constrain(box){
    const stageRect = stage.getBoundingClientRect();
    const centerX = stageRect.left + stageRect.width / 2 - box.left;
    const centerY = stageRect.top + stageRect.height / 2 - box.top;
    offset.x = clamp(offset.x, centerX - box.width * scale, centerX);
    offset.y = clamp(offset.y, centerY - box.height * scale, centerY);
  }

  // Zoom to newScale keeping the screen point (clientX, clientY) fixed
  function zoomAt(clientX, clientY, newScale){
    const box = baseBox();
    const next = clamp(newScale, MIN_SCALE, MAX_SCALE);
    if(next === MIN_SCALE) return reset();
    const px = clientX - box.left;
    const py = clientY - box.top;
    offset.x = px - (next / scale) * (px - offset.x);
    offset.y = py - (next / scale) * (py - offset.y);
    scale = next;
    constrain(box);
    apply();
  }

  function zoomFromCenter(factor){
    const rect = stage.getBoundingClientRect();
    zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, scale * factor);
  }

  function show(i){
    index = (i + photos.length) % photos.length;
    image.src = photos[index].src;
    image.alt = photos[index].alt;
    reset();
  }

  // ---- touch & mouse (pointer events) ----
  const pointers = new Map();
  let gesture = null;

  stage.addEventListener('pointerdown', (event) => {
    // keep receiving moves even if the finger/mouse leaves the image
    try { stage.setPointerCapture(event.pointerId); } catch(e) { /* pointer already released */ }
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const points = [...pointers.values()];
    if(points.length === 2){
      gesture = { type: 'pinch', startDistance: distance(points[0], points[1]), startScale: scale };
    } else if(points.length === 1){
      gesture = { type: 'drag', start: points[0], startOffset: { ...offset } };
    }
  });

  stage.addEventListener('pointermove', (event) => {
    if(!pointers.has(event.pointerId) || !gesture) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const points = [...pointers.values()];

    if(gesture.type === 'pinch' && points.length === 2){
      const center = midpoint(points[0], points[1]);
      zoomAt(center.x, center.y, gesture.startScale * distance(points[0], points[1]) / gesture.startDistance);
    } else if(gesture.type === 'drag' && scale > 1){
      offset.x = gesture.startOffset.x + (points[0].x - gesture.start.x);
      offset.y = gesture.startOffset.y + (points[0].y - gesture.start.y);
      constrain(baseBox());
      apply();
    }
  });

  function endPointer(event){
    if(!pointers.has(event.pointerId)) return;
    const end = { x: event.clientX, y: event.clientY };
    pointers.delete(event.pointerId);

    // Swipe to change photo when not zoomed
    if(gesture?.type === 'drag' && scale === 1 && photos.length > 1){
      const dx = end.x - gesture.start.x;
      if(Math.abs(dx) > SWIPE_DISTANCE && Math.abs(dx) > Math.abs(end.y - gesture.start.y)){
        show(index + (dx < 0 ? 1 : -1));
      }
    }
    // After a pinch, the remaining finger continues as a drag
    const remaining = [...pointers.values()];
    gesture = remaining.length === 1 ? { type: 'drag', start: remaining[0], startOffset: { ...offset } } : null;
  }
  stage.addEventListener('pointerup', endPointer);
  stage.addEventListener('pointercancel', endPointer);

  // iOS Safari fires its own pinch "gesture" events and would zoom the whole page
  stage.addEventListener('gesturestart', (event) => event.preventDefault());
  stage.addEventListener('gesturechange', (event) => event.preventDefault());

  // Desktop: wheel zooms toward the cursor
  stage.addEventListener('wheel', (event) => {
    event.preventDefault();
    zoomAt(event.clientX, event.clientY, scale * Math.exp(-event.deltaY * 0.0015));
  }, { passive: false });

  // ---- buttons & keyboard ----
  triggers.forEach((trigger, i) => {
    trigger.addEventListener('click', () => {
      show(i);
      openDialog(dialog);
    });
  });

  dialog.querySelector('[data-lightbox-close]').addEventListener('click', () => closeDialog(dialog));
  dialog.querySelector('[data-lightbox-prev]')?.addEventListener('click', () => show(index - 1));
  dialog.querySelector('[data-lightbox-next]')?.addEventListener('click', () => show(index + 1));
  dialog.querySelector('[data-zoom-in]').addEventListener('click', () => zoomFromCenter(BUTTON_STEP));
  dialog.querySelector('[data-zoom-out]').addEventListener('click', () => zoomFromCenter(1 / BUTTON_STEP));

  dialog.addEventListener('keydown', (event) => {
    if(event.key === '+' || event.key === '=') zoomFromCenter(BUTTON_STEP);
    if(event.key === '-') zoomFromCenter(1 / BUTTON_STEP);
    if(photos.length < 2 || scale > 1) return;
    if(event.key === 'ArrowLeft') show(index - 1);
    if(event.key === 'ArrowRight') show(index + 1);
  });

  dialog.addEventListener('close', reset);
  window.addEventListener('resize', () => { if(dialog.open) reset(); });
}
