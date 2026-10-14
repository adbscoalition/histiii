import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync,existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import * as middle from '../histi-school-middle-data.js';
import * as high from '../histi-school-high-data.js';
import { calculate,rubricPoints,displayScore } from '../histi4-core.js';
import { coverageText,referenceScore } from '../histi4-results.js';

const read = file => readFileSync(new URL('../'+file,import.meta.url),'utf8');
const score = (answers,d) => calculate(answers,d.FAMILIES,d.CATEGORY_META,{pnaPoints:null,roundSliderPoints:false});
const expected = {
  middle:{ages:'10–13',minutes:'35–50',sha:'b61059964a04866a47fd240208b6f0c43127d33bb8c3d13f474d264cdb7b09f4',fingerprint:'a1ae3d4e5430509340cccef1416c198c43e411351a97a29ce3bcff6f4ce8b792',labels:['Not okay at all','A little okay','Somewhat okay','Mostly okay','Very okay']},
  high:{ages:'14–18',minutes:'25–40',sha:'2de73a542e8cabe76533283f3a8cf5e820334071e2a53c29ae0f506fcc89da84',fingerprint:'0059890822be41ff63a7d721a51e32435a000d29e402b463febf20808a74843f',labels:['Not comfortable','Slightly comfortable','Somewhat comfortable','Mostly comfortable','Very comfortable']}
};
const counts={A1:16,A2:10,B:12,C:10},maxima={A1:242,A2:192,B:216,C:238},weights={A1:23,A2:25,B:25,C:20};

for(const [edition,d] of Object.entries({middle,high})) {
  const spec=expected[edition];
  test(edition+': source questions, recipients, provenance, point maxima, and 1–5 labels are preserved',()=>{
    assert.equal(d.FAMILIES.length,48);
    assert.equal(new Set(d.FAMILIES.map(row=>row[0])).size,48);
    const fingerprint=d.FAMILIES.map(row=>[row[0],row[1],row[2],row[3],row[4],row[6]]);
    assert.equal(createHash('sha256').update(JSON.stringify(fingerprint)).digest('hex'),spec.fingerprint);
    assert.equal(d.SCHOOL_INFO.sourceSha256,spec.sha);
    assert.equal(d.SCHOOL_INFO.ages,spec.ages);assert.equal(d.SCHOOL_INFO.classMinutes,spec.minutes);
    assert.deepEqual(Object.keys(d.CATEGORY_META),Object.keys(counts));
    assert.deepEqual(Object.values(d.RECIPIENTS).map(p=>p.label),['Student you don’t know','Classmate','Friend','Trusted adult']);
    for(const key of Object.keys(counts)) {
      const rows=d.FAMILIES.filter(row=>row[0].split('-')[0]===key);
      assert.equal(rows.length,counts[key]);assert.equal(rows.reduce((n,row)=>n+row[4],0),maxima[key]);
      assert.equal(d.CATEGORY_META[key].weight,weights[key]);assert.equal(d.CATEGORY_META[key].max,maxima[key]);
    }
    for(const row of d.FAMILIES) {
      assert.ok(d.SOURCE_IDS[row[0]]);assert.deepEqual(row[6],Array(4).fill(row[2]));
      assert.deepEqual(row[5].map(stop=>stop[0]),row[3]==='slider'?[1,2,3,4,5]:[0,1]);
      if(row[3]==='slider')assert.deepEqual(row[5].map(stop=>stop[1]),spec.labels);
    }
  });
  test(edition+': four 11-slider parts precede all four yes/no questions without omissions',()=>{
    const slides=d.makeSchoolSlides(d.FAMILIES);
    assert.deepEqual(slides.map(s=>s.questions.length),[11,11,11,11,4]);
    assert.deepEqual(slides.map(s=>s.type),['slider','slider','slider','slider','yn']);
    assert.deepEqual(slides.map(s=>s.category),['A1','A2','B','C','B']);
    assert.equal(new Set(slides.flatMap(s=>s.questions.map(row=>row[0]))).size,48);
    for(const slide of slides)for(const row of slide.questions)assert.ok(slide.categories.includes(row[0].split('-')[0]));
  });
  test(edition+': every discrete level follows the exact source fraction, without per-answer rounding',()=>{
    for(const row of d.FAMILIES.filter(row=>row[3]==='slider'))for(let level=1;level<=5;level++) {
      const points=row[4]*(level-1)/4;
      assert.equal(rubricPoints(row,level,{round:false}),points);
      const result=score({[row[0]]:{status:'score',value:level}},d);
      assert.equal(result.categories[row[0].split('-')[0]].earned,points);
      assert.equal(result.score,(level-1)*50-100);
    }
    const row=d.FAMILIES[0];
    assert.equal(rubricPoints(row,2,{round:false}),2.5);
    assert.equal(rubricPoints(row,2),3,'regular-test default rounding remains unchanged');
    assert.equal(rubricPoints(row,0,{round:false}),null);assert.equal(rubricPoints(row,100,{round:false}),null);
  });
  test(edition+': all-high reaches exactly 888 points, all-low P100, and middle sliders N0',()=>{
    for(const top of [false,true]) {
      const answers=Object.fromEntries(d.FAMILIES.map(row=>[row[0],{status:'score',value:row[3]==='yn'?(top?1:0):(top?5:1)}]));
      const result=score(answers,d);assert.equal(result.answered,48);assert.equal(displayScore(result.score),top?'O100':'P100');
      assert.equal(Object.values(result.categories).reduce((n,b)=>n+b.available,0),888);
      assert.equal(Object.values(result.categories).reduce((n,b)=>n+b.earned,0),top?888:0);
      for(const [key,bucket] of Object.entries(result.categories)){assert.equal(bucket.available,maxima[key]);assert.equal(bucket.score,top?100:-100);}
      assert.equal(888*Object.keys(d.RECIPIENTS).length,3552);
    }
    const neutral=score(Object.fromEntries(d.FAMILIES.map(row=>[row[0],row[3]==='yn'?{status:'skip'}:{status:'score',value:3}])),d);
    assert.equal(displayScore(neutral.score),'N0');assert.equal(coverageText(neutral),'44 of 48 questions scored · 4 of 4 areas represented');
  });
  test(edition+': skips/PNA/unknown/NA are missing, and category weights renormalize',()=>{
    for(const status of ['skip','pna','unknown','na']) {
      const result=score(Object.fromEntries(d.FAMILIES.map(row=>[row[0],{status}])),d);
      assert.equal(result.score,null);assert.equal(result.answered,0);
      assert.ok(Object.values(result.categories).every(b=>b.available===0&&b.earned===0&&b.score===null));
    }
    const a=d.FAMILIES.find(row=>row[0].startsWith('A1')),b=d.FAMILIES.find(row=>row[0].startsWith('A2'));
    const result=score({[a[0]]:{status:'score',value:5},[b[0]]:{status:'score',value:1}},d);
    assert.equal(result.score,Math.round((23*100+25*-100)/48));
    assert.equal(result.categories.B.score,null);assert.equal(result.categories.C.score,null);
    assert.equal(calculate({[a[0]]:{status:'pna'}},d.FAMILIES).categories.A1.earned,1);
    assert.equal(referenceScore('school','G1','A1'),null);
  });
  test(edition+': all four routes keep privacy, five-stop UI, optional participation, and source reflections',()=>{
    const selector=read('checkin-school-'+edition+'.html');
    assert.match(selector,/Participation is optional/);assert.match(selector,/Private by design/);
    assert.doesNotMatch(selector,/For teachers and caregivers|school-teacher-notes/);
    for(let group=1;group<=4;group++) {
      const route='checkin-school-'+edition+'-g'+group,html=read(route+'.html');
      assert.ok(selector.includes('href="/'+route+'"'));
      assert.ok(html.includes('data-school-edition="'+edition+'"'));assert.ok(html.includes('data-recipient="G'+group+'"'));
      for(const id of ['start-btn','question-list','category-results','reset-btn','result-reset-btn','result-read-dialog'])assert.ok(html.includes('id="'+id+'"'));
      assert.match(html,/48 questions for this person/);assert.match(html,/44 levels · 4 yes\/no/);
      assert.match(html,/connect-src 'none'/);assert.match(html,/histi4-privacy\.js/);
      assert.match(html,/No answer is good or bad/);assert.match(html,/Participation is optional/);
      assert.match(html,/has not yet been validated as equivalent/);assert.match(html,/not be treated as comparable across ages/);
      assert.match(html,/No names, passwords, codes, or real private details/);
      assert.doesNotMatch(html,/<textarea|type="text"|type="range"|35–50 minutes per person|Teacher guide/i);
      assert.ok(html.includes('Ages '+spec.ages));assert.ok(html.includes(spec.minutes+' minutes'));
    }
    assert.equal(d.SCHOOL_INFO.reflectionQuestions.length,3);
    assert.ok(d.SCHOOL_INFO.reflectionQuestions.every(prompt=>prompt.endsWith('?')));
  });
}

test('school replacement has two edition selectors, redirects old links, and never reuses legacy progress',()=>{
  const hub=read('checkin-school.html'),config=JSON.parse(read('vercel.json')),app=read('app-histi4.js');
  assert.match(hub,/Choose your school edition/);assert.match(hub,/aria-label="School editions"/);
  for(const edition of ['middle','high'])assert.ok(hub.includes('href="/checkin-school-'+edition+'"'));
  for(let group=1;group<=4;group++){
    assert.ok(config.redirects.some(r=>r.source==='/checkin-school-g'+group&&r.destination==='/checkin-school'&&r.permanent===false));
    assert.equal(existsSync(new URL('../checkin-school-g'+group+'.html',import.meta.url)),false);
  }
  assert.notEqual(middle.SCHOOL_INFO.storagePrefix,high.SCHOOL_INFO.storagePrefix);
  assert.equal(middle.SCHOOL_INFO.storagePrefix,'histi.school.middle');assert.equal(high.SCHOOL_INFO.storagePrefix,'histi.school.high');
  assert.match(app,/SCHOOL_INFO\.storagePrefix/);assert.match(app,/localStorage\.removeItem\(storageKey\)/);
  assert.doesNotMatch(app,/localStorage\.clear|histi\.school\.\$\{group\}\.v1/);
  assert.match(app,/String\(index \+ 1\)/);assert.match(app,/makeSchoolSlides\(FAMILIES\)/);
  assert.match(app,/roundSliderPoints:!school/);assert.match(app,/round:!school/);
  assert.match(app,/result-school-reflection/);assert.match(app,/SCHOOL_INFO\.reflectionQuestions/);
});

test('school discovery, ages, class estimates, and no-comparison caveat describe both editions',()=>{
  const metadata=JSON.parse(read('index.html').match(/id="histi-site-definitions">([\s\S]*?)<\/script>/)[1]);
  const parent=metadata['@graph'].find(n=>n['@id']==='https://www.histi.org/#histi-school');
  assert.equal(parent.hasPart.length,2);assert.match(parent.description,/35–50 minutes; High 25–40 minutes/);
  for(const edition of ['middle','high']){
    const item=metadata['@graph'].find(n=>n['@id']==='https://www.histi.org/#histi-school-'+edition);
    assert.equal(item.creativeWorkStatus,'Available');assert.ok(item.description.includes(expected[edition].ages));
  }
  assert.match(read('privacy.html'),/older school records are left untouched/);
  assert.match(read('privacy.html'),/only the Middle School edition/);
  assert.match(read('terms.html'),/Do not collect named student responses or grade individual scores/);
  assert.doesNotMatch(read('histi-school.css'),/school-teacher-notes/);
});

