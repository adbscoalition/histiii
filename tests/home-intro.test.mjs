import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const read = file => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
const eventTarget = () => {
  const events = new Map();
  return { events, addEventListener: (name, fn) => events.set(name, fn), removeEventListener: (name, fn) => { if (events.get(name) === fn) events.delete(name); } };
};
const fixture = ({ home = true, hash = '', reduced = false, hidden = false, missing = false } = {}) => {
  const classes = new Set(), timers = new Map(); let id = 0, focusCalls = 0;
  const root = { hasAttribute: name => home && name === 'data-home-entry', classList: { add: (...names) => names.forEach(n => classes.add(n)), remove: (...names) => names.forEach(n => classes.delete(n)) } };
  const skip = eventTarget();
  const cover = { hidden: true, querySelector: () => skip, contains: node => node === skip };
  const regions = [{ inert: false }, { inert: false }, { inert: true }];
  const primary = { focus: options => { assert.equal(options.preventScroll, true); focusCalls++; document.activeElement = primary; } };
  const document = { ...eventTarget(), documentElement: root, readyState: 'loading', hidden, activeElement: null, getElementById: () => missing ? null : cover, querySelectorAll: () => regions, querySelector: () => primary };
  const motion = { ...eventTarget(), matches: reduced };
  const window = { ...eventTarget(), location: { hash }, matchMedia: () => motion };
  runInNewContext(read('home-intro.js'), { document, window, setTimeout: (fn, ms) => { const key = ++id; timers.set(key, { fn, ms }); return key; }, clearTimeout: key => timers.delete(key) });
  const fireTimer = ms => {
    const [key, task] = [...timers].find(([, task]) => task.ms === ms) || [];
    assert.ok(task, `Expected ${ms}ms timer`); timers.delete(key); task.fn();
  };
  const ready = () => document.events.get('DOMContentLoaded')?.();
  const listeners = () => document.events.size + window.events.size + motion.events.size + skip.events.size;
  const assertFinished = () => {
    assert.equal(cover.hidden, true); assert.equal(classes.size, 0); assert.equal(timers.size, 0); assert.equal(listeners(), 0);
    assert.deepEqual(regions.map(region => region.inert), [false, false, true]);
  };
  return { classes, timers, cover, skip, regions, motion, document, window, ready, fireTimer, assertFinished, focusCalls: () => focusCalls };
};

test('intro is an optional finite vignette with the real logo and three sharing chapters', () => {
  const html = read('index.html'), css = read('home-intro.css'), js = read('home-intro.js');
  assert.match(html, /id="histi-intro" aria-label="HISTI introduction" hidden/);
  assert.match(html, /class="intro-logo" src="\/histi-logo\.webp/);
  assert.equal((html.match(/class="intro-chapter /g) || []).length, 3);
  assert.equal((html.match(/class="intro-curtain /g) || []).length, 2);
  assert.match(html, /Skip animation/);
  assert.doesNotMatch(html, /Enter HISTI|Loading HISTI|role="progressbar"/);
  assert.match(css, /intro-black-fade 500ms/);
  assert.match(css, /intro-chapter-sharing 2000ms 500ms/);
  assert.match(css, /intro-chapter-people 2000ms 500ms/);
  assert.match(css, /intro-chapter-boundaries 2000ms 500ms/);
  assert.match(css, /intro-open-left 850ms/);
  assert.match(css, /intro-open-right 850ms 60ms/);
  assert.match(css, /intro-failsafe 0s 4500ms/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.doesNotMatch(css, /infinite|will-change|filter:|backdrop-filter/);
  assert.doesNotMatch(js, /requestAnimationFrame|setInterval|MutationObserver|createElement|innerHTML|sessionStorage|localStorage|fetch\(/);
  for (const page of ['checkin-page.html', 'checkin-4.html', 'checkin-4-g1.html', 'checkin-4-g2.html', 'checkin-4-g3.html', 'checkin-4-g4.html']) assert.doesNotMatch(read(page), /home-intro/);
});

test('0.5s fade plus 2s story precedes the split reveal and synchronized page entrance', () => {
  const f = fixture(); assert.equal(f.classes.has('histi-intro-pending'), true); f.ready();
  assert.equal(f.cover.hidden, false); assert.equal(f.classes.has('histi-intro-active'), true);
  assert.equal(f.classes.has('histi-home-arriving'), false);
  assert.deepEqual(f.regions.map(region => region.inert), [true, true, true]);
  assert.deepEqual([...f.timers.values()].map(timer => timer.ms).sort((a, b) => a - b), [2500, 4200]);
  f.fireTimer(2500);
  assert.equal(f.classes.has('histi-intro-revealing'), true); assert.equal(f.classes.has('histi-home-arriving'), true);
  assert.deepEqual(f.regions.map(region => region.inert), [false, false, true]);
  f.fireTimer(950); assert.equal(f.cover.hidden, true); assert.equal(f.classes.has('histi-home-arriving'), true);
  f.fireTimer(1500); f.assertFinished();
});

test('Skip and Escape release every timer and temporary inert region immediately', () => {
  for (const action of ['skip', 'escape']) {
    const f = fixture(); f.ready(); f.document.activeElement = f.skip;
    if (action === 'skip') f.skip.events.get('click')();
    else f.document.events.get('keydown')({ key: 'Escape' });
    f.assertFinished(); assert.equal(f.focusCalls(), 1);
  }
});

test('deep links, reduced motion, background visits and other pages bypass the cover', () => {
  for (const options of [{ hash: '#about' }, { reduced: true }, { hidden: true }, { home: false }]) fixture(options).assertFinished();
});

test('missing markup and initialization timeout fail open without trapping the homepage', () => {
  const missing = fixture({ missing: true }); missing.ready(); missing.assertFinished();
  const stalled = fixture(); stalled.fireTimer(4500); stalled.ready(); stalled.assertFinished();
  const started = fixture(); started.ready(); started.fireTimer(4200); started.assertFinished();
});

test('hidden tab, preference change, navigation, bfcache and deep-link interruptions clean up', () => {
  for (const interrupt of ['hidden', 'reduced', 'pagehide', 'persisted', 'hash']) {
    for (const phase of ['pending', 'story', 'reveal']) {
      const f = fixture();
      if (phase !== 'pending') f.ready();
      if (phase === 'reveal') f.fireTimer(2500);
      if (interrupt === 'hidden') { f.document.hidden = true; f.document.events.get('visibilitychange')(); }
      if (interrupt === 'reduced') { f.motion.matches = true; f.motion.events.get('change')(); }
      if (interrupt === 'pagehide') f.window.events.get('pagehide')();
      if (interrupt === 'persisted') f.window.events.get('pageshow')({ persisted: true });
      if (interrupt === 'hash') f.window.events.get('hashchange')();
      f.ready(); f.assertFinished();
    }
  }
});

test('100 independent entries stay bounded and automatic reveals do not steal focus', () => {
  for (let i = 0; i < 100; i++) {
    const f = fixture(); f.ready(); assert.equal(f.timers.size, 2);
    f.fireTimer(2500); assert.equal(f.timers.size, 3);
    f.fireTimer(950); f.fireTimer(1500); f.assertFinished(); assert.equal(f.focusCalls(), 0);
  }
});
