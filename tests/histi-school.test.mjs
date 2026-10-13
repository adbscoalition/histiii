import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { FAMILIES, CATEGORY_META, RECIPIENTS, SOURCE_IDS, makeSchoolSlides } from '../histi-school-data.js';
import { calculate, rubricPoints, displayScore } from '../histi4-core.js';
import { coverageText } from '../histi4-results.js';

const read = file => readFileSync(new URL('../'+file, import.meta.url), 'utf8');
const schoolScore = answers => calculate(answers, FAMILIES, CATEGORY_META, {pnaPoints:null});
const counts = {A1:16,A2:10,B:12,C:10};
const maxima = {A1:242,A2:192,B:216,C:238};
const weights = {A1:23,A2:25,B:25,C:20};
// Source DOCX SHA256 c1eab19dfea2afcae947918ceb54993deb7988ec070816fcacf65ab5fc58bac1.
test('the school import preserves all 48 source titles, types, maxima, and 192 exact recipient prompts',()=>{
  assert.equal(FAMILIES.length,48);
  assert.equal(new Set(FAMILIES.map(row=>row[0])).size,48);
  const fingerprint=FAMILIES.map(row=>[row[0],row[1],row[3],row[4],row[6]]);
  assert.equal(createHash('sha256').update(JSON.stringify(fingerprint)).digest('hex'),'a986e90be554906cb838deda4e3f003d1be08e6203475119646580a3ae448bbb');
  assert.equal(FAMILIES.filter(row=>row[3]==='slider').length,44);
  assert.equal(FAMILIES.filter(row=>row[3]==='yn').length,4);
  assert.deepEqual(Object.keys(CATEGORY_META),['A1','A2','B','C']);
  for(const key of Object.keys(counts)){
    const rows=FAMILIES.filter(row=>row[0].split('-')[0]===key);
    assert.equal(rows.length,counts[key]);
    assert.equal(rows.reduce((sum,row)=>sum+row[4],0),maxima[key]);
    assert.equal(CATEGORY_META[key].max,maxima[key]);
    assert.equal(CATEGORY_META[key].weight,weights[key]);
  }
  assert.equal(Object.values(CATEGORY_META).reduce((sum,meta)=>sum+meta.weight,0),93);
  for(const row of FAMILIES){
    assert.ok(SOURCE_IDS[row[0]]);
    assert.equal(row[6].length,4);
    assert.deepEqual(row[5].map(stop=>stop[0]),row[3]==='slider'?[0,25,50,75,100]:[0,1]);
    for(const stop of row[5])assert.equal(rubricPoints(row,stop[0]),stop[2]);
    assert.equal(row[5][0][2],0);assert.equal(row[5].at(-1)[2],row[4]);
    if(row[3]==='slider')for(const stop of row[5])assert.equal(stop[2],Math.round(row[4]*stop[0]/100));
  }
});

test('four eleven-slider parts precede one four-yes/no part, without duplication or omitted questions',()=>{
  const slides=makeSchoolSlides();
  assert.equal(slides.length,5);
  assert.deepEqual(slides.map(slide=>slide.questions.length),[11,11,11,11,4]);
  assert.deepEqual(slides.map(slide=>slide.type),['slider','slider','slider','slider','yn']);
  assert.equal(new Set(slides.flatMap(slide=>slide.questions.map(row=>row[0]))).size,48);
  assert.deepEqual(slides.map(slide=>slide.category),['A1','A2','B','C','B']);
  for(const slide of slides)for(const row of slide.questions)assert.ok(slide.categories.includes(row[0].split('-')[0]));
  assert.equal(slides.at(-1).questions.length,4);
});

test('all choices reach the exact 888-point per-person maximum, with no Category D or overshoot',()=>{
  for(const value of [0,100]){
    const answers=Object.fromEntries(FAMILIES.map(row=>[row[0],{status:'score',value:row[3]==='yn'?(value===100?1:0):value}]));
    const result=schoolScore(answers);
    assert.equal(result.answered,48);
    assert.equal(result.score,value===100?100:-100);
    assert.equal(displayScore(result.score),value===100?'O100':'P100');
    assert.deepEqual(Object.keys(result.categories),['A1','A2','B','C']);
    assert.equal(Object.values(result.categories).reduce((sum,bucket)=>sum+bucket.available,0),888);
    for(const [key,bucket] of Object.entries(result.categories)){
      assert.equal(bucket.available,maxima[key]);
      assert.equal(bucket.earned,value===100?maxima[key]:0);
    }
  }
  assert.equal(888*Object.keys(RECIPIENTS).length,3552);
  const neutral=schoolScore(Object.fromEntries(FAMILIES.map(row=>[row[0],row[3]==='yn'?{status:'skip'}:{status:'score',value:50}])));
  assert.equal(displayScore(neutral.score),'N0');
  assert.equal(coverageText(neutral),'44 of 48 questions scored · 4 of 4 areas represented');
});

test('school skips, prefer-not-to-answer, unknown, NA, and blanks are excluded from both totals',()=>{
  for(const status of ['skip','pna','unknown','na']){
    const answers=Object.fromEntries(FAMILIES.map(row=>[row[0],{status}]));
    const result=schoolScore(answers);
    assert.equal(result.score,null);assert.equal(result.answered,0);
    assert.ok(Object.values(result.categories).every(bucket=>bucket.available===0&&bucket.earned===0&&bucket.score===null));
  }
  const a=FAMILIES.find(row=>row[0].startsWith('A1')),b=FAMILIES.find(row=>row[0].startsWith('A2'));
  const result=schoolScore({[a[0]]:{status:'score',value:100},[b[0]]:{status:'score',value:0}});
  assert.equal(result.score,Math.round((23*100+25*-100)/48));
  assert.equal(result.categories.B.score,null);assert.equal(result.categories.C.score,null);
  assert.equal(calculate({[a[0]]:{status:'pna'}},FAMILIES).categories.A1.earned,1,'regular tests keep the existing PNA rule');
});

test('school routes retain shared controls, isolated local progress, school safeguards, and no private-data fields',()=>{
  assert.deepEqual(Object.values(RECIPIENTS).map(person=>person.label),['Unfamiliar student','Classmate','Friend','Trusted adult']);
  const selector=read('checkin-school.html');
  for(let group=1;group<=4;group++){
    assert.ok(selector.includes('href="/checkin-school-g'+group+'"'));
    const html=read('checkin-school-g'+group+'.html');
    assert.match(html,new RegExp('data-test="school" data-recipient="G'+group+'"'));
    for(const id of ['start-btn','question-list','category-results','reset-btn','result-reset-btn','result-read-dialog'])assert.ok(html.includes('id="'+id+'"'));
    assert.match(html,/48 questions for this person/);assert.match(html,/44 levels · 4 yes\/no/);
    assert.match(html,/connect-src 'none'/);assert.match(html,/histi4-privacy\.js/);
    assert.match(html,/Skipping, “Prefer not to answer,”/);assert.doesNotMatch(html,/counts as 1 point/);
    assert.match(html,/No answer is good or bad/);assert.match(html,/Participation is optional/);
    assert.match(html,/has not yet been validated as equivalent/);
    assert.doesNotMatch(html,/<textarea|type="text"|spouse|partner|35–50 minutes per person|histi60/i);
    assert.match(html,/No names, passwords, codes, or real private details/);
  }
  assert.match(selector,/Do not collect named responses/);assert.match(selector,/not individual scores/);
  assert.match(read('app-histi4.js'),/histi\.school\.\$\{group\}\.v1/);
  assert.match(read('app-histi4.js'),/school \? makeSchoolSlides\(FAMILIES\)/);
  const metadata=JSON.parse(read('index.html').match(/id="histi-site-definitions">([\s\S]*?)<\/script>/)[1]);
  const school=metadata['@graph'].find(node=>node['@id']==='https://www.histi.org/#histi-school');
  assert.equal(school.creativeWorkStatus,'Available');
  assert.match(school.description,/aged 10–18/);assert.match(school.abstract,/excluded from earned and available points/);
  assert.match(read('privacy.html'),/HISTI for Schools is a separate optional classroom reflection/);
  assert.match(read('terms.html'),/separate HISTI for Schools activity is for students aged 10–18/);
});

