import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import * as full from '../histi4-data.js';
import * as abridged from '../histi120-family-data.js';
import * as short from '../histi60-family-data.js';
import {localizeDataset,SHARING_ZH} from '../zh/data.js';
import {relationship,topic,pattern} from '../zh/results.js';
import {calculate,makeSlides,rubricPoints} from '../histi4-core.js';
import {describeScore,describePattern} from '../histi4-results.js';
import {buildZhPage,ZH_PAGES} from '../scripts/build-zh-pages.mjs';
const {t}=createRequire(import.meta.url)('../zh/ui.js');
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const formats=[['full',full,245,'e6ffcb5a46c59064013e579c07cfb37c1877993fc275b14eb4ba76adf41daede'],['120',abridged,120,'f71d34d32709ee99c0b7b2738d0982afec66e37bc15bd6b10c402fc1002cff1d'],['60',short,60,'e9c436306f8143f042d142b2fcf498c1f0563d53ac134a2f699016f4abb9c360']];
for(const [format,en,count,fingerprint] of formats){
 test(`Chinese ${format} translates every question, scope, anchor and all four contexts without changing a scoring field`,()=>{
  const zh=localizeDataset(en,format);
  assert.equal(zh.FAMILIES.length,count);
  const hash=createHash('sha256').update(JSON.stringify(en.FAMILIES.map(r=>[r[0],r[1],r[2],r[3],r[5].map(a=>a[1]),r[6]]))).digest('hex');
  assert.equal(hash,fingerprint,'review translation when English wording changes');
  en.FAMILIES.forEach((row,i)=>{
   const tr=zh.FAMILIES[i];
   assert.deepEqual([tr[0],tr[3],tr[4],tr[5].map(a=>[a[0],a[2]])],[row[0],row[3],row[4],row[5].map(a=>[a[0],a[2]])]);
   for(const text of [tr[1],tr[2],...tr[5].map(a=>a[1]),...(tr[6]||[])])assert.match(text,/[\u3400-\u9fff]/);
   if(format!=='full')assert.equal(tr[6].length,4);
   for(const [n,a] of row[5].entries())assert.equal(rubricPoints(row,a[0]??n),rubricPoints(tr,a[0]??n));
  });
  for(const key of Object.keys(en.CATEGORY_META))assert.deepEqual({...zh.CATEGORY_META[key],label:en.CATEGORY_META[key].label},en.CATEGORY_META[key]);
  assert.deepEqual(makeSlides(zh.FAMILIES).map(s=>s.questions.map(r=>r[0])),makeSlides(en.FAMILIES).map(s=>s.questions.map(r=>r[0])));
  for(let sample=0;sample<12;sample++){
   const answers=Object.fromEntries(en.FAMILIES.map((r,i)=>[r[0],i%13===sample?{status:'na'}:i%17===sample?{status:'unknown'}:i%19===sample?{status:'pna'}:{status:'score',value:r[3]==='yn'?(i+sample)%2:r[5][(i+sample)%r[5].length][0]??(i+sample)%r[5].length}]));
   assert.deepEqual(calculate(answers,zh.FAMILIES,zh.CATEGORY_META),calculate(answers,en.FAMILIES,en.CATEGORY_META));
  }
 });
}
test('Chinese result bands, topic descriptions and pattern branches use the same cutoffs',()=>{
 for(const score of [null,-100,-70,-69,-20,-19,0,19,20,69,70,100])for(const group of Object.keys(SHARING_ZH)){
  const reading=relationship(score,group);assert.equal(reading.key,describeScore(score).key);assert.match(reading.context,/[\u3400-\u9fff]/);
  for(const key of ['A1','A2','B','C','D']){const r=topic(key,{score},group);assert.equal(r.key,reading.key);assert.match(r.description,/[\u3400-\u9fff]/);}
 }
 for(const scores of [[null,null],[0,null],[0,39],[0,40]]){
  const result={answered:1,total:3,categories:Object.fromEntries(scores.map((score,i)=>[['A1','A2'][i],{score}]))};
  const zh=pattern(result,{A1:{label:'日常活动'},A2:{label:'人生事件'}}),en=describePattern(result,full.CATEGORY_META);
  assert.equal(zh.title==='看看答案之间的差异。',en.title==='Where your answers differ.');
 }
});
test('all sixteen Chinese pages are reproducible, self-hosted and language-linked, with no free-text answer fields',()=>{
 assert.equal(ZH_PAGES.length,16);
 for(const page of ZH_PAGES){
  const html=read('zh/'+page+'.html');assert.equal(html.trimEnd(),buildZhPage(page).trimEnd());
  assert.match(html,/<html lang="zh-CN">/);assert.match(html,/简体中文译稿尚未经过独立的语言或心理测量验证/);
  const data=JSON.parse(html.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/)[1]);
  assert.equal(data.inLanguage,'zh-CN');assert.equal(data.url,'https://www.histi.org/zh/'+page);assert.equal(data.translationOfWork['@id'],'https://www.histi.org/'+page+'#webpage');
  assert.equal((html.match(/hreflang="zh-CN"/g)||[]).length,1);assert.equal((html.match(/hreflang="en"/g)||[]).length,2);
  assert.match(html,/connect-src 'none'/);assert.match(html,/form-action 'none'/);assert.doesNotMatch(html,/<textarea|type="text"|type="range"/);
  const body=html.split('</head>')[1];
  for(const [,s] of body.matchAll(/>([^<>]+)</g))if(/[A-Za-z]{3}/.test(s)&&!/[\u3400-\u9fff]/.test(s))assert.match(s.trim(),/^(English|HISTI(?:-Extended|-120|-60)?)$/);
  assert.match(html,/href="\/#about"/);assert.match(html,/href="\/privacy"/);
  assert.ok(read(page+'.html').includes(`href="/zh/${page}"`));
 }
});
test('Chinese controls use explicit bounded localization and separate saved-answer namespaces',()=>{
 const ui=read('zh/ui.js'),app=read('app-histi4.js');
 assert.doesNotMatch(ui,/MutationObserver|setInterval|requestAnimationFrame|fetch\(/);
 assert.match(app,/histi\.zh-CN\.\$\{/);assert.match(app,/localizeDataset/);
 for(const label of ['Next','Clear',"I don't know",'Prefer not to answer','Not applicable','Settings','Keep my answers','Yes, reset'])assert.notEqual(t(label),label);
 assert.equal(t('Level 3: 视情况而定'),'第 3 档：视情况而定');
 assert.equal(t('2 local keys'),'2 项本地记录');
 assert.equal(t('Card 2 of 29'),'第 2／29 页');
 const bytes=readFileSync(new URL('../fonts/kaiti/zh-subset.woff2',import.meta.url));
 assert.equal(bytes.subarray(0,4).toString(),'wOF2');assert.ok(bytes.length<250000,'do not ship the original 11.8 MB font');
 assert.match(read('zh/typography.css'),/font-display:swap/);
});
