import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = file => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');

test('the facelift keeps all four recipient links and existing privacy controls', () => {
  const html = read('checkin-4.html');
  assert.match(html, /group-selector\.css\?v=facelift-2/);
  assert.match(html, /40–50 minutes per person/);
  assert.equal((html.match(/class="h4-choice"/g) || []).length, 4);
  for (let group=1; group<=4; group++) assert.match(html, new RegExp(`href="/checkin-4-g${group}"`));
  assert.match(html, /id="privacy-live-btn"/);
  assert.match(html, /Your choices and progress stay in this browser/);
  assert.match(html, /The score is not fully accurate to true privacy and openness values\./);
  assert.equal((html.match(/class="group-choice-icon" aria-hidden="true"/g) || []).length, 4);
  assert.doesNotMatch(html, /01 · G1|02 · G2|03 · G3|04 · G4/);
});

test('selector styles are scoped, responsive, and preserve the stationary entrance', () => {
  const css = read('group-selector.css');
  assert.doesNotMatch(css, /animation:|@keyframes|will-change|backdrop-filter|position:fixed/);
  assert.match(css, /histi-group-selector \.h4-choice:focus-visible/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(css, /max-width:680px/);
  assert.match(css, /histi-group-selector \.start-card \{\s+padding:0!important/);
  assert.match(read('site-experience.css'), /body\.histi-group-selector :is\(\.start-card,\.h4-choice\) \{ animation:none; \}/);
  assert.match(read('site-experience.css'), /@keyframes suite-selector-enter \{ from \{ opacity:0; \} to \{ opacity:1; \} \}/);
});

test('the detailed variants are upcoming cards, not links or active tests', () => {
  const html = read('checkin-page.html');
  const cards = [...html.matchAll(/<article class="app-card soon[^\"]*" aria-disabled="true">([\s\S]*?)<\/article>/g)].map(match => match[1]);
  for (const [index, name] of ['HISTI-Detailed', 'HISTI-Detailed B', 'HISTI-Detailed 120'].entries()) {
    const card = cards.find(content => content.includes(`<span class="card-name">${name}</span>`));
    assert.ok(card, `${name} has a disabled upcoming card`);
    assert.ok(card.includes('<span class="status">Coming soon</span>'));
    assert.ok(card.includes(`<span class="card-number">${String(index + 9).padStart(2, '0')}</span>`));
    assert.doesNotMatch(card, /<a\b|<button\b|card-time|Start with/);
    assert.ok(read('index.html').includes(name));
  }
  assert.equal((html.match(/class="app-card available /g) || []).length, 3);
  assert.match(read('styles-checkin-page.css'), /grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
});
