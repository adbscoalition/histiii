import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import * as full from '../histi4-data.js';
import * as medium from '../histi120-family-data.js';
import * as short from '../histi60-family-data.js';
import {calculate,makeSlides,displayScore} from '../histi4-core.js';
import {describeScore} from '../histi4-results.js';
import {LANGUAGES,languageTarget} from '../site-languages.js';
import {buildLanguagePage,TRANSLATED_PAGES,pathFor} from '../scripts/build-language-pages.mjs';
const require=createRequire(import.meta.url),read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const newLanguages=['ar','hi','ur','tl','fr'];
const formats=[['full',full,245],['120',medium,120],['60',short,60]];
for(const locale of newLanguages){
 test(locale+': all three assessments preserve the exact rubric, ordering, maximum and missing-answer rules',async()=>{
  const localized=await import('../'+locale+'/data.js');
  for(const [format,source,count] of formats){
   const translated=localized.localizeDataset(source,format);
   assert.equal(translated.FAMILIES.length,count);
   for(const [i,row] of source.FAMILIES.entries()){
    const tr=translated.FAMILIES[i];
    assert.deepEqual([tr[0],tr[3],tr[4],tr[5].map(a=>[a[0],a[2]])],[row[0],row[3],row[4],row[5].map(a=>[a[0],a[2]])],locale+' '+format+' '+row[0]);
    assert.ok(tr[1]?.trim()&&tr[2]?.trim());assert.notEqual(tr[2],row[2],locale+' untranslated scope '+row[0]);
    assert.ok(tr[5].every(a=>typeof a[1]==='string'&&a[1].trim()));
    if(row[6]){assert.equal(tr[6].length,4);tr[6].forEach((text,g)=>assert.notEqual(text,row[6][g],locale+' untranslated context '+row[0]));}
   }
   assert.deepEqual(makeSlides(translated.FAMILIES).map(s=>s.questions.map(r=>r[0])),makeSlides(source.FAMILIES).map(s=>s.questions.map(r=>r[0])));
   for(const key of Object.keys(source.CATEGORY_META))assert.deepEqual({...translated.CATEGORY_META[key],label:source.CATEGORY_META[key].label},source.CATEGORY_META[key]);
   for(let sample=0;sample<18;sample++){
    const answers=Object.fromEntries(source.FAMILIES.map((r,i)=>[r[0],i%11===sample?{status:'pna'}:i%13===sample?{status:'unknown'}:i%17===sample?{status:'na'}:{status:'score',value:r[3]==='yn'?(i+sample)%2:r[5][(i+sample)%r[5].length][0]??(i+sample)%r[5].length}]));
    assert.deepEqual(calculate(answers,translated.FAMILIES,translated.CATEGORY_META),calculate(answers,source.FAMILIES,source.CATEGORY_META));
   }
   for(const high of [false,true]){
    const answers=Object.fromEntries(source.FAMILIES.map(r=>[r[0],{status:'score',value:r[3]==='yn'?Number(high):r[5][high?r[5].length-1:0][0]??(high?r[5].length-1:0)}]));
    const result=calculate(answers,translated.FAMILIES,translated.CATEGORY_META);
    assert.equal(result.score,high?100:-100);assert.equal(displayScore(result.score),high?'O100':'P100');
   }
  }
 });
 test(locale+': results retain original band boundaries, exclusion counts and all five topics',async()=>{
  const results=await import('../'+locale+'/results.js');
  for(const score of [null,-100,-70,-69,-20,-19,0,19,20,69,70,100])for(const group of ['G1','G2','G3','G4']){
   const reading=results.relationship(score,group);assert.equal(reading.key,describeScore(score).key);assert.ok(reading.description&&reading.context);
   for(const key of ['A1','A2','B','C','D']){const topic=results.topic(key,{score},group);assert.equal(topic.key,reading.key);assert.ok(topic.scope&&topic.prompt&&topic.description&&topic.detail);}
  }
  assert.ok(results.scoringDetail({answered:2,total:7},{pna:1,unknown:2,na:1}).includes('7'));
  for(const score of [null,0,100]){
   const result={answered:score===null?0:5,total:10,categories:Object.fromEntries(['A1','A2','B','C','D'].map(k=>[k,{score}]))};
   const pattern=results.pattern(result,full.CATEGORY_META);assert.ok(pattern.title&&pattern.description&&pattern.note);assert.ok(results.coverage(result));
  }
 });
 test(locale+': interface, visitor and accessibility dictionaries cover the source keys',()=>{
  const ui=require('../'+locale+'/ui.js'),visitor=require('../'+locale+'/visitor-text.js');
  for(const key of Object.keys(require('../es/ui.js').TEXT))assert.ok(typeof ui.TEXT[key]==='string'&&ui.TEXT[key].trim(),locale+' UI: '+key);
  for(const key of Object.keys(require('../es/visitor-text.js')))assert.ok(typeof visitor[key]==='string'&&visitor[key].trim(),locale+' visitor: '+key);
  for(const key of ['Language','Switch language','Settings','Prefer not to answer','Keep my answers','Never enter passwords, codes, or personal information.'])assert.notEqual(ui.t(key),key);
  for(const file of ['ui.js','visitor-text.js'])assert.doesNotMatch(read(locale+'/'+file),/MutationObserver|setInterval|requestAnimationFrame|fetch\(/);
 });
 test(locale+': all 19 pages are reproducible, directed, canonical and reciprocally linked',()=>{
  const language=LANGUAGES.find(l=>l.prefix===locale);
  for(const page of TRANSLATED_PAGES){
   const html=read(locale+'/'+page+'.html');assert.equal(html.trimEnd(),buildLanguagePage(locale,page).trimEnd());
   assert.ok(html.includes('<html lang="'+locale+'"'));
   assert.equal(/<html[^>]* dir="rtl"/.test(html),language.dir==='rtl');
   for(const target of LANGUAGES)assert.equal((html.match(new RegExp('hreflang="'+target.code+'"','g'))||[]).length,1);
   assert.ok(html.includes('href="https://www.histi.org'+pathFor(locale,page)+'"'));
   assert.match(html,/connect-src 'none'/);assert.match(html,/form-action 'none'/);
   assert.doesNotMatch(html,/<textarea|type="text"|fonts\.googleapis/);
   assert.match(html,/site-locale-layout\.css/);
   const data=JSON.parse(html.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/)[1]);assert.equal(data.inLanguage,locale);
   assert.ok(read(page+'.html').includes('href="https://www.histi.org'+pathFor(locale,page)+'"'));
  }
 });
}
test('all eight languages round-trip every recipient route without leaking extra query values',()=>{
 assert.equal(LANGUAGES.length,8);
 for(const from of LANGUAGES)for(const to of LANGUAGES)for(const n of ['4','120','60'])for(const g of [1,2,3,4]){
  const page='checkin-'+n+'-g'+g;
  assert.deepEqual(languageTarget(pathFor(from.prefix,page),to.code,'?debug=1&secret=ignore','#section'),{href:pathFor(to.prefix,page)+'?debug=1#section',fallback:false});
 }
});
test('right-to-left presentation keeps numerical slider and score coordinates left-to-right',()=>{
 const css=read('site-locale-layout.css');
 assert.match(css,/html\[dir="rtl"\] :is\(\.h4-segment-control[^}]+direction:ltr/);
 assert.match(css,/\.spectrum-labels/);assert.match(css,/\.category-track/);
 assert.match(read('site-languages.js'),/el\('bdi','histi-language-name'\)/);
 assert.match(read('site-languages.css'),/max-height:min\(42svh,340px\); overflow-y:auto/);
 assert.doesNotMatch(css,/will-change|infinite|url\(/);
});
