import assert from 'node:assert/strict';
import { FAMILIES, CATEGORY_META, RECIPIENTS } from '../histi4-data.js';
import { makeSlides, rubricPoints, calculate, displayScore } from '../histi4-core.js';

assert.equal(FAMILIES.length, 245);
assert.equal(new Set(FAMILIES.map(row => row[0])).size, 245);
assert.deepEqual(Object.keys(RECIPIENTS), ['G1', 'G2', 'G3', 'G4']);
assert.deepEqual(FAMILIES.reduce((counts, row) => (counts[row[3]] = (counts[row[3]] || 0) + 1, counts), {}), { slider: 224, yn: 21 });
for (const [key, meta] of Object.entries(CATEGORY_META)) {
  const rows = FAMILIES.filter(row => row[0].startsWith(`${key}-`));
  assert.equal(rows.reduce((sum, row) => sum + row[4], 0), meta.max, `${key} maximum matches document`);
}
const slides = makeSlides();
assert.equal(new Set(slides.flatMap(slide => slide.questions.map(row => row[0]))).size, 245);
assert.equal(slides.flatMap(slide => slide.questions).length, 245);
assert.ok(slides.every(slide => slide.questions.length <= (slide.type === 'multi' ? 1 : 3)));
assert.ok(slides.every(slide => slide.questions.every(row => row[3] === slide.type && row[0].startsWith(`${slide.category}-`))));

const maximum = Object.fromEntries(FAMILIES.map(row => [row[0], { status: 'score', value: row[3] === 'yn' ? 1 : row[5].at(-1)[0] ?? row[5].length - 1 }]));
const minimum = Object.fromEntries(FAMILIES.map(row => [row[0], { status: 'score', value: 0 }]));
const maxResult = calculate(maximum);
assert.equal(maxResult.score, 100);
assert.equal(displayScore(maxResult.score), 'O100');
assert.equal(calculate(minimum).score, -100);
assert.equal(displayScore(-100), 'P100');
assert.equal(displayScore(0), 'N0');
assert.equal(maxResult.answered, 245);
for (const [key, meta] of Object.entries(CATEGORY_META)) {
  assert.equal(maxResult.categories[key].earned, meta.max);
  assert.equal(maxResult.categories[key].available, meta.max);
  assert.equal(maxResult.categories[key].score, 100);
}
const noScore = calculate({ [FAMILIES[0][0]]: { status: 'pna' }, [FAMILIES[1][0]]: { status: 'unknown' }, [FAMILIES[2][0]]: { status: 'na' } });
assert.equal(noScore.score, null);
assert.equal(noScore.answered, 0);
assert.equal(rubricPoints(FAMILIES[0], 100), FAMILIES[0][4]);
console.log(`PASS: four recipient routes, 245 families, ${slides.length} slides per route, and P100–O100 scoring.`);
