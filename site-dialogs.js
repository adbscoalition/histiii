// One lifecycle record per popup. No observers, frame loops, or growing listeners.
const popups = new WeakMap();
const reducedMotion = () => document.hidden || document.body.classList.contains('reduce-motion') || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const CLOSE_FALLBACK_MS = 240;

function stopEntry(record) {
  record.entry?.cancel();
  record.press?.cancel();
  record.entry = null;
  record.press = null;
}

function animateFromButton(popup, record, trigger) {
  stopEntry(record);
  if (reducedMotion() || typeof popup.animate !== 'function' || !trigger?.getBoundingClientRect) return;
  // No cloned button, overlay, observer, or permanent inline style. Travel is
  // capped so a footer button never throws a dialog across the whole screen.
  if (!['BUTTON', 'A'].includes(trigger.tagName?.toUpperCase())) return;
  const source = trigger.getBoundingClientRect();
  const target = popup.getBoundingClientRect();
  if (!source.width || !source.height || !target.width || !target.height) return;
  const dx = Math.max(-56, Math.min(56, source.x + source.width / 2 - target.x - target.width / 2));
  const dy = Math.max(-56, Math.min(56, source.y + source.height / 2 - target.y - target.height / 2));
  const origin = `${Math.max(0, Math.min(100, (source.x + source.width / 2 - target.x) / target.width * 100))}% ${Math.max(0, Math.min(100, (source.y + source.height / 2 - target.y) / target.height * 100))}%`;
  const entry = popup.animate([
    { opacity: 0, transform: `translate(${dx}px,${dy}px) scale(.93)`, transformOrigin: origin },
    { opacity: 1, transform: 'translate(0,0) scale(1.012)', transformOrigin: origin, offset: .75 },
    { opacity: 1, transform: 'none', transformOrigin: origin }
  ], { duration: 460, easing: 'cubic-bezier(.22,.8,.25,1)', fill: 'backwards' });
  record.entry = entry;
  entry.finished.then(() => { if (record.entry === entry) record.entry = null; entry.cancel(); }, () => {});
  if (typeof trigger.animate === 'function') {
    const press = trigger.animate([{ transform: 'scale(.96)' }, { transform: 'none' }], { duration: 260, easing: 'cubic-bezier(.22,.8,.25,1)' });
    record.press = press;
    press.finished.then(() => { if (record.press === press) record.press = null; press.cancel(); }, () => {});
  }
}

function settle(popup, completed = false) {
  const record = popups.get(popup);
  if (!record) return;
  stopEntry(record);
  if (record.timer !== null) clearTimeout(record.timer);
  record.timer = null;
  popup.classList.remove('suite-popup-closing');
  const resolve = record.resolve;
  record.resolve = null;
  record.pending = null;
  resolve?.(completed);
}

function prepare(popup, native) {
  let record = popups.get(popup);
  if (record) return record;
  record = { timer: null, pending: null, resolve: null, value: '', focus: null, entry: null, press: null };
  popups.set(popup, record);
  popup.classList.add('suite-popup');
  popup.addEventListener('transitionend', event => {
    if (event.target === popup && event.propertyName === 'opacity' && record.pending) finish(popup, native);
  });
  if (native) {
    popup.addEventListener('cancel', event => {
      event.preventDefault();
      void closeDialog(popup);
    });
    // Navigation may close a native dialog directly. Cancel its pending exit too.
    popup.addEventListener('close', () => { if (!popup.open) settle(popup); });
  } else {
    popup.addEventListener('keydown', event => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      void closePanel(popup);
    });
  }
  return record;
}

function finish(popup, native) {
  const record = popups.get(popup);
  const value = record.value;
  if (native) {
    if (popup.open) popup.close(value);
  } else {
    popup.hidden = true;
    if (popup.contains(document.activeElement) && record.focus?.isConnected) record.focus.focus();
  }
  settle(popup, true);
}

function dismiss(popup, native, value = '') {
  if (!popup) return Promise.resolve(false);
  const record = prepare(popup, native);
  if (record.pending) return record.pending;
  if (native ? !popup.open : popup.hidden) return Promise.resolve(false);
  stopEntry(record);
  record.value = value;
  if (reducedMotion()) {
    finish(popup, native);
    return Promise.resolve(true);
  }
  record.pending = new Promise(resolve => { record.resolve = resolve; });
  popup.classList.add('suite-popup-closing');
  record.timer = setTimeout(() => finish(popup, native), CLOSE_FALLBACK_MS);
  return record.pending;
}

export function openDialog(popup, trigger = document.activeElement) {
  const record = prepare(popup, true);
  if (record.pending) settle(popup);
  if (!popup.open) {
    popup.returnValue = '';
    popup.showModal();
    animateFromButton(popup, record, trigger);
  }
}

export function closeDialog(popup, value = '') { return dismiss(popup, true, value); }

export function openPanel(popup, trigger = document.activeElement) {
  if (!popup) return;
  const record = prepare(popup, false);
  if (record.pending) settle(popup);
  if (!popup.hidden) return;
  record.focus = document.activeElement;
  popup.hidden = false;
  // Full-screen legacy sheets keep their existing inner-card entrance.
  if (popup.classList.contains('utility-panel')) animateFromButton(popup, record, trigger);
  if (popup.getAttribute('role') === 'dialog') popup.querySelector('button:not(:disabled),a[href]')?.focus();
}

export function closePanel(popup) { return dismiss(popup, false); }

let resetDialog;
let resetMessage;
let resetResolve = null;

function createResetDialog() {
  resetDialog = document.createElement('dialog');
  resetDialog.className = 'suite-reset-dialog';
  resetDialog.setAttribute('aria-labelledby', 'suite-reset-title');
  resetDialog.setAttribute('aria-describedby', 'suite-reset-message');
  const logo = document.createElement('img');
  logo.src = '/histi-logo.webp?v=facelift-1';
  logo.alt = 'HISTI';
  logo.width = 90;
  logo.height = 48;
  const eyebrow = document.createElement('p');
  eyebrow.className = 'eyebrow';
  eyebrow.textContent = 'A fresh start';
  const title = document.createElement('h2');
  title.id = 'suite-reset-title';
  title.textContent = 'Reset this check-in?';
  resetMessage = document.createElement('p');
  resetMessage.id = 'suite-reset-message';
  const note = document.createElement('p');
  note.className = 'suite-reset-note';
  note.textContent = 'This cannot be undone. Your choices stay untouched if you cancel.';
  const actions = document.createElement('div');
  actions.className = 'suite-reset-actions';
  const cancel = document.createElement('button');
  cancel.type = 'button';
  cancel.autofocus = true;
  cancel.className = 'secondary';
  cancel.textContent = 'Keep my answers';
  cancel.addEventListener('click', () => { void closeDialog(resetDialog); });
  const confirm = document.createElement('button');
  confirm.type = 'button';
  confirm.className = 'primary';
  confirm.textContent = 'Yes, reset';
  confirm.addEventListener('click', () => { void closeDialog(resetDialog, 'confirm'); });
  actions.append(cancel, confirm);
  resetDialog.append(logo, eyebrow, title, resetMessage, note, actions);
  document.body.append(resetDialog);
  prepare(resetDialog, true);
  resetDialog.addEventListener('click', event => { if (event.target === resetDialog) void closeDialog(resetDialog); });
  resetDialog.addEventListener('close', () => {
    const resolve = resetResolve;
    resetResolve = null;
    resolve?.(resetDialog.returnValue === 'confirm');
  });
}

export function confirmReset(message) {
  if (resetResolve) return Promise.resolve(false);
  if (!resetDialog) createResetDialog();
  resetMessage.textContent = message;
  const answer = new Promise(resolve => { resetResolve = resolve; });
  openDialog(resetDialog);
  return answer;
}
