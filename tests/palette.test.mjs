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

test('decorative pigments remain exactly three bounded transform layers', () => {
  const motion = readFileSync(new URL('../site-color-motion.css', import.meta.url), 'utf8');
  assert.match(motion, /background:#ffb98455/);
  assert.match(motion, /background:#a1dafa55/);
  assert.match(motion, /background:#aab6f955/);
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
  assert.match(css, /@keyframes histi-score-reveal \{ from \{ opacity:0; transform:translateY/);
  assert.match(css, /\.category-card:nth-child\(5\) \{ animation-delay:1070ms/);
  assert.match(css, /body\.reduce-motion #results-screen[^\n]+animation:none!important/);
  assert.match(css, /@media\(prefers-reduced-motion:reduce\) \{ #results-screen[^\n]+animation:none!important/);
  assert.doesNotMatch(css, /infinite|filter:blur|will-change/);
});
