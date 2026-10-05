import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const read = file => readFileSync(new URL(file, root), 'utf8');

function harness() {
  const timers = new Map();
  let nextTimer = 0;
  let reduced = false;
  class Element {
    constructor(tag = 'dialog') {
      this.tagName = tag;
      this.open = false;
      this.hidden = true;
      this.isConnected = true;
      this.children = [];
      this.listeners = new Map();
      const classes = new Set();
      this.classList = { add: value => classes.add(value), remove: value => classes.delete(value), contains: value => classes.has(value) };
    }
    addEventListener(name, listener) { const list = this.listeners.get(name) || []; list.push(listener); this.listeners.set(name, list); }
    dispatch(name, detail = {}) { const event = { target: this, preventDefault() { this.defaultPrevented = true; }, ...detail }; for (const listener of this.listeners.get(name) || []) listener(event); return event; }
    setAttribute() {}
    getAttribute() { return null; }
    querySelector() { return null; }
    append(...children) { this.children.push(...children); }
    contains(child) { return child === this || this.children.some(node => node.contains(child)); }
    focus() { document.activeElement = this; }
    showModal() { this.invoker = document.activeElement; this.open = true; this.children.flatMap(c => c.children).find(c => c.autofocus)?.focus(); }
    close(value = '') { this.open = false; this.returnValue = value; this.invoker?.focus(); queueMicrotask(() => this.dispatch('close')); }
  }
  const document = { body: new Element('body'), hidden: false, activeElement: new Element('button'), createElement: tag => new Element(tag) };
  const api = vm.runInNewContext(read('site-dialogs.js').replaceAll('export function ', 'function ') + '\n({openDialog,closeDialog,openPanel,closePanel,confirmReset})', {
    document, window: { matchMedia: () => ({ matches: reduced }) },
    setTimeout: fn => { timers.set(++nextTimer, fn); return nextTimer; }, clearTimeout: id => timers.delete(id), Promise, WeakMap
  });
  const flush = () => { for (const [id, fn] of [...timers]) { timers.delete(id); fn(); } };
  return { ...api, document, Element, timers, flush, reduce: value => { reduced = value; } };
}

test('100 popup cycles reuse listeners and clear every exit timer', async () => {
  const h = harness();
  const dialog = new h.Element();
  for (let index = 0; index < 100; index++) {
    h.openDialog(dialog);
    const closing = h.closeDialog(dialog);
    assert.equal(h.closeDialog(dialog), closing, 'duplicate close reuses one promise');
    assert.equal(h.timers.size, 1);
    assert.equal(dialog.open, true, 'native modal stays open throughout exit');
    dialog.dispatch('transitionend', { propertyName: 'opacity' });
    assert.equal(await closing, true);
    assert.equal(dialog.open, false);
    assert.equal(h.timers.size, 0);
    assert.equal(dialog.classList.contains('suite-popup-closing'), false);
  }
  assert.equal([...dialog.listeners.values()].flat().length, 3);
});

test('Escape, interrupted exit, direct native close, and fallback are safe', async () => {
  const h = harness();
  const dialog = new h.Element();
  h.openDialog(dialog);
  assert.equal(dialog.dispatch('cancel').defaultPrevented, true);
  assert.equal(h.timers.size, 1);
  h.openDialog(dialog);
  assert.equal(h.timers.size, 0);
  assert.equal(dialog.open, true);
  const exit = h.closeDialog(dialog);
  h.flush();
  assert.equal(await exit, true);
  h.openDialog(dialog);
  const interrupted = h.closeDialog(dialog);
  dialog.close();
  assert.equal(await interrupted, false);
  assert.equal(h.timers.size, 0);
});

test('reduced motion and hidden tabs close immediately without timers', async () => {
  const h = harness();
  const dialog = new h.Element();
  h.reduce(true);
  h.openDialog(dialog);
  await h.closeDialog(dialog);
  assert.equal(dialog.open, false);
  assert.equal(h.timers.size, 0);
  h.reduce(false);
  h.document.hidden = true;
  h.openDialog(dialog);
  await h.closeDialog(dialog);
  assert.equal(dialog.open, false);
  assert.equal(h.timers.size, 0);
});

test('legacy panel exits wait for the fade and restore focus', async () => {
  const h = harness();
  const panel = new h.Element('section');
  const child = new h.Element('button'); panel.append(child);
  const invoker = h.document.activeElement;
  h.openPanel(panel); child.focus();
  const exit = h.closePanel(panel);
  assert.equal(panel.hidden, false);
  h.flush(); await exit;
  assert.equal(panel.hidden, true);
  assert.equal(h.document.activeElement, invoker);
  assert.equal(h.timers.size, 0);
});

test('one reset dialog defaults to cancel and only explicit confirmation returns true', async () => {
  const h = harness();
  const cancelled = h.confirmReset('Test answers');
  const dialog = h.document.body.children[0];
  assert.equal(h.document.activeElement.textContent, 'Keep my answers');
  assert.equal(await h.confirmReset('Concurrent click'), false);
  dialog.children.at(-1).children[0].dispatch('click');
  h.flush(); assert.equal(await cancelled, false);
  const confirmed = h.confirmReset('Test answers again');
  dialog.children.at(-1).children[1].dispatch('click');
  h.flush(); assert.equal(await confirmed, true);
  const escaped = h.confirmReset('Escape test');
  dialog.dispatch('cancel'); h.flush();
  assert.equal(await escaped, false);
  assert.equal(h.document.body.children.length, 1);
  assert.equal(h.timers.size, 0);
});

test('shared animation coverage is finite, accessible, and does not move slider hit areas', () => {
  for (const file of readdirSync(root).filter(file => file.endsWith('.html'))) {
    const html = read(file);
    const motion = html.indexOf('/site-motion.css?v=spring-1');
    assert.ok(motion > html.indexOf('/site-experience.css') && motion < html.indexOf('/site-typography.css'), file);
  }
  const css = read('site-motion.css');
  const js = read('site-dialogs.js');
  assert.match(css, /@starting-style/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(css, /button:not\(\.h4-segment\)/);
  assert.doesNotMatch(css, /infinite|will-change|filter:/);
  assert.doesNotMatch(js, /setInterval|requestAnimationFrame|MutationObserver|prototype|innerHTML|localStorage/);
  assert.match(js, /CLOSE_FALLBACK_MS = 240/);
  assert.match(read('app-histi4.js'), /Reveal the new card after the full-screen veil/);
  for (const file of ['app-histi4.js','app-public-sans.js','app-histi120.js','app-histi-v3.js']) {
    assert.match(read(file), /await confirmReset/);
    assert.doesNotMatch(read(file), /window\.confirm\(|\!confirm\(/);
  }
});

test('button-to-dialog entry stays bounded over 100 interrupted openings', async () => {
  const h = harness();
  const dialog = new h.Element();
  const trigger = h.document.activeElement;
  const running = new Set();
  const requests = [];
  const animate = (frames, options) => {
    let resolve, reject;
    const effect = { finished: new Promise((yes,no) => {resolve=yes;reject=no;}), cancel(){running.delete(effect);reject(new Error('Cancelled'));}, finish(){resolve();} };
    running.add(effect);requests.push({frames,options});return effect;
  };
  dialog.animate = animate; trigger.animate = animate;
  dialog.getBoundingClientRect = () => ({x:200,y:100,width:600,height:500});
  trigger.getBoundingClientRect = () => ({x:5000,y:6000,width:90,height:40});
  for(let i=0;i<100;i++) {
    h.openDialog(dialog, trigger);
    assert.equal(running.size,2);
    assert.match(requests.at(-2).frames[0].transform,/translate\(56px,56px\) scale\(\.93\)/);
    assert.ok(requests.at(-2).options.duration<=500);
    const closing=h.closeDialog(dialog);h.flush();await closing;
    assert.equal(running.size,0);
    assert.equal(h.timers.size,0);
  }
  assert.equal([...dialog.listeners.values()].flat().length,3);
  h.openDialog(dialog,trigger);
  for(const effect of [...running])effect.finish();
  await Promise.resolve();assert.equal(running.size,0);
  const close=h.closeDialog(dialog);h.flush();await close;
  h.reduce(true);h.openDialog(dialog,trigger);assert.equal(running.size,0);
  await h.closeDialog(dialog);
});
