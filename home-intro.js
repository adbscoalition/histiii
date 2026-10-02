/* One 0.5s fade + 2s story + split reveal. No frames, polling, storage, or generated nodes. */
(() => {
  const root = document.documentElement;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!root.hasAttribute('data-home-entry') || root.classList.contains('histi-home-return') || motion.matches || window.location.hash || document.hidden) return;

  let cover = null;
  let skip = null;
  let phase = 'pending';
  let protectedRegions = [];
  let safetyTimer = 0;
  let storyTimer = 0;
  let curtainTimer = 0;
  let finishTimer = 0;
  const classes = ['histi-intro-pending', 'histi-intro-active', 'histi-intro-revealing', 'histi-home-arriving'];

  function restoreRegions() {
    protectedRegions.forEach(([region, wasInert]) => { region.inert = wasInert; });
    protectedRegions = [];
  }

  function restoreFocus() {
    if (cover?.contains(document.activeElement)) {
      document.querySelector('.hero-copy .home-button-primary')?.focus({ preventScroll: true });
    }
  }

  function finish() {
    if (phase === 'done') return;
    phase = 'done';
    clearTimeout(safetyTimer);
    clearTimeout(storyTimer);
    clearTimeout(curtainTimer);
    clearTimeout(finishTimer);
    root.classList.remove(...classes);
    restoreRegions();
    restoreFocus();
    if (cover) cover.hidden = true;
    skip?.removeEventListener('click', finish);
    document.removeEventListener('DOMContentLoaded', start);
    document.removeEventListener('keydown', onKey);
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('pagehide', finish);
    window.removeEventListener('pageshow', onPageShow);
    window.removeEventListener('hashchange', finish);
    motion.removeEventListener('change', onMotion);
  }

  function reveal() {
    if (phase !== 'story') return;
    phase = 'reveal';
    clearTimeout(storyTimer);
    restoreRegions();
    restoreFocus();
    root.classList.add('histi-intro-revealing', 'histi-home-arriving');
    curtainTimer = setTimeout(() => {
      cover.hidden = true;
      root.classList.remove('histi-intro-active', 'histi-intro-revealing');
    }, 950);
    // Finish after the last staggered homepage element has settled, not just the sheets.
    finishTimer = setTimeout(finish, 1500);
  }

  function start() {
    if (phase !== 'pending') return;
    cover = document.getElementById('histi-intro');
    if (!cover || motion.matches || document.hidden || window.location.hash) return finish();
    skip = cover.querySelector('.intro-skip');
    protectedRegions = [...document.querySelectorAll('body > header, body > main, body > footer, body > .histi-safety-notice')].map(region => [region, region.inert]);
    protectedRegions.forEach(([region]) => { region.inert = true; });
    cover.hidden = false;
    phase = 'story';
    root.classList.remove('histi-intro-pending');
    root.classList.add('histi-intro-active');
    skip?.addEventListener('click', finish);
    clearTimeout(safetyTimer);
    safetyTimer = setTimeout(finish, 4200);
    storyTimer = setTimeout(reveal, 2500);
  }

  function onKey(event) { if (event.key === 'Escape') finish(); }
  function onVisibility() { if (document.hidden) finish(); }
  function onMotion() { if (motion.matches) finish(); }
  function onPageShow(event) { if (event.persisted) finish(); }

  root.classList.add('histi-intro-pending');
  // An independent CSS fallback also clears the pre-paint black if initialization fails.
  safetyTimer = setTimeout(finish, 4500);
  document.addEventListener('keydown', onKey);
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('pagehide', finish);
  window.addEventListener('pageshow', onPageShow);
  window.addEventListener('hashchange', finish);
  motion.addEventListener('change', onMotion);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
