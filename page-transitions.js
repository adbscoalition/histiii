(() => {
  const root = document.documentElement;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const isHome = root.hasAttribute('data-home-entry');
  if (isHome && window.location.hash) root.classList.add('histi-home-deep-link');
  let destination = null;
  let navigationTimer = 0;
  let recoveryTimer = 0;
  let firstFrame = 0;
  let secondFrame = 0;
  let entryTimer = 0;

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
    root.classList.remove('histi-url-covered', 'histi-url-leaving');
  }

  function enter() {
    reveal();
    clearEntry();
    if (motion.matches) return;
    if (!isHome) root.classList.add('histi-url-motion', 'histi-url-covered');
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
  if (!motion.matches && !isHome) {
    root.classList.add('histi-url-motion', 'histi-url-covered');
    recoveryTimer = setTimeout(reveal, 1500);
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
    clearTimeout(recoveryTimer);
    cancelAnimationFrame(firstFrame);
    cancelAnimationFrame(secondFrame);
    destination = url.href;
    // Native modal dialogs sit above every document layer; close them for the full-screen veil.
    document.querySelectorAll('dialog[open]').forEach(dialog => dialog.close());
    root.classList.add('histi-url-motion', 'histi-url-leaving', 'histi-url-covered');
    navigationTimer = setTimeout(navigate, 340);
  });

  window.addEventListener('pagehide', () => { reveal(); clearEntry(); });
  window.addEventListener('pageshow', event => { if (event.persisted) enter(); });
  motion.addEventListener('change', () => {
    if (!motion.matches) return;
    if (destination) navigate();
    reveal();
    clearEntry();
  });
})();
