import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const root = new URL('../', import.meta.url);
const read = file => readFileSync(new URL(file, root), 'utf8');

test('every page uses the bright suite with exactly three decorative accents', () => {
  for (const file of readdirSync(root).filter(name => name.endsWith('.html'))) {
    const html = read(file);
    assert.match(html, /theme-color" content="#fffaf5"/, file);
    assert.equal((html.match(/class="suite-color-field"/g) || []).length, 1, file);
    assert.match(html, /class="suite-color-field" aria-hidden="true"><span><\/span><span><\/span><span><\/span><\/div>/, file);
    assert.match(html, /site-color-motion\.js\?v=bright-1" defer/, file);
  }
  assert.match(read('site-experience.css'), /color-scheme: light/);
  assert.match(read('site-experience.css'), /--suite-bg: #fffaf5/);
  assert.match(read('site-experience.css'), /\.card-name \{[^}]+color:var\(--suite-ink\)/);
});

test('drifting accents animate only transforms, without filters or JavaScript loops', () => {
  const css = read('site-color-motion.css');
  assert.match(css, /pointer-events:none/);
  assert.match(css, /@keyframes suite-color-drift \{ from \{ transform:[^}]+\} to \{ transform:[^}]+\} \}/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(css, /animation-play-state:paused/);
  assert.doesNotMatch(css, /filter:|backdrop-filter:|will-change:|mix-blend-mode:/);
  assert.doesNotMatch(read('site-color-motion.js'), /requestAnimationFrame|setInterval|setTimeout|createElement|append|MutationObserver|canvas|fetch/);
});

test('motion pauses on hidden tabs and page exit, and resumes on return', () => {
  const classes = new Set();
  const documentEvents = {}, windowEvents = {};
  const document = {
    hidden:false,
    documentElement:{ classList:{
      add:name => classes.add(name),
      toggle:(name, present) => present ? classes.add(name) : classes.delete(name)
    } },
    addEventListener:(name, handler) => documentEvents[name] = handler
  };
  runInNewContext(read('site-color-motion.js'), {document, window:{addEventListener:(name,handler) => windowEvents[name] = handler}});
  assert.equal(classes.has('suite-motion-paused'), false);
  document.hidden = true; documentEvents.visibilitychange();
  assert.equal(classes.has('suite-motion-paused'), true);
  document.hidden = false; documentEvents.visibilitychange();
  assert.equal(classes.has('suite-motion-paused'), false);
  windowEvents.pagehide(); assert.equal(classes.has('suite-motion-paused'), true);
  windowEvents.pageshow(); assert.equal(classes.has('suite-motion-paused'), false);
});

test('HISTI-120 is paused reversibly, including direct and HTML links', () => {
  const config = JSON.parse(read('vercel.json'));
  for (const source of ['/checkin-120','/checkin-120.html','/checkin-120/:path*']) {
    assert.deepEqual(config.redirects.find(rule => rule.source === source), {source, destination:'/checkin-page', permanent:false});
  }
  for (const file of ['index.html','checkin-page.html']) {
    assert.doesNotMatch(read(file), /href="\/checkin-120/);
    assert.match(read(file), /is-paused" aria-disabled="true"/);
    assert.match(read(file), /temporarily (unavailable|paused)/i);
  }
  assert.match(read('checkin-120.html'), /app-histi120\.js/);
  assert.match(read('questions-histi120.js'), /questions/);
});
