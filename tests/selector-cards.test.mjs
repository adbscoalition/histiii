import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = file => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
test('the selector leads with four ready tests, then pace guidance, then seven non-interactive upcoming cards',()=>{
  const html=read('checkin-page.html');
  assert.ok(html.indexOf('id="checkin-options"')<html.indexOf('data-pace-guide'));
  assert.ok(html.indexOf('data-pace-guide')<html.indexOf('id="upcoming-checkins-title"'));
  assert.equal((html.match(/class="app-card available /g)||[]).length,4);
  assert.equal((html.match(/<h3 class="card-name">/g)||[]).length,11);
  const future=[...html.matchAll(/<article class="app-card soon[^\"]*" aria-disabled="true">([\s\S]*?)<\/article>/g)];
  assert.equal(future.length,7);future.forEach(([,card])=>assert.doesNotMatch(card,/<a\b|<button\b|card-action|card-number/));
  assert.deepEqual(future.slice(0,3).map(([,card])=>card.match(/<h3 class="card-name">([^<]+)<\/h3>/)[1]),['HISTI-Detailed','HISTI-Detailed B','HISTI-Detailed 120']);
  for(const [route,time,count] of [['4','40–50',245],['120','20–25',120],['60','10–15',60]]) {assert.ok(html.includes(`href="/checkin-${route}"`));assert.ok(html.includes(`${time} minutes per person · ${count} questions`));}
});
test('the card redesign is selector-only, accessible, responsive, and uses existing self-hosted vectors',()=>{
  const html=read('checkin-page.html'),css=read('selector-cards.css'),svg=read('visitor-icons.svg');
  assert.match(html,/selector-cards\.css\?v=1/);assert.doesNotMatch(read('index.html'),/selector-cards/);
  assert.match(css,/grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);assert.match(css,/max-width:960px/);assert.match(css,/max-width:620px/);
  assert.match(css,/available:focus-visible/);assert.match(css,/prefers-reduced-motion:reduce/);
  assert.doesNotMatch(css,/infinite|filter:|will-change|@keyframes|h4-question|assessment-screen/);
  for(const [,icon] of html.matchAll(/visitor-icons\.svg#([a-z]+)/g)) assert.ok(svg.includes(`id="${icon}"`));
  assert.equal((html.match(/class="selector-card-art" aria-hidden="true"/g)||[]).length,4);
  assert.ok(html.indexOf('/selector-cards.css')<html.indexOf('/site-typography.css'));
});
