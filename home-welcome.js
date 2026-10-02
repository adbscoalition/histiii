// Visitor introduction only. One tab-session flag, no assessment state or requests.
export function initWelcome(root, {
  getStorage = () => window.sessionStorage,
  currentHash = () => window.location.hash,
  reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
} = {}) {
  const dialog = root.querySelector('#histi-welcome');
  if (!dialog || typeof dialog.showModal !== 'function' || dialog.dataset.welcomeReady === 'true') return;
  dialog.dataset.welcomeReady = 'true';
  const replay = root.querySelector('[data-welcome-open]');
  const homeAction = root.querySelector('.home-hero .home-button-primary');
  const scrollPane = dialog.querySelector('.welcome-scroll');
  const tabs = [...dialog.querySelectorAll('[data-welcome-tab]')];
  const panels = [...dialog.querySelectorAll('[data-welcome-panel]')];
  let phase = 'closed', exit = null, previousFocus = null, previousOverflow = '';
  const key = 'histi.welcome.v1';
  const remember = () => { try { getStorage().setItem(key, 'seen'); } catch {} };
  const select = tab => {
    tabs.forEach(button => {
      const selected = button === tab;
      button.setAttribute('aria-selected', String(selected));
      button.setAttribute('tabindex', selected ? '0' : '-1');
    });
    panels.forEach(panel => { panel.hidden = panel.dataset.welcomePanel !== tab.dataset.welcomeTab; });
  };
  const settle = () => {
    if (phase === 'closed') return;
    if (exit) { exit.onfinish = null; exit.cancel(); exit = null; }
    phase = 'closed';
    dialog.dataset.welcomeState = 'closed';
    root.body.style.overflow = previousOverflow;
    root.body.classList.remove('histi-welcome-open');
    remember();
    const focus = previousFocus !== root.body && previousFocus?.isConnected ? previousFocus : homeAction;
    focus?.focus({ preventScroll: true });
  };
  const dismiss = () => {
    if (phase !== 'open') return;
    phase = 'closing';
    dialog.dataset.welcomeState = 'closing';
    remember();
    if (root.hidden || reducedMotion() || typeof dialog.animate !== 'function') { dialog.close(); return; }
    try {
      exit = dialog.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 280, easing: 'cubic-bezier(.22,1,.36,1)' });
      exit.onfinish = () => { dialog.close(); };
    } catch { dialog.close(); }
  };
  const open = () => {
    if (phase !== 'closed') return;
    previousFocus = root.activeElement;
    previousOverflow = root.body.style.overflow;
    root.body.style.overflow = 'hidden';
    root.body.classList.add('histi-welcome-open');
    phase = 'open';
    dialog.dataset.welcomeState = 'open';
    select(tabs[0]);
    if (scrollPane) scrollPane.scrollTop = 0;
    try { dialog.showModal(); }
    catch { settle(); }
  };
  dialog.addEventListener('click', event => {
    if (phase !== 'open') return;
    const tab = event.target.closest('[data-welcome-tab]');
    if (tabs.includes(tab)) { select(tab); return; }
    if (event.target.closest('[data-welcome-dismiss]')) dismiss();
  });
  dialog.addEventListener('keydown', event => {
    const index = tabs.indexOf(event.target.closest('[data-welcome-tab]'));
    if (index < 0 || phase !== 'open') return;
    const next = event.key === 'ArrowRight' ? (index + 1) % tabs.length : event.key === 'ArrowLeft' ? (index + tabs.length - 1) % tabs.length : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : -1;
    if (next < 0) return;
    event.preventDefault();
    select(tabs[next]);
    tabs[next].focus();
  });
  dialog.addEventListener('cancel', event => { event.preventDefault(); dismiss(); });
  dialog.addEventListener('close', settle);
  if (replay) { replay.hidden = false; replay.addEventListener('click', open); }
  let seen = false;
  try { seen = getStorage().getItem(key) === 'seen'; } catch {}
  if (!currentHash() && !seen) open();
}

if (typeof document !== 'undefined') initWelcome(document);
