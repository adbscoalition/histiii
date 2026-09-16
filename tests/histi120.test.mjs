import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import catalogue from '../questions-data-private-v1.js';
import condensed from '../questions-histi120.js';

assert.equal(condensed.count, 120);
assert.equal(condensed.questions.length, 120);
assert.deepEqual(condensed.questions.map(q => q.number), Array.from({length:120}, (_,i) => i+1));
const mapped = condensed.questions.flatMap(q => q.items);
assert.equal(mapped.length, 263);
assert.equal(new Set(mapped).size, 263);
assert.deepEqual([...mapped].sort(), catalogue.questions.map(q => q.code).sort());
assert.deepEqual(Object.fromEntries('ABCD'.split('').map(c => [c, condensed.questions.filter(q => q.category === c).length])), {A:60,B:22,C:25,D:13});
assert.ok(condensed.questions.every(q => q.items.every(code => code.startsWith(q.category))));
assert.equal(condensed.scoringItems.length,263);
assert.deepEqual([...condensed.scoringItems].sort((a,b)=>a.code.localeCompare(b.code)),[...catalogue.questions].sort((a,b)=>a.code.localeCompare(b.code)), 'all supplied exact weights and trigger shares match the canonical catalogue');
const source = fs.readFileSync(new URL('../app-histi120.js', import.meta.url), 'utf8');
assert.ok(source.includes("'histi.120.progress.v1'"));
assert.ok(source.includes("'histi.120.results.v1'"));
assert.ok(!source.includes("'histi.progress.v3'"));
assert.ok(source.includes("state.categorySkips[category] = 'exclude'"));
assert.ok(!/\b(fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon)\s*\(/.test(source));

// Run the production scoring functions directly, without a browser or test-only runtime hook.
const context = vm.createContext({scoreItems: catalogue.questions, CATEGORY_CAPS:{A:50,B:20,C:20,D:10}, state:{answers:{},categorySkips:{}}});
for (const name of ['getAnswer','assignedWeight','disclosurePct','compute','pairedFullIndex']) {
  const start = source.indexOf(`function ${name}(`);
  const tail = source.slice(start);
  const next = tail.slice(1).search(/\n(?:async )?function /);
  vm.runInContext(next < 0 ? tail : tail.slice(0,next+1), context);
}
assert.equal(vm.runInContext('compute().overall', context), null, 'unassessed is excluded');
function answer(code, pct, status='SCORE') {
  context.state.answers[code] = {status,selected:[],weight:catalogue.questions.find(q => q.code === code).suggestedWeight,answered:true,explicitNone:pct===0,fullByAll:pct===100};
}
answer('A01',100);
assert.equal(vm.runInContext('compute().overall',context),100);
answer('A19',0,'NAPP');
answer('A32',0,'U');
answer('A51',0,'PNA');
answer('B01',0,'DUP');
assert.equal(vm.runInContext('compute().overall',context),100,'NA, U, refusal, and duplicate do not become zeros');
answer('B01',0);
answer('C01',100);
answer('D01',0);
assert.equal(vm.runInContext('compute().overall',context),70,'original category shares retained');
context.state.categorySkips.C='exclude';
assert.equal(vm.runInContext('compute().overall',context),62.5,'excluded category renormalizes active caps');
delete context.state.categorySkips.C;
const birth = catalogue.questions.find(q=>q.code==='A05');
context.birth=birth;
assert.equal(vm.runInContext('pairedFullIndex(birth,0)',context),1);
context.testAnswer={status:'SCORE',answered:true,selected:[0,1],fullByAll:false};
assert.equal(vm.runInContext('disclosurePct(birth,testAnswer)',context),10, 'full replaces its paired partial instead of adding to it');
context.testAnswer.selected=[0];
assert.equal(vm.runInContext('disclosurePct(birth,testAnswer)',context),10, 'partial still scores when selected alone');
context.examplePair={rubric:[
  {trigger:'1A. Partial/limited evidence toward: example',share:0.75},
  {trigger:'1B. Full-detail increment — completes 1A with exact detail',share:1.5},
  {trigger:'Another independent detail',share:98.5}
]};
context.testAnswer.selected=[0,1];
assert.equal(vm.runInContext('disclosurePct(examplePair,testAnswer)',context),1.5, '0.75 partial plus 1.50 full scores 1.50 total');
for (const question of catalogue.questions) {
  context.auditQuestion=question;
  context.auditAnswer={status:'SCORE',answered:true,selected:question.rubric.map((_,i)=>i),fullByAll:false};
  assert.equal(vm.runInContext('disclosurePct(auditQuestion,auditAnswer)',context),100, `${question.code} fills its maximum when every detail is selected`);
}
const allSelectedAnswers=Object.fromEntries(catalogue.questions.map(question=>[question.code,{
  status:'SCORE',answered:true,selected:question.rubric.map((_,i)=>i),weight:question.suggestedWeight,explicitNone:false,fullByAll:false
}]));
context.state.answers=allSelectedAnswers;
context.state.categorySkips={};
const condensedMaximum=vm.runInContext('compute()',context);
assert.equal(condensedMaximum.overall,100,'HISTI-120 reaches the overall maximum when every rubric is selected');
assert.deepEqual(JSON.parse(JSON.stringify(Object.fromEntries(Object.entries(condensedMaximum.cats).map(([code,result])=>[code,result.points])))),{A:50,B:20,C:20,D:10});

// The regular HISTI runtime must use the same replacement rule.
const regularSource = fs.readFileSync(new URL('../app-public-sans.js', import.meta.url), 'utf8');
const regularContext = vm.createContext({questions:catalogue.questions,CATEGORY_CAPS:{A:50,B:20,C:20,D:10},state:{answers:{},categorySkips:{}}});
for (const name of ['getAnswer','assignedWeight','disclosurePct','compute','pairedFullIndex']) {
  const start = regularSource.indexOf(`function ${name}(`);
  const tail = regularSource.slice(start);
  const next = tail.slice(1).search(/\n(?:async )?function /);
  vm.runInContext(next < 0 ? tail : tail.slice(0,next+1), regularContext);
}
regularContext.birth=birth;
regularContext.testAnswer={status:'SCORE',answered:true,selected:[0,1],fullByAll:false};
assert.equal(vm.runInContext('disclosurePct(birth,testAnswer)',regularContext),10, 'regular HISTI full replaces its paired partial');
regularContext.examplePair=context.examplePair;
assert.equal(vm.runInContext('disclosurePct(examplePair,testAnswer)',regularContext),1.5, 'regular HISTI scores the example pair as 1.50 total');
for (const question of catalogue.questions) {
  regularContext.auditQuestion=question;
  regularContext.auditAnswer={status:'SCORE',answered:true,selected:question.rubric.map((_,i)=>i),fullByAll:false};
  assert.equal(vm.runInContext('disclosurePct(auditQuestion,auditAnswer)',regularContext),100, `regular HISTI ${question.code} fills its maximum`);
}
regularContext.state.answers=allSelectedAnswers;
const regularMaximum=vm.runInContext('compute()',regularContext);
assert.equal(regularMaximum.overall,100,'regular HISTI reaches the overall maximum when every rubric is selected');
assert.deepEqual(JSON.parse(JSON.stringify(Object.fromEntries(Object.entries(regularMaximum.cats).map(([code,result])=>[code,result.points])))),{A:50,B:20,C:20,D:10});
console.log('PASS: 120 prompts, 263 unique mappings, category counts, weighted scoring, exclusions, replacement full-detail rubrics, all-selected maximums, isolated storage, and no upload APIs.');
