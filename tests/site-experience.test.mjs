import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const read = file => readFileSync(new URL(file, root), 'utf8');

test('every page has one static safety notice and the shared visual system', () => {
  const pages = readdirSync(root).filter(file => file.endsWith('.html'));
  assert.equal(pages.length, 12);
  for (const file of pages) {
    const html = read(file);
    assert.equal((html.match(/class="histi-safety-notice"/g) || []).length, 1, file);
    assert.match(html, /Never enter passwords, codes, or personal information\./, file);
    const sharedStyle = html.indexOf('/site-experience.css?v=');
    assert.ok(sharedStyle > 0 && sharedStyle < html.indexOf('/site-typography.css'), file);
    assert.match(html, /page-transitions\.js\?v=suite-[12]/, file);
    assert.match(html, /class="site-header topbar histi-header"/, file);
  }
});

test('the pinned notice reserves space and small screens can scroll', () => {
  const css = read('site-experience.css');
  assert.match(css, /\.histi-safety-notice \{ display:none; position:fixed/);
  assert.match(css, /--suite-chrome-top: calc\(var\(--site-header-height,76px\) \+ var\(--safety-notice-height\)/);
  assert.match(css, /padding-top:var\(--suite-chrome-top\)!important/);
  assert.match(css, /overflow-y:auto!important/);
  assert.match(css, /--safety-notice-size:90px/);
  assert.match(css, /--safety-notice-size:104px/);
});

test('the notice and its reserved space activate only for visible B/C/D cards', () => {
  const css = read('site-experience.css');
  const activeSelector = 'html:has(#assessment-screen:not([hidden]) .assessment-card:is([data-category="B"],[data-category="C"],[data-category="D"]))';
  assert.ok(css.includes(`${activeSelector} { --safety-notice-height:var(--safety-notice-size); }`));
  assert.ok(css.includes(`${activeSelector} .histi-safety-notice { display:block; }`));
  assert.match(css, /--safety-notice-height: 0px/);
  assert.match(read('app-histi4.js'), /dataset\.category = slide\.category/);
  for (const app of ['app-histi120.js', 'app-public-sans.js']) {
    assert.match(read(app), /card\.dataset\.category = q\.category/);
  }
  assert.match(read('app-histi-v3.js'), /dataset\.category=q\.number>=236\?'D'/);
});

test('page entrance is finite and respects reduced motion', () => {
  const js = read('page-transitions.js');
  assert.match(js, /entryTimer = setTimeout\(clearEntry, 900\)/);
  assert.match(js, /pagehide[^\n]+clearEntry/);
  assert.match(js, /if \(motion\.matches\) return/);
  assert.doesNotMatch(js, /setInterval|MutationObserver/);
  const css = read('site-experience.css');
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)/);
  assert.doesNotMatch(css, /infinite|will-change/);
});

test('group selector fades once without restarting or moving the cards', () => {
  const html = read('checkin-4.html');
  const css = read('site-experience.css');
  assert.match(html, /<body class="histi-group-selector"[^>]*>/);
  assert.match(html, /site-experience\.css\?v=group-entry-1/);
  for (const font of ['idiqlat/regular', 'tiro-gurmukhi/regular', 'instrument-sans/variable']) {
    assert.ok(html.includes(`rel="preload" href="/fonts/${font}.woff2" as="font" type="font/woff2" crossorigin`));
  }
  assert.match(css, /body\.histi-group-selector :is\(\.start-card,\.h4-choice\) \{ animation:none; \}/);
  assert.match(css, /@media\(prefers-reduced-motion:no-preference\) \{\s+html\.histi-page-enter body\.histi-group-selector \.start-card \{ animation:suite-selector-enter 720ms var\(--suite-ease\) backwards!important; \}/);
  const fade = css.match(/@keyframes suite-selector-enter \{([^\n]+)\}/)?.[1];
  assert.match(fade, /opacity:0/);
  assert.match(fade, /opacity:1/);
  assert.doesNotMatch(fade, /transform|height|margin|padding/);
});

test('existing reflection questions remain on all Full recipient pages', () => {
  for (const group of ['g1', 'g2', 'g3', 'g4']) {
    const html = read(`checkin-4-${group}.html`);
    assert.match(html, /<span>245 questions<\/span>/);
    assert.match(html, /id="question-list"/);
    assert.match(html, /app-histi4\.js\?v=motion-1/);
    assert.match(html, /suite-privacy-reminder/);
  }
  assert.match(read('site-experience.css'), /body\.histi-120 \{ --suite-accent:var\(--palette-blue\)/);
});

test('optional recipient labels discourage actual identifying information', () => {
  for (const file of ['checkin.html', 'checkin-120.html']) {
    assert.match(read(file), /e\.g\. my friend \(no real names\)/);
    assert.match(read(file), /aria-describedby="recipient-label-privacy"/);
    assert.match(read(file), /Use an anonymous label only/);
  }
  assert.match(read('histi4-privacy.js'), /Don’t share the actual information here/);
});
