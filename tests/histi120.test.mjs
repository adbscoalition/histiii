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
assert.equal(vm.runInContext('disclosurePct(birth,testAnswer)',context),20);
console.log('PASS: 120 prompts, 263 unique mappings, category counts, original weighted scoring, exclusions, cumulative rubrics, isolated storage, and no upload APIs.');
