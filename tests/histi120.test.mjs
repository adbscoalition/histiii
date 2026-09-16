import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import catalogue from '../questions-data-private-v1.js';
import shortForm, { SELECTED_CODES } from '../questions-histi120.js';

assert.equal(shortForm.version, '2.8-120-standalone');
assert.equal(shortForm.count, 120);
assert.equal(shortForm.questions.length, 120);
assert.equal(shortForm.scoringItems.length, 120);
assert.equal(new Set(SELECTED_CODES).size, 120);
assert.deepEqual(shortForm.questions.map(q => q.number), Array.from({length:120}, (_,i) => i+1));
assert.ok(shortForm.questions.every(q => q.items.length === 1 && q.items[0] === q.code));
assert.equal(catalogue.questions.length - shortForm.scoringItems.length, 143);
assert.deepEqual(
  Object.fromEntries('ABCD'.split('').map(c => [c, shortForm.questions.filter(q => q.category === c).length])),
  {A:60,B:24,C:24,D:12}
);
for (let i=0;i<120;i+=10) {
  assert.deepEqual(shortForm.questions.slice(i,i+10).map(q=>q.category), ['A','A','A','A','A','B','B','C','C','D']);
}
assert.deepEqual(
  [1,10,20,30,40,50,60,70,80,90,100,110,120].map(n=>shortForm.questions[n-1].code),
  ['A01','D01','D02','D03','D05','D06','D07','D08','D09','D10','D15','D16','D33']
);

const byCode=new Map(catalogue.questions.map(q=>[q.code,q]));
assert.deepEqual(shortForm.scoringItems, SELECTED_CODES.map(code=>byCode.get(code)));

const source=fs.readFileSync(new URL('../app-histi120.js',import.meta.url),'utf8');
assert.ok(source.includes("'histi.120.progress.v2'"));
assert.ok(source.includes("'histi.120.results.v2'"));
assert.ok(source.includes('debugWatermarkEnabled: true'));
assert.ok(source.includes('DEBUG · GENERATED TEST DATA · NOT A REAL RESULT'));
assert.ok(source.includes('panel.dataset.debugFilled = String(!!a.debugFilled)'));
assert.ok(source.includes('function nextNavigableIndex('));
assert.ok(source.includes('I didn’t share any of these.'));
assert.ok(!source.includes('Already covered by a more specific topic'));

const context=vm.createContext({
  scoreItems:shortForm.scoringItems,
  CATEGORY_CAPS:{A:50,B:20,C:20,D:10},
  state:{answers:{},categorySkips:{}}
});
for(const name of ['getAnswer','assignedWeight','disclosurePct','compute','pairedFullIndex']){
  const start=source.indexOf(`function ${name}(`);
  const tail=source.slice(start);
  const next=tail.slice(1).search(/\n(?:async )?function /);
  vm.runInContext(next<0?tail:tail.slice(0,next+1),context);
}
assert.equal(vm.runInContext('compute().overall',context),null);

function answer(code,pct,status='SCORE'){
  const q=byCode.get(code);
  context.state.answers[code]={status,selected:[],weight:q.suggestedWeight,answered:true,explicitNone:pct===0&&status==='SCORE',fullByAll:pct===100&&status==='SCORE'};
}
answer('A01',100);
answer('A02',0,'NAPP');
answer('A03',0,'U');
answer('A04',0,'PNA');
assert.equal(vm.runInContext('compute().overall',context),100);
answer('B01',0); answer('C01',100); answer('D01',0);
assert.equal(vm.runInContext('compute().overall',context),70);

context.pairQuestion=byCode.get('A03');
context.testAnswer={status:'SCORE',answered:true,selected:[0,1],fullByAll:false};
assert.equal(vm.runInContext('disclosurePct(pairQuestion,testAnswer)',context),10);

context.state.answers=Object.fromEntries(shortForm.scoringItems.map(q=>[q.code,{status:'SCORE',answered:true,selected:q.rubric.map((_,i)=>i),weight:q.suggestedWeight,explicitNone:false,fullByAll:false}]));
const maximum=vm.runInContext('compute()',context);
assert.equal(maximum.overall,100);
assert.deepEqual(JSON.parse(JSON.stringify(Object.fromEntries(Object.entries(maximum.cats).map(([k,v])=>[k,v.points])))),{A:50,B:20,C:20,D:10});

context.state.answers=Object.fromEntries(shortForm.scoringItems.map(q=>[q.code,{status:'SCORE',answered:true,selected:[],weight:q.suggestedWeight,explicitNone:true,fullByAll:false}]));
assert.equal(vm.runInContext('compute().overall',context),0);

console.log('PASS: standalone HISTI-120 composition, scoring, exclusions, and debug provenance.');
