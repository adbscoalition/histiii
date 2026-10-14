import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { REFERENCE_SCORES, referenceScore, compareReference } from '../histi4-results.js';
import { calculate, displayScore } from '../histi4-core.js';
import { FAMILIES, CATEGORY_META } from '../histi4-data.js';

const read = file => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
const expected = {
  G1: ['O30', 'N0', 'P40', 'P90', 'P90'],
  G2: ['O50', 'O20', 'N0', 'P20', 'P70'],
  G3: ['O60', 'O35', 'O50', 'O50', 'P70'],
  G4: ['O70', 'O60', 'O75', 'O50', 'N0']
};

test('all twenty supplied reference values use the existing signed spectrum', () => {
  for (const format of ['full', '120', '60']) {
    for (const [group, labels] of Object.entries(expected)) {
      Object.keys(CATEGORY_META).forEach((key, index) => {
        const value = referenceScore(format, group, key);
        assert.equal(displayScore(value), labels[index]);
        assert.ok((value + 100) / 2 >= 0 && (value + 100) / 2 <= 100);
      });
    }
  }
  assert.equal((referenceScore('full', 'G1', 'C') + 100) / 2, 5);
  assert.equal((referenceScore('120', 'G4', 'B') + 100) / 2, 87.5);
  assert.equal((referenceScore('60', 'G1', 'A2') + 100) / 2, 50);
  assert.ok(Object.isFrozen(REFERENCE_SCORES));
  for (const scores of Object.values(REFERENCE_SCORES)) assert.ok(Object.isFrozen(scores));
});

test('school, unknown recipients, and unsupported categories have no reference', () => {
  for (const group of Object.keys(expected)) {
    for (const key of Object.keys(CATEGORY_META)) assert.equal(referenceScore('school', group, key), null);
  }
  assert.equal(referenceScore('full', 'G5', 'A1'), null);
  assert.equal(referenceScore('full', 'toString', 'A1'), null);
  assert.equal(referenceScore('full', 'G1', 'overall'), null);
  assert.equal(referenceScore('full', 'G1', 'constructor'), null);
  assert.equal(referenceScore('other', 'G1', 'A1'), null);
});

test('comparisons distinguish direction, equality, and unscored answers', () => {
  assert.equal(compareReference(50, 50), 'Your result lines up with this reference.');
  assert.equal(compareReference(-100, 50), '150 points more private than this reference.');
  assert.equal(compareReference(100, -90), '190 points more open than this reference.');
  assert.equal(compareReference(1, 0), '1 point more open than this reference.');
  assert.equal(compareReference(35.4, 35), '0.4 points more open than this reference.');
  assert.equal(compareReference(null, 0), null);
  assert.equal(compareReference(0, null), null);
  assert.equal(compareReference(NaN, 0), null);
});

test('reference lookups do not alter answers, denominators, weights, or calculated scores', () => {
  const answers = {
    [FAMILIES[0][0]]: {status:'score', value:FAMILIES[0][5][0][0]},
    [FAMILIES[1][0]]: {status:'pna'},
    [FAMILIES[2][0]]: {status:'unknown'},
    [FAMILIES[3][0]]: {status:'na'}
  };
  const before = structuredClone(answers);
  const result = calculate(answers);
  const snapshot = structuredClone(result);
  for (const group of Object.keys(expected)) {
    for (const [key, bucket] of Object.entries(result.categories)) compareReference(bucket.score, referenceScore('full', group, key));
  }
  assert.deepEqual(answers, before);
  assert.deepEqual(result, snapshot);
  assert.deepEqual(calculate(answers), snapshot);
  assert.doesNotMatch(read('histi4-core.js'), /REFERENCE_SCORES|referenceScore|compareReference/);
});

test('result references are accessible, separated from user markers, and never added to school', () => {
  const app = read('app-histi4.js');
  assert.match(app, /referenceScore\(document\.body\.dataset\.test \|\| 'full', group, key\)/);
  assert.match(app, /marker.hidden = bucket.score === null/);
  assert.match(app, /if \(reference !== null\) spectrum.append\(comparison\)/);
  assert.match(app, /if \(!school && !\$\('result-reference-note'\)\)/);
  assert.match(app, /not a verified population average or a target/);
  assert.match(app, /Reference: \$\{displayScore\(reference\)\}/);
  assert.match(app, /category-results'\)\.replaceChildren\(fragment\)/);
  const css = read('histi4-results.css');
  assert.match(css, /\.category-reference-marker \{ left:var\(--reference-position\); top:16px/);
  assert.match(css, /\.category-user-marker \{ z-index:1/);
  assert.match(css, /\.result-comparison \{ display:flex; flex-wrap:wrap/);
  assert.doesNotMatch(css, /infinite|will-change|filter:|backdrop-filter/);
  for (const variant of ['4','120','60','school-middle','school-high']) {
    for (const group of ['g1','g2','g3','g4']) {
      const html = read(`checkin-${variant}-${group}.html`);
      assert.match(html, /histi4-results\.css\?v=editorial-1/);
      assert.match(html, /app-histi4\.js\?v=school-editions-1/);
    }
  }
});
