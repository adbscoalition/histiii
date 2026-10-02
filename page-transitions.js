(() => {
  const root = document.documentElement;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const isHome = root.hasAttribute('data-home-entry');
  let homeReturn = false;
  if (isHome) {
    const navigation = window.performance?.getEntriesByType?.('navigation')?.[0];
    homeReturn = navigation?.type === 'back_forward' || navigation?.type === 'reload';
    try { homeReturn ||= new URL(document.referrer).origin === window.location.origin; } catch {}
    if (homeReturn) root.classList.add('histi-home-return');
  }
  if (isHome && window.location.hash) root.classList.add('histi-home-deep-link');
  let destination = null;
  let navigationTimer = 0;
  let recoveryTimer = 0;
  let firstFrame = 0;
  let secondFrame = 0;
  let entryTimer = 0;
  let cardGhost = null;

  function expandCard(link) {
    if (!link.matches?.('.app-card[href]:not(.soon), .home-format[href], .h4-choice[href]')) return false;
    const box = link.getBoundingClientRect();
    if (box.width < 1 || box.height < 1) return false;
    const style = window.getComputedStyle(link);
    const sx = box.width / window.innerWidth, sy = box.height / window.innerHeight;
    const radius = Math.max(0, parseFloat(style.getPropertyValue('border-top-left-radius')) || 24);
    cardGhost = document.createElement('div');
    cardGhost.className = 'histi-card-morph';
    cardGhost.setAttribute('aria-hidden', 'true');
    const surface = document.createElement('div');
    surface.className = 'histi-card-surface';
    surface.style.background = style.getPropertyValue('background');
    for (const [name, value] of Object.entries({
      '--card-x':`${box.left}px`, '--card-y':`${box.top}px`, '--card-sx':sx, '--card-sy':sy,
      '--card-press-x':`${box.left + box.width * .015}px`, '--card-press-y':`${box.top + box.height * .015}px`,
      '--card-press-sx':sx * .97, '--card-press-sy':sy * .97,
      '--card-radius-x':`${radius / sx}px`, '--card-radius-y':`${radius / sy}px`
    })) surface.style.setProperty(name, value);
    // The card face stays at its real size. Only the empty surface stretches.
    const face = link.cloneNode(true);
    face.removeAttribute('href'); face.removeAttribute('id'); face.setAttribute('tabindex', '-1');
    face.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
    face.classList.remove('home-reveal', 'home-reveal-pending', 'h4-reveal');
    face.classList.add('histi-card-face');
    Object.assign(face.style, { left:`${box.left}px`, top:`${box.top}px`, width:`${box.width}px`, height:`${box.height}px` });
    for (const property of ['background', 'border', 'border-radius', 'color']) face.style.setProperty(property, style.getPropertyValue(property), 'important');
    cardGhost.append(surface, face);
    document.body.append(cardGhost);
    root.classList.add('histi-url-card');
    return true;
  }

  function clearEntry() {
    clearTimeout(entryTimer);
    root.classList.remove('histi-page-enter');
  }

  function reveal() {
    clearTimeout(navigationTimer);
    clearTimeout(recoveryTimer);
    cancelAnimationFrame(firstFrame);
    cancelAnimationFrame(secondFrame);
    destination = null;
    cardGhost?.remove();
    cardGhost = null;
    root.classList.remove('histi-url-covered', 'histi-url-leaving', 'histi-url-card');
  }

  function enter(restored = false) {
    reveal();
    clearEntry();
    if (restored === true) {
      if (isHome) root.classList.add('histi-home-return');
      return;
    }
    if (motion.matches) return;
    if (!isHome || homeReturn) root.classList.add('histi-url-covered');
    // Let the destination paint behind the same veil before fading it away.
    firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => {
        reveal();
        root.classList.add('histi-page-enter');
        entryTimer = setTimeout(clearEntry, 900);
      });
    });
    recoveryTimer = setTimeout(reveal, 1500);
  }

  function navigate() {
    if (!destination) return;
    clearTimeout(navigationTimer);
    try {
      window.location.assign(destination);
      // Recover if a navigation is cancelled or the browser keeps this document.
      recoveryTimer = setTimeout(reveal, 1800);
    } catch {
      reveal();
    }
  }

  if (window.location.pathname.startsWith('/checkin-120')) root.classList.add('histi-url-blue');
  if (!motion.matches) {
    // Prime the invisible veil on the homepage too; creating it on click jumps straight to opaque.
    root.classList.add('histi-url-motion');
    if (!isHome || homeReturn) {
      root.classList.add('histi-url-covered');
      recoveryTimer = setTimeout(reveal, 1500);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enter, { once: true });
  else enter();

  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest('a[href]');
    if (!link || link.hasAttribute('download') || (link.target && link.target.toLowerCase() !== '_self')) return;
    const url = new URL(link.href, window.location.href);
    if (url.origin !== window.location.origin || !/^https?:$/.test(url.protocol)) return;
    if (url.pathname === window.location.pathname && url.search === window.location.search) return;
    if (/\.[^/]+$/.test(url.pathname) && !url.pathname.endsWith('.html')) return;
    if (motion.matches || document.hidden) return;
    event.preventDefault();
    if (destination) return;
    clearEntry();
    clearTimeout(recoveryTimer);
    cancelAnimationFrame(firstFrame);
    cancelAnimationFrame(secondFrame);
    destination = url.href;
    // Native modal dialogs sit above every document layer; close them for the full-screen veil.
    document.querySelectorAll('dialog[open]').forEach(dialog => dialog.close());
    const cardOpening = expandCard(link);
    root.classList.add('histi-url-motion', 'histi-url-leaving', 'histi-url-covered');
    navigationTimer = setTimeout(navigate, cardOpening ? 720 : 340);
  });

  window.addEventListener('pagehide', () => { reveal(); clearEntry(); });
  window.addEventListener('pageshow', event => { if (event.persisted) enter(true); });
  motion.addEventListener('change', () => {
    if (!motion.matches) return;
    if (destination) navigate();
    reveal();
    clearEntry();
  });
})();
