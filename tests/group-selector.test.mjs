import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = file => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');

test('the facelift keeps all four recipient links and existing privacy controls', () => {
  const html = read('checkin-4.html');
  assert.match(html, /group-selector\.css\?v=facelift-3/);
  assert.match(html, /40–50 minutes per person/);
  assert.equal((html.match(/class="h4-choice"/g) || []).length, 4);
  for (let group=1; group<=4; group++) assert.match(html, new RegExp(`href="/checkin-4-g${group}"`));
  assert.match(html, /id="privacy-live-btn"/);
  assert.match(html, /Your choices and progress stay in this browser/);
  assert.match(html, /The score is not fully accurate to true privacy and openness values\./);
  assert.equal((html.match(/class="group-choice-icon" aria-hidden="true"/g) || []).length, 4);
  assert.doesNotMatch(html, /group-choice-number/);
  assert.doesNotMatch(html, /01 · G1|02 · G2|03 · G3|04 · G4/);
});

test('all versions have matching recipient cards and a themed welcome without changing questions',()=>{
  const icons=['stranger','acquaintance','friends','partner'];
  for(const variant of ['4','120','60']) {
    const selector=read(`checkin-${variant}.html`);
    assert.match(selector,/group-selector\.css\?v=facelift-3/);
    assert.equal((selector.match(/class="h4-choice"/g)||[]).length,4);
    assert.doesNotMatch(selector,/group-choice-number/);
    for(let group=1;group<=4;group++) {
      const html=read(`checkin-${variant}-g${group}.html`);
      assert.match(html,/checkin-welcome\.css\?v=1/);
      assert.match(html,/<div class="intro-heading">/);
      assert.match(html,new RegExp(`visitor-icons\\.svg#${icons[group-1]}`));
      for(const id of ['intro-title','intro-recipient','intro-description','slide-count','start-btn','question-list','results-screen']) assert.match(html,new RegExp(`id="${id}"`));
      assert.match(html,/No names, passwords, codes, or real private details/);
      assert.match(html,/The score is not fully accurate to true privacy and openness values\./);
    }
  }
  const css=read('checkin-welcome.css');
  assert.doesNotMatch(css,/assessment-screen|results-screen|@keyframes|will-change|backdrop-filter|animation:/);
  assert.match(css,/grid-template-columns:minmax\(0,1fr\) 130px/);
  assert.match(css,/max-width:680px/);
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
  for (const name of ['HISTI-Detailed', 'HISTI-Detailed B', 'HISTI-Detailed 120']) {
    const card = cards.find(content => content.includes(`<h3 class="card-name">${name}</h3>`));
    assert.ok(card, `${name} has a disabled upcoming card`);
    assert.ok(card.includes('<span class="status">Coming soon</span>'));
    assert.doesNotMatch(card, /card-number/);
    assert.doesNotMatch(card, /<a\b|<button\b|card-time|Start with/);
    assert.ok(read('index.html').includes(name));
  }
  assert.equal((html.match(/class="app-card available /g) || []).length, 3);
  assert.match(read('styles-checkin-page.css'), /grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
});
