import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = file => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
const fullPages = [1,2,3,4].map(group => `checkin-4-g${group}.html`);

test('visitors get a plain introduction and native, accessible FAQs', () => {
  const home = read('index.html');
  assert.match(home, /HISTI is a private check-in about what you feel comfortable sharing/);
  assert.match(home, /No private details to type/);
  assert.equal((home.match(/<details>/g) || []).length, 6);
  for (const question of ['How long does it take?', 'Can I take a break?', 'Do I have to answer everything?', 'What does my score mean?', 'Will anyone see my answers?', 'Who is this check-in for?']) assert.ok(home.includes(question));
  assert.match(home, /Progress isn’t synced to another device/);
  assert.match(home, /ordinary file requests to its host/);
  assert.match(home, /access to your unlocked device/);
  assert.match(home, /An incomplete result may change/);
});

test('getting started makes the available format and optional other relationships clear', () => {
  const formats = read('checkin-page.html');
  assert.match(formats, /<ol class="visitor-path" aria-label="Getting started">/);
  assert.match(formats, /aria-current="step"/);
  assert.match(formats, /Available now · Ages 13\+/);
  assert.match(formats, /55–70 minutes per person · 245 questions/);
  assert.doesNotMatch(formats, /href="\/checkin-120/);
  assert.equal((formats.match(/aria-disabled="true"/g) || []).length, 5);
  assert.match(read('checkin-4.html'), /No names needed/);
  for (const page of fullPages) {
    const html = read(page);
    const intro = html.match(/<main id="intro-screen"[\s\S]*?<\/main>/)[0];
    assert.match(intro, /Before you begin/);
    assert.match(intro, /Take breaks; return in this same browser/);
    assert.match(intro, /<strong>55–70 minutes<\/strong>/);
    for (const id of ['intro-recipient','intro-description','slide-count','start-btn','intro-group-links']) assert.ok(intro.includes(`id="${id}"`));
    assert.doesNotMatch(intro, /10–12 level questions|Full assessment/);
    assert.match(html, /A SNAPSHOT, NOT A LABEL/);
    assert.match(html, /The score is not fully accurate to true privacy and openness values\./);
  }
});

test('policy shortcuts point to real sections and back to the current check-in library', () => {
  for (const page of ['privacy.html','terms.html']) {
    const html = read(page);
    const nav = html.match(/<nav class="visitor-policy-nav"[\s\S]*?<\/nav>/)[0];
    const links = [...nav.matchAll(/href="#([^"]+)"/g)];
    assert.equal(links.length, page === 'terms.html' ? 6 : 5);
    for (const [,id] of links) assert.ok(html.includes(`<section id="${id}" class="policy-section">`));
    assert.match(html, /Effective October 2, 2026/);
    assert.doesNotMatch(html, /href="\/checkin"/);
  }
});

test('visitor styling is lightweight, intro-scoped, and keeps the font hierarchy last', () => {
  const css = read('visitor-guide.css');
  assert.doesNotMatch(css, /@keyframes|animation:|will-change|filter:|position:fixed|assessment-screen|h4-question|quiz-nav/);
  assert.match(css, /#intro-screen \.start-rights-grid/);
  assert.match(css, /scroll-margin-top:110px/);
  for (const page of ['index.html','checkin-page.html','checkin-4.html',...fullPages,'privacy.html','terms.html']) {
    const html = read(page);
    assert.ok(html.indexOf('/visitor-guide.css?v=welcome-1') < html.indexOf('/site-typography.css'));
    assert.match(html, /visitor-guide\.css\?v=welcome-1/);
  }
});
