import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { FAMILIES, CATEGORY_META, RECIPIENTS } from '../histi4-data.js';
import { makeSlides } from '../histi4-core.js';
import { FAMILIES as SHORT_FAMILIES } from '../histi120-family-data.js';

const home = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('home page describes the current available check-ins', () => {
  assert.equal(FAMILIES.length, 245);
  assert.equal(makeSlides().length, 29);
  assert.equal(Object.keys(RECIPIENTS).length, 4);
  assert.equal(Object.keys(CATEGORY_META).length, 5);
  assert.equal(SHORT_FAMILIES.length, 120);

  assert.match(home, /245 questions/);
  assert.match(home, /29 cards/);
  assert.match(home, /HISTI<em>-120<\/em>/);
  assert.match(home, /Five Full result areas/);
  assert.match(home, /href="\/checkin-4"/);
  assert.match(home, /href="\/checkin-120"/);
  assert.match(home, /HISTI<em>-60<\/em>/);
  assert.match(home, /href="\/checkin-60"/);
  assert.match(home, /10–15 minutes<br>7 cards/);
  assert.doesNotMatch(home, /TEMPORARILY PAUSED/);
  assert.match(home, /href="\/checkin-4#privacy-proof"/);
  assert.doesNotMatch(home, /263|skip sensitive Categories C and D from their warning screens/i);
});
