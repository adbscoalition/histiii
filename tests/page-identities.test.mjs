import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = file => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
const pages = {'index.html':'home','checkin-page.html':'formats','checkin-4.html':'people','checkin-4-g1.html':'checkin','checkin-4-g2.html':'checkin','checkin-4-g3.html':'checkin','checkin-4-g4.html':'checkin','checkin.html':'checkin','checkin-v3.html':'checkin','checkin-120.html':'checkin','privacy.html':'privacy','terms.html':'terms'};

test('every page has an explicit identity and still uses only three decorative spots', () => {
  for (const [file,identity] of Object.entries(pages)) {
    const html = read(file);
    assert.match(html, new RegExp(`<body[^>]+data-page="${identity}"`), file);
    assert.match(html, /site-color-motion\.css\?v=pages-1/, file);
    assert.match(html, /page-identities\.css\?v=pages-1/, file);
    assert.equal((html.match(/class="suite-color-field"/g)||[]).length, 1, file);
    assert.match(html, /class="suite-color-field" aria-hidden="true"><span><\/span><span><\/span><span><\/span><\/div>/, file);
    assert.ok(html.indexOf('/page-identities.css') < html.indexOf('/site-typography.css'), file);
  }
  for (let group=1;group<=4;group++) assert.match(read(`checkin-4-g${group}.html`), new RegExp(`data-recipient="G${group}"`));
});

test('page motifs and recipient cues are distinct without adding animation loops', () => {
  const css = read('page-identities.css');
  for (const identity of ['home','formats','people','checkin','privacy','terms']) {
    for (let spot=1;spot<=3;spot++) assert.ok(css.includes(`body[data-page="${identity}"] .suite-color-field span:nth-child(${spot})`));
  }
  for (const group of ['G2','G3','G4']) assert.ok(css.includes(`[data-recipient="${group}"]`));
  assert.match(css, /people"\] \.h4-choice:nth-child\(3\)[^\n]+--recipient-color:var\(--palette-rose\)/);
  assert.match(css, /:has\(#results-screen:not\(\[hidden\]\)\)/);
  assert.match(css, /:has\(#assessment-screen:not\(\[hidden\]\)\)[^\n]+--spot-opacity:\.55/);
  assert.match(css, /html:not\(\.suite-motion-paused\)[^\n]+animation-play-state:paused,running/);
  assert.doesNotMatch(css, /@keyframes|animation:|backdrop-filter:|will-change:|mix-blend-mode:|content:[^;]+http/);
  const logoRule = 'body[data-page] .histi-brand .brand-logo { filter:brightness(.18)!important; }';
  assert.ok(css.includes(logoRule));
  assert.doesNotMatch(css.replace(logoRule,''), /filter:/, 'decorative spots have no filters');
  assert.match(css, /body\[data-page="checkin"\]\[data-recipient\] \.h4-question-context \{ color:var\(--page-cue\)!important/);
  const motion = read('site-color-motion.css');
  assert.match(motion, /width:min\(var\(--spot-width,var\(--spot-size,145px\)\),145px\)/);
  assert.match(motion, /html\.suite-motion-paused[^\n]+animation-play-state:paused/);
  assert.match(motion, /prefers-reduced-motion:reduce[^\n]+animation:none/);
  assert.doesNotMatch(read('site-color-motion.js'), /requestAnimationFrame|setInterval|setTimeout|createElement|addEventListener\(['"]scroll/);
});
