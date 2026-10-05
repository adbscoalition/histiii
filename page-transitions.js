(() => {
  const root = document.documentElement;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const isHome = root.hasAttribute('data-home-entry');
  const browserNavigation = window.navigation;
  const loadType = window.performance?.getEntriesByType?.('navigation')?.[0]?.type;
  const HISTORY_CURSOR = 'histi.navigation.cursor';
  const HISTORY_ENTRY = '__histiTransitionEntry';
  const trackedDirection = trackHistoryEntry(loadType === 'back_forward');
  let historyDirection = traversalDirection(browserNavigation?.activation) || trackedDirection;
  let nativeHistory = null;
  const HOME_HANDOFF = 'histi.navigation.home';
  const HANDOFF_VALID_MS = 15000;
  let homeReturn = false;
  if (isHome) {
    // Production intentionally sends no referrer. Consume one short-lived, answer-free handoff.
    try {
      const expires = Number(window.sessionStorage.getItem(HOME_HANDOFF));
      window.sessionStorage.removeItem(HOME_HANDOFF);
      homeReturn = expires > Date.now() && expires <= Date.now() + HANDOFF_VALID_MS;
    } catch {}
    homeReturn ||= loadType === 'back_forward' || loadType === 'reload' || browserNavigation?.activation?.navigationType === 'traverse';
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
  let outgoingHomeFlag = null;

  function traversalDirection(activation) {
    if (activation?.navigationType !== 'traverse') return null;
    const from = activation.from?.index, to = activation.entry?.index;
    if (Number.isInteger(from) && Number.isInteger(to) && from >= 0 && to >= 0 && from !== to) return to < from ? 'back' : 'forward';
    // Some engines expose page activation but not the Navigation API entry list.
    try {
      const previous = activation.from?.getState?.()?.[HISTORY_ENTRY];
      const next = activation.entry?.getState?.()?.[HISTORY_ENTRY];
      if (Number.isSafeInteger(previous) && Number.isSafeInteger(next) && previous !== next) return next < previous ? 'back' : 'forward';
    } catch {}
    return null;
  }

  function trackHistoryEntry(traversal) {
    try {
      const state = window.history.state;
      // Preserve other applications' state, including non-object state. Never push an entry.
      if (state !== null && (typeof state !== 'object' || Array.isArray(state))) return null;
      const cursor = Number(window.sessionStorage.getItem(HISTORY_CURSOR));
      const previous = Number.isSafeInteger(cursor) && cursor > 0 && cursor < 1e9 ? cursor : 0;
      let current = state?.[HISTORY_ENTRY];
      if (!Number.isSafeInteger(current) || current < 1 || current >= 1e9) {
        current = previous + 1;
        window.history.replaceState({ ...state, [HISTORY_ENTRY]: current }, '');
      }
      window.sessionStorage.setItem(HISTORY_CURSOR, String(current));
      return traversal && previous && current !== previous ? current < previous ? 'back' : 'forward' : null;
    } catch { return null; }
  }

  function clearNativeHistory() {
    nativeHistory?.skipTransition();
    nativeHistory = null;
    root.classList.remove('histi-native-back', 'histi-native-forward');
  }

  function markHomeHandoff(url) {
    if (!['/', '/index', '/index.html'].includes(url.pathname)) return;
    try {
      outgoingHomeFlag = String(Date.now() + HANDOFF_VALID_MS);
      window.sessionStorage.setItem(HOME_HANDOFF, outgoingHomeFlag);
    } catch {}
  }

  function clearHomeHandoff() {
    try {
      if (outgoingHomeFlag && window.sessionStorage.getItem(HOME_HANDOFF) === outgoingHomeFlag) window.sessionStorage.removeItem(HOME_HANDOFF);
    } catch {}
    outgoingHomeFlag = null;
  }

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

  function reveal(preserveHandoff = false) {
    if (preserveHandoff === true) outgoingHomeFlag = null;
    else clearHomeHandoff();
    clearTimeout(navigationTimer);
    clearTimeout(recoveryTimer);
    cancelAnimationFrame(firstFrame);
    cancelAnimationFrame(secondFrame);
    destination = null;
    cardGhost?.remove();
    cardGhost = null;
    root.classList.remove('histi-url-covered', 'histi-url-leaving', 'histi-url-card', 'histi-refresh');
  }

  function enter(restored = false) {
    reveal();
    clearEntry();
    if (restored === true) {
      if (isHome) root.classList.add('histi-home-return');
      return;
    }
    if (motion.matches) return;
    if (nativeHistory) return;
    if (loadType === 'reload') {
      root.classList.add('histi-url-motion', 'histi-refresh', 'histi-url-covered');
      recoveryTimer = setTimeout(reveal, 700);
      return;
    }
    if (!isHome || homeReturn) root.classList.add('histi-url-covered');
    // Let the destination paint behind the same veil before fading it away.
    firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => {
        reveal();
        if (nativeHistory) return;
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
      markHomeHandoff(new URL(destination));
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
      if (loadType === 'reload') root.classList.add('histi-refresh');
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
    if (motion.matches || document.hidden) { markHomeHandoff(url); return; }
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

  window.addEventListener('pageswap', event => {
    const direction = traversalDirection(event.activation);
    if (!event.viewTransition) return;
    if (!direction || motion.matches || document.hidden) { event.viewTransition.skipTransition(); return; }
    reveal(true); clearEntry();
    root.classList.add(`histi-native-${direction}`);
  });
  window.addEventListener('pagereveal', event => {
    const direction = traversalDirection(browserNavigation?.activation) || historyDirection;
    if (!event.viewTransition) return;
    if (!direction || motion.matches || document.hidden) { event.viewTransition.skipTransition(); return; }
    clearNativeHistory(); reveal(); clearEntry();
    const transition = event.viewTransition;
    nativeHistory = transition;
    root.classList.add('histi-url-motion', `histi-native-${direction}`);
    const finish = () => {
      if (nativeHistory !== transition) return;
      nativeHistory = null;
      root.classList.remove('histi-native-back', 'histi-native-forward');
    };
    transition.finished.then(finish, finish);
  });
  window.addEventListener('pagehide', () => { reveal(true); clearEntry(); clearNativeHistory(); });
  window.addEventListener('pageshow', event => {
    if (!event.persisted) return;
    const tracked = trackHistoryEntry(true);
    historyDirection = traversalDirection(browserNavigation?.activation) || tracked;
    enter(true);
  });
  browserNavigation?.addEventListener('navigate', event => {
    // Native reload cannot be intercepted or delayed. Start its fade while the browser loads.
    if (event.navigationType !== 'reload' || motion.matches || document.hidden) return;
    clearEntry(); clearNativeHistory();
    root.classList.add('histi-url-motion', 'histi-refresh', 'histi-url-covered');
    clearTimeout(recoveryTimer);
    recoveryTimer = setTimeout(reveal, 1500);
  });
  motion.addEventListener('change', () => {
    if (!motion.matches) return;
    if (destination) navigate();
    reveal(true);
    clearEntry(); clearNativeHistory();
  });
})();
