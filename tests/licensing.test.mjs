import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = file => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
const license = 'https://creativecommons.org/licenses/by-nd/4.0/';

test('public notices explicitly separate the reserved website from the licensed test', () => {
  for (const page of ['index.html', 'checkin-page.html', 'terms.html', 'privacy.html']) {
    const html = read(page);
    const footer = html.match(/<footer[\s\S]*?<\/footer>/)[0];
    assert.match(footer, /Website · All rights reserved\./);
    assert.ok(footer.includes(`HISTI test · <a href="${license}" rel="license">CC BY-ND 4.0</a>`));
    assert.ok(html.indexOf('/site-licensing.css') < html.indexOf('/site-typography.css'));
  }
});

test('terms and repository license preserve CC permissions and third-party exceptions', () => {
  const terms = read('terms.html'), repository = read('LICENSE.md');
  assert.match(terms, /id="licensing" class="policy-section"/);
  assert.match(terms, /href="#licensing">Website &amp; test licensing/);
  assert.match(terms, /including for commercial purposes/);
  assert.match(repository, /including commercially/);
  for (const text of [terms, repository]) {
    assert.match(text, /appropriate attribution/);
    assert.match(text, /question wording, response options/);
    assert.match(text, /scoring rubrics/);
    assert.match(text, /copyright exceptions and limitations/);
    assert.ok(text.includes(`${license}legalcode.en`));
    assert.match(text, /without\s+warranties/);
    assert.doesNotMatch(text, /non-commercial only|CC BY-NC|must pay|all source code is CC/i);
  }
  assert.match(terms, /do not add restrictions/);
  assert.match(repository, /does not limit the permissions/);
  assert.match(repository, /SIL Open Font License/);
  assert.match(terms, /not to the website or the software/);
});

test('license notices are static and do not add chrome to the question pages', () => {
  const css = read('site-licensing.css');
  assert.doesNotMatch(css, /animation\s*:|position:fixed|filter:|will-change/);
  for (const page of ['checkin-4-g1.html', 'checkin-4-g2.html', 'checkin-4-g3.html', 'checkin-4-g4.html']) {
    assert.match(read(page), /href="\/terms">Terms/);
    assert.doesNotMatch(read(page), /site-licensing|site-license-notice/);
  }
});
