import assert from 'node:assert/strict';
import { FAMILIES, CATEGORY_META, RECIPIENTS } from '../histi4-data.js';
import { makeSlides, makeLegacySlides, remapLegacySlideIndex, rubricPoints, calculate, displayScore } from '../histi4-core.js';

assert.equal(FAMILIES.length, 245);
assert.equal(new Set(FAMILIES.map(row => row[0])).size, 245);
assert.deepEqual(Object.keys(RECIPIENTS), ['G1', 'G2', 'G3', 'G4']);
assert.deepEqual(FAMILIES.reduce((counts, row) => (counts[row[3]] = (counts[row[3]] || 0) + 1, counts), {}), { slider: 224, yn: 21 });
for (const [key, meta] of Object.entries(CATEGORY_META)) {
  const rows = FAMILIES.filter(row => row[0].startsWith(`${key}-`));
  assert.equal(rows.reduce((sum, row) => sum + row[4], 0), meta.max, `${key} maximum matches document`);
}
const slides = makeSlides();
assert.equal(slides.length, 29);
assert.equal(new Set(slides.flatMap(slide => slide.questions.map(row => row[0]))).size, 245);
assert.equal(slides.flatMap(slide => slide.questions).length, 245);
assert.ok(slides.every(slide => slide.questions.length <= (slide.type === 'yn' ? 3 : 12)));
assert.ok(slides.filter(slide => slide.type === 'slider').every(slide => slide.questions.length >= 10));
assert.deepEqual([...new Set(slides.map(slide => slide.type))], ['slider', 'yn']);
assert.equal(slides.findIndex(slide => slide.type === 'yn'), 21);
assert.ok(slides.every(slide => slide.questions.every(row => row[3] === slide.type && row[0].startsWith(`${slide.category}-`))));
const legacySlides = makeLegacySlides();
assert.equal(legacySlides.length, 85);
legacySlides.forEach((slide, index) => {
  const newIndex = remapLegacySlideIndex(index);
  const unseen = new Set(legacySlides.slice(index).flatMap(item => item.questions.map(row => row[0])));
  assert.ok(slides[newIndex].questions.some(row => unseen.has(row[0])), `old slide ${index + 1} resumes with an unseen question`);
  assert.ok(slides.slice(0, newIndex).every(item => item.questions.every(row => !unseen.has(row[0]))), `old slide ${index + 1} does not skip unseen cards`);
});
const futureMultiRows = Array.from({ length: 23 }, (_, index) => [`A1-M${index}`, 'Test', 'Test?', 'multi', 1, []]);
assert.deepEqual(makeSlides(futureMultiRows).map(slide => slide.questions.length), [12, 11]);
for (const row of FAMILIES.filter(item => item[3] === 'slider')) {
  const stops = row[5].map((anchor, index) => anchor[0] ?? index);
  assert.equal(new Set(stops).size, stops.length, `${row[0]} has distinct slider stops`);
  stops.forEach((stop, index) => assert.equal(rubricPoints(row, stop), row[5][index][2], `${row[0]} stop ${index + 1} matches the rubric`));
}

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
