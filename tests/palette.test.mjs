import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../site-experience.css', import.meta.url), 'utf8');
const tokens = Object.fromEntries([...css.matchAll(/--palette-([\w-]+): (#[\da-f]{6});/g)].map(match => [match[1], match[2]]));
const luminance = hex => {
  const rgb = hex.slice(1).match(/../g).map(part => parseInt(part, 16) / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
  return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
};
const contrast = (a, b) => (Math.max(luminance(a), luminance(b)) + .05) / (Math.min(luminance(a), luminance(b)) + .05);

test('paper and pigment text pairs meet normal-text contrast', () => {
  for (const surface of ['paper', 'card', 'sun', 'sun-soft', 'apricot', 'apricot-soft', 'blue', 'blue-soft', 'iris', 'iris-soft', 'rose', 'rose-soft']) {
    for (const ink of ['ink', 'muted']) assert.ok(contrast(tokens[ink], tokens[surface]) >= 4.5, `${ink} on ${surface}`);
  }
  for (const family of ['sun', 'apricot', 'blue', 'iris', 'rose']) {
    for (const surface of [family, `${family}-soft`]) assert.ok(contrast(tokens[`${family}-ink`], tokens[surface]) >= 4.5, `${family}-ink on ${surface}`);
  }
});

test('color roles span landing sections, assessment headers, and results', () => {
  for (const family of ['sun', 'apricot', 'blue', 'iris', 'rose']) assert.ok(tokens[family] && tokens[`${family}-ink`]);
  assert.match(css, /\.home-about \{ background:#e0e5ff/);
  assert.match(css, /\.home-privacy \{ background:#d9f0fd/);
  assert.match(css, /\.home-final \{ background:#ffe18a/);
  for (const category of ['A2', 'B', 'C', 'D']) assert.ok(css.includes(`.assessment-card[data-category="${category}"]`));
  assert.match(css, /\.category-card:nth-child\(5\)/);
  assert.doesNotMatch(css, /#272438|#655f73|#ded6e8|#f6f1fb/);
});

test('blue controls keep dark text readable in default and hover states', () => {
  const controls = Object.fromEntries([...css.matchAll(/--control-([\w-]+): (#[\da-f]{6});/g)].map(match => [match[1], match[2]]));
  for (const surface of ['fill', 'hover', 'soft']) assert.ok(contrast(controls.ink, controls[surface]) >= 4.5, `control text on ${surface}`);
  assert.ok(contrast(controls.border, tokens.card) >= 3, 'control boundary on paper');
  assert.match(css, /--suite-accent: var\(--control-fill\)/);
  assert.match(css, /\.h4-slider-thumb \{ background:var\(--control-fill\)/);
  assert.match(css, /\.h4-slider-fill \{ background:var\(--control-soft\)/);
  assert.match(css, /\.sample-level \.sample-selected \{ background:var\(--control-fill\)/);
  assert.match(css, /\.histi-header \.histi-start,\.home-button-primary \{ background:var\(--control-fill\)/);
  assert.match(readFileSync(new URL('../site-motion.css', import.meta.url), 'utf8'), /\.suite-reset-actions \.primary \{ background: var\(--control-fill\)/);
  assert.doesNotMatch(css, /\.h4-slider-thumb \{ background:var\(--palette-sun\)/);
});

test('start cards override old pale text and dark hover colors', () => {
  assert.match(css, /\.start-rights-grid,\.start-rights-grid span,\.rights-card li,\.rights-card strong,\.boundary-rights ul\) \{ color:var\(--palette-ink\)!important/);
  assert.match(css, /\.h4-switch a:hover \{ background:var\(--control-soft\)/);
  assert.match(css, /\.home-format\.full-format,\.app-card\.available\.full \{ background:var\(--control-soft\)/);
  assert.match(css, /\.start-rights-card,\.rights-card\) \{ background:var\(--palette-blue-soft\)!important/);
  assert.match(css, /\.start-rights-grid span::before \{ color:var\(--palette-blue-ink\)!important/);
});

test('decorative pigments remain exactly three bounded transform layers', () => {
  const motion = readFileSync(new URL('../site-color-motion.css', import.meta.url), 'utf8');
  assert.match(motion, /background:var\(--spot-color,#ffb98455\)/);
  assert.match(motion, /background:var\(--spot-color,#a1dafa55\)/);
  assert.match(motion, /background:var\(--spot-color,#aab6f955\)/);
  assert.doesNotMatch(motion, /radial-gradient|filter:|backdrop-filter:|will-change:|mix-blend-mode:/);
  assert.match(motion, /contain:layout paint/);
  assert.match(motion, /@supports\(animation-timeline:scroll\(root block\)\)/);
  assert.match(motion, /animation-timeline:auto,scroll\(root block\)/);
  assert.match(motion, /@keyframes suite-scroll-spots \{ from \{ translate:0px 0px/);
  const motionScript = readFileSync(new URL('../site-color-motion.js', import.meta.url), 'utf8');
  assert.doesNotMatch(motionScript, /requestAnimationFrame|addEventListener\(['"]scroll|setInterval/);
});

test('score reveal is a finite native animation with reduced-motion opt-out', () => {
  assert.match(css, /#results-screen:not\(\[hidden\]\) \.result-score-line \{ animation:histi-score-reveal 850ms 500ms/);
  assert.match(css, /@keyframes histi-score-reveal \{ 0% \{ opacity:0; transform:translateY/);
  assert.match(css, /\.category-card:nth-child\(5\) \{ animation-delay:1070ms/);
  assert.match(css, /body\.reduce-motion #results-screen[^\n]+animation:none!important/);
  assert.match(css, /@media\(prefers-reduced-motion:reduce\) \{ #results-screen[^\n]+animation:none!important/);
  assert.doesNotMatch(css, /infinite|filter:blur|will-change/);
});
