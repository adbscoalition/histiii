import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { FAMILIES, CATEGORY_META, RECIPIENTS, SOURCE_IDS } from '../histi60-family-data.js';
import { FAMILIES as FULL } from '../histi4-data.js';
import { FAMILIES as ABRIDGED } from '../histi120-family-data.js';
import { makeSlides, calculate, rubricPoints, displayScore } from '../histi4-core.js';

const read = file => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
const counts = { A1:14, A2:12, B:10, C:12, D:12 };
const totals = { A1:224, A2:268, B:212, C:348, D:454 };
const weights = { A1:23, A2:25, B:25, C:20, D:10 };

test('HISTI-60 contains the supplied 60 families, 54 level questions and 6 yes/no', () => {
  assert.equal(FAMILIES.length,60);
  assert.equal(new Set(FAMILIES.map(row=>row[0])).size,60);
  assert.equal(FAMILIES.filter(row=>row[3]==='slider').length,54);
  assert.equal(FAMILIES.filter(row=>row[3]==='yn').length,6);
  assert.equal(FULL.length,245);
  assert.equal(ABRIDGED.length,120);
  for(const category of Object.keys(counts)) {
    const rows=FAMILIES.filter(row=>row[0].split('-')[0]===category);
    assert.equal(rows.length,counts[category]);
    assert.equal(rows.reduce((sum,row)=>sum+row[4],0),totals[category]);
    assert.equal(CATEGORY_META[category].max,totals[category]);
    assert.equal(CATEGORY_META[category].weight,weights[category]);
  }
  assert.equal(Object.values(CATEGORY_META).reduce((sum,bucket)=>sum+bucket.weight,0),103);
});

test('all 240 supplied recipient variants retain their wording and knowledge context', () => {
  assert.deepEqual(Object.keys(RECIPIENTS),['G1','G2','G3','G4']);
  for(const row of FAMILIES) {
    assert.ok(row[2],'expanded scope is not lost');
    assert.ok(SOURCE_IDS[row[0]],'120-family traceability is retained');
    assert.equal(row[6].length,4);
    assert.equal(new Set(row[6]).size,4);
    assert.ok(row[6].every(prompt=>!prompt.startsWith(row[0])),'internal question IDs are stripped');
    assert.match(row[6][0],/No prior knowledge|No shared history|no prior knowledge|no practical/);
    assert.match(row[6][3],/already know|already known/);
    assert.deepEqual(row[5].map(stop=>stop[0]),row[3]==='slider'?[0,25,50,75,100]:[0,1]);
    assert.equal(row[5][0][2],0);
    assert.equal(row[5].at(-1)[2],row[4]);
    for(const stop of row[5]) assert.equal(rubricPoints(row,stop[0]),stop[2]);
  }
  assert.equal(SOURCE_IDS['A1-001'],'A1-001, A1-009');
  assert.equal(FAMILIES.find(row=>row[0]==='C-001')[5][1][2],8,'preserve the document rounded quarter point');
  assert.equal(FAMILIES.find(row=>row[0]==='D-008')[4],30,'merged weights are not sums of source items');
});

test('all minimum/maximum choices reach P100/O100 and the exact documented maxima', () => {
  for(const value of [0,100]) {
    const answers=Object.fromEntries(FAMILIES.map(row=>[row[0],{status:'score',value:row[3]==='yn'?(value===100?1:0):value}]));
    const result=calculate(answers,FAMILIES);
    assert.equal(result.total,60);
    assert.equal(result.answered,60);
    assert.equal(result.coverage,1);
    assert.equal(result.score,value===100?100:-100);
    assert.equal(displayScore(result.score),value===100?'O100':'P100');
    assert.equal(Object.values(result.categories).reduce((sum,bucket)=>sum+bucket.available,0),1506);
    for(const [category,bucket] of Object.entries(result.categories)) {
      assert.equal(bucket.available,totals[category]);
      assert.equal(bucket.earned,value===100?totals[category]:0);
      assert.equal(bucket.score,value===100?100:-100);
    }
  }
  for(const row of FAMILIES.filter(row=>row[3]==='slider')) {
    for(let value=0;value<=100;value++) {
      const points=rubricPoints(row,value);
      assert.ok(points>=0&&points<=row[4],'no intermediate answer overshoots');
    }
  }
});

test('unknown/NA/unanswered are unweighted and prefer-not-to-answer remains exactly one point', () => {
  const [a,b,c]=FAMILIES;
  const result=calculate({[a[0]]:{status:'unknown'},[b[0]]:{status:'na'},[c[0]]:{status:'pna'}},FAMILIES);
  assert.equal(result.answered,1);
  assert.equal(result.categories.A1.earned,1);
  assert.equal(result.categories.A1.available,c[4]);
  assert.equal(result.categories.D.score,null);
  assert.equal(calculate({},FAMILIES).score,null);
});

test('seven cards cover all sixty questions once, followed by yes/no cards', () => {
  const slides=makeSlides(FAMILIES);
  assert.equal(slides.length,7);
  assert.ok(slides.slice(0,5).every(slide=>slide.type==='slider'&&slide.questions.length<=12));
  assert.ok(slides.slice(5).every(slide=>slide.type==='yn'&&slide.questions.length<=3));
  assert.equal(slides.flatMap(slide=>slide.questions).length,60);
  assert.equal(new Set(slides.flatMap(slide=>slide.questions.map(row=>row[0]))).size,60);
});

test('HISTI-60 uses the Full UI and isolated local progress with no sensitive-data entry', () => {
  const app=read('app-histi4.js');
  assert.match(app,/dataset\.test === '60'/);
  assert.match(app,/histi60-family-data\.js/);
  assert.match(app,/histi\.60-families\.\$\{group\}\.v1/);
  assert.match(app,/shortForm \? '\/checkin-60'/);
  for(let group=1;group<=4;group++) {
    const html=read(`checkin-60-g${group}.html`);
    assert.match(html,new RegExp(`data-test="60" data-recipient="G${group}"`));
    assert.match(html,/id="start-btn"[^>]+disabled/);
    for(const text of ['60 questions','10–15 minutes','histi60-family.css','app-histi4.js','histi4-results.css','histi4-privacy.js','has not yet been revalidated','The score is not fully accurate to true privacy and openness values.']) assert.ok(html.includes(text),text);
    assert.doesNotMatch(html,/120 questions|245 questions|20–25|40–50|<textarea|type="text"|A1-001/);
    assert.match(html,/connect-src 'none'/);
    assert.match(html,/\/checkin-60">Think of someone else/);
  }
  const selector=read('checkin-60.html');
  for(let group=1;group<=4;group++) assert.ok(selector.includes(`href="/checkin-60-g${group}"`));
  assert.match(selector,/10–15 minutes per person/);
  assert.match(selector,/60 questions for each relationship/);
  assert.match(read('checkin-page.html'),/10–15 minutes per person · 60 questions/);
  assert.doesNotMatch(read('histi60-family.css'),/animation:|@keyframes|will-change|filter:/);
});
