// One reusable reset screen. Only a confirmed caller may invoke this operation.
let overlay, detail, pending;
const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
const reduced = () => motion.matches || document.hidden || document.body.classList.contains('reduce-motion');

function createScreen() {
  overlay = document.createElement('section');
  overlay.className = 'reset-transition'; overlay.hidden = true;
  overlay.setAttribute('role', 'status'); overlay.setAttribute('aria-label', 'Starting a fresh check-in');
  const inner = document.createElement('div'); inner.className = 'reset-transition-inner';
  const logo = document.createElement('img'); logo.src = '/histi-logo.webp?v=facelift-1'; logo.alt = 'HISTI'; logo.width = 118; logo.height = 63;
  const symbol = document.createElement('span'); symbol.className = 'reset-transition-symbol'; symbol.textContent = '↺'; symbol.setAttribute('aria-hidden', 'true');
  const title = document.createElement('h2'); title.textContent = 'A fresh start.';
  detail = document.createElement('p');
  inner.append(logo, symbol, title, detail); overlay.append(inner); document.body.append(overlay);
}

export function resetTransition(render, focusTarget) {
  if (pending) return Promise.resolve(false);
  const focus = () => { if (!document.hidden) (focusTarget || document.querySelector('#begin-btn, #start-btn'))?.focus({ preventScroll:true }); };
  if (reduced()) { render(); focus(); return Promise.resolve(true); }
  if (!overlay) createScreen();
  return new Promise((resolve, reject) => {
    const regions = [...document.querySelectorAll('main, .site-header, footer')].map(node => [node, node.inert]);
    const timers = new Set(); let committed = false;
    pending = true;
    function commit() { if (!committed) { committed = true; render(); detail.textContent = 'Your check-in is ready to begin again.'; } }
    function finish(error) {
      if (!pending) return;
      try { if (!error) commit(); } catch (failure) { error = failure; }
      timers.forEach(clearTimeout); timers.clear();
      overlay.classList.remove('is-visible'); overlay.hidden = true;
      regions.forEach(([node, wasInert]) => { node.inert = wasInert; });
      document.removeEventListener('visibilitychange', onHidden);
      window.removeEventListener('pagehide', onPageHide);
      motion.removeEventListener('change', onMotion);
      pending = false; focus();
      if (error) reject(error); else resolve(true);
    }
    function schedule(fn, ms) { const timer = setTimeout(() => { timers.delete(timer); try { fn(); } catch (error) { finish(error); } }, ms); timers.add(timer); }
    function onHidden() { if (document.hidden) finish(); }
    function onMotion() { if (motion.matches) finish(); }
    function onPageHide() { finish(); }
    document.addEventListener('visibilitychange', onHidden);
    window.addEventListener('pagehide', onPageHide);
    motion.addEventListener('change', onMotion);
    regions.forEach(([node]) => { node.inert = true; });
    detail.textContent = 'Making space for a fresh start.';
    overlay.hidden = false; void overlay.offsetWidth; overlay.classList.add('is-visible');
    schedule(() => { commit(); schedule(() => { overlay.classList.remove('is-visible'); schedule(finish, 380); }, 440); }, 320);
    schedule(finish, 1800);
  });
}
