import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { FAMILIES, CATEGORY_META, RECIPIENTS, SOURCE_IDS } from '../histi120-family-data.js';
import { FAMILIES as FULL } from '../histi4-data.js';
import { makeSlides, calculate, rubricPoints, displayScore } from '../histi4-core.js';

const read = file => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
const totals = { A1:420, A2:488, B:392, C:622, D:794 };

test('abridged document provides 120 unique families and all 480 recipient wordings', () => {
  assert.equal(FAMILIES.length,120);
  assert.equal(new Set(FAMILIES.map(row=>row[0])).size,120);
  assert.equal(FAMILIES.filter(row=>row[3]==='slider').length,108);
  assert.equal(FAMILIES.filter(row=>row[3]==='yn').length,12);
  assert.equal(FULL.length,245,'the Full set is not replaced');
  assert.deepEqual(Object.keys(RECIPIENTS),['G1','G2','G3','G4']);
  const counts = { A1:28, A2:24, B:20, C:24, D:24 };
  for (const [category,max] of Object.entries(totals)) {
    const rows=FAMILIES.filter(row=>row[0].split('-')[0]===category);
    assert.equal(rows.length,counts[category]);
    assert.equal(rows.reduce((sum,row)=>sum+row[4],0),max);
    assert.equal(CATEGORY_META[category].max,max);
  }
  for (const row of FAMILIES) {
    assert.ok(SOURCE_IDS[row[0]],row[0]);
    assert.equal(row[6].length,4);
    assert.equal(new Set(row[6]).size,4,'recipient knowledge assumptions remain distinct');
    assert.ok(row[6].every(prompt=>prompt.includes(row[1])));
    assert.equal(row[5][0][2],0);
    assert.equal(row[5].at(-1)[2],row[4]);
    for (const anchor of row[5]) assert.equal(rubricPoints(row,anchor[0]),anchor[2],row[0]);
    if (row[3]==='slider') assert.deepEqual(row[5].map(stop=>stop[0]),[0,25,50,75,100]);
  }
});

test('all maximum choices reach every documented maximum without overshooting', () => {
  for (const [value,expected] of [[0,-100],[100,100]]) {
    const answers=Object.fromEntries(FAMILIES.map(row=>[row[0],{status:'score',value:row[3]==='yn'?(value===100?1:0):value}]));
    const result=calculate(answers,FAMILIES);
    assert.equal(result.score,expected);
    assert.equal(result.answered,120);
    for(const [category,bucket]of Object.entries(result.categories)) {
      assert.equal(bucket.available,totals[category]);
      assert.equal(bucket.earned,value===100?totals[category]:0);
      assert.equal(bucket.score,expected);
    }
    assert.equal(Object.values(result.categories).reduce((sum,bucket)=>sum+bucket.available,0),2716);
    assert.equal(displayScore(result.score),value===100?'O100':'P100');
  }
  for (const row of FAMILIES.filter(row=>row[3]==='slider')) {
    for(let value=0;value<=100;value++) {
      const points=rubricPoints(row,value);
      assert.ok(points>=0&&points<=row[4]);
    }
  }
});

test('unknown and not-applicable are excluded while refusal counts exactly one point', () => {
  const [first,second,third]=FAMILIES;
  const result=calculate({[first[0]]:{status:'unknown'},[second[0]]:{status:'na'},[third[0]]:{status:'pna'}},FAMILIES);
  assert.equal(result.answered,1);
  assert.equal(result.categories.A1.earned,1);
  assert.equal(result.categories.A1.available,third[4]);
  assert.equal(result.categories.C.score,null);
  assert.equal(calculate({},FAMILIES).score,null);
});

test('15 cards cover every new question once, with levels followed by yes/no cards', () => {
  const slides=makeSlides(FAMILIES);
  assert.equal(slides.length,15);
  assert.equal(slides.flatMap(slide=>slide.questions).length,120);
  assert.equal(new Set(slides.flatMap(slide=>slide.questions.map(row=>row[0]))).size,120);
  assert.equal(slides.filter(slide=>slide.type==='slider').length,10);
  assert.equal(slides.filter(slide=>slide.type==='yn').length,5);
  assert.ok(slides.slice(0,10).every(slide=>slide.type==='slider'&&slide.questions.length<=12));
  assert.ok(slides.slice(10).every(slide=>slide.type==='yn'&&slide.questions.length<=3));
});

test('new routes use the Full UI and separate saved answers for every format and recipient', () => {
  const app=read('app-histi4.js');
  assert.match(app,/histi\.120-families\.\$\{group\}\.v1/);
  assert.match(app,/histi\.four-groups\.\$\{group\}\.v1/);
  assert.match(app,/makeSlides\(FAMILIES\)/);
  assert.match(app,/\$\('start-btn'\)\.disabled = false/);
  assert.match(app,/calculateFamilies\(answers, FAMILIES\)/);
  assert.match(app,/variants\[Number\(group\.slice\(1\)\) - 1\]/);
  assert.match(app,/\$\{routeBase\}-\$\{key\.toLowerCase\(\)\}/);
  for (let group=1;group<=4;group++) {
    const html=read(`checkin-120-g${group}.html`);
    assert.match(html,new RegExp(`data-test="120" data-recipient="G${group}"`));
    assert.match(html,/id="start-btn"[^>]+disabled/,'Start cannot accept an unbound early click');
    for (const text of ['120 questions','20–25 minutes','histi120-family.css','app-histi4.js','histi4-results.css','histi4-privacy.js','has not yet been revalidated','The score is not fully accurate to true privacy and openness values.']) assert.ok(html.includes(text),text);
    assert.doesNotMatch(html,/245 questions|55–70|app-histi120\.js|<textarea|type="text"|A1-001/);
  }
  const selector=read('checkin-page.html');
  assert.equal((selector.match(/class="app-card /g)||[]).length,11);
  for(const name of ['SMSTI','Social Media Sharing Transparency Index','PEISTI','Professional Environment Information Sharing Transparency Index']) assert.ok(selector.includes(name));
  assert.match(selector,/40–50 minutes per person · 245 questions/);
  assert.match(selector,/20–25 minutes per person · 120 questions/);
});

test('HISTI-60 replaces the upcoming HISTI-50 and becomes available', () => {
  const selector=read('checkin-page.html');
  const metadata=JSON.parse(selector.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/)[1]);
  assert.match(metadata.description,/HISTI-60 is available with 60 questions per recipient, about 10–15 minutes/);
  assert.match(selector,/<a class="app-card available short" href="\/checkin-60"/);
  assert.doesNotMatch(selector,/HISTI-50|50-question version/);
});
