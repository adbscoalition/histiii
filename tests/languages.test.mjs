import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import * as full from '../histi4-data.js';
import * as medium from '../histi120-family-data.js';
import * as short from '../histi60-family-data.js';
import {localizeDataset,SHARING} from '../es/data.js';
import {relationship,topic,scoringDetail,shorten} from '../es/results.js';
import {calculate,makeSlides,rubricPoints} from '../histi4-core.js';
import {describeScore} from '../histi4-results.js';
import {LANGUAGES,languageTarget} from '../site-languages.js';
import {buildLanguagePage,TRANSLATED_PAGES,pathFor} from '../scripts/build-language-pages.mjs';
const require=createRequire(import.meta.url),read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
for(const [format,source,count] of [['full',full,245],['120',medium,120],['60',short,60]]){
 test('Spanish '+format+' preserves every scoring field, card and result across mixed answers',()=>{
  const translated=localizeDataset(source,format);assert.equal(translated.FAMILIES.length,count);
  source.FAMILIES.forEach((row,i)=>{
   const tr=translated.FAMILIES[i];
   assert.deepEqual([tr[0],tr[3],tr[4],tr[5].map(a=>[a[0],a[2]])],[row[0],row[3],row[4],row[5].map(a=>[a[0],a[2]])]);
   assert.notEqual(tr[1],row[1],row[0]);assert.notEqual(tr[2],row[2],row[0]);
   if(format!=='full'){assert.equal(tr[6].length,4);tr[6].forEach((text,g)=>assert.notEqual(text,row[6][g]));}
   row[5].forEach((anchor,n)=>assert.equal(rubricPoints(row,anchor[0]??n),rubricPoints(tr,anchor[0]??n)));
  });
  assert.deepEqual(makeSlides(translated.FAMILIES).map(s=>s.questions.map(r=>r[0])),makeSlides(source.FAMILIES).map(s=>s.questions.map(r=>r[0])));
  for(const key of Object.keys(source.CATEGORY_META))assert.deepEqual({...translated.CATEGORY_META[key],label:source.CATEGORY_META[key].label},source.CATEGORY_META[key]);
  for(let sample=0;sample<16;sample++){
   const answers=Object.fromEntries(source.FAMILIES.map((r,i)=>[r[0],i%11===sample?{status:'pna'}:i%13===sample?{status:'unknown'}:i%17===sample?{status:'na'}:{status:'score',value:r[3]==='yn'?(i+sample)%2:r[5][(i+sample)%r[5].length][0]??(i+sample)%r[5].length}]));
   assert.deepEqual(calculate(answers,translated.FAMILIES,translated.CATEGORY_META),calculate(answers,source.FAMILIES,source.CATEGORY_META));
  }
 });
}
test('Spanish results keep the original bands and exclusion rules',()=>{
 for(const score of [null,-100,-70,-69,-20,-19,0,19,20,69,70,100])for(const group of Object.keys(SHARING)){
  const reading=relationship(score,group);assert.equal(reading.key,describeScore(score).key);
  for(const key of ['A1','A2','B','C','D'])assert.equal(topic(key,{score},group).key,reading.key);
 }
 assert.match(scoringDetail({answered:2,total:7},{pna:1,unknown:2,na:1}),/2 de 7/);
 assert.equal(shorten('Primera frase. Otra explicación.'),'Primera frase.');
});
test('language switching preserves the page, form, recipient, supported debug flag and anchor',()=>{
 for(const language of LANGUAGES)for(const form of ['4','120','60'])for(const group of [1,2,3,4]){
  const page='checkin-'+form+'-g'+group;
  assert.equal(languageTarget('/zh/'+page,language.code,'?debug=1&ignore=1').href,pathFor(language.prefix,page)+'?debug=1');
 }
 assert.deepEqual(languageTarget('/es/','en','','#about'),{href:'/#about',fallback:false});
 assert.deepEqual(languageTarget('/privacy.html','zh-CN','','#delete-data'),{href:'/zh/privacy#delete-data',fallback:false});
 assert.deepEqual(languageTarget('/checkin-school-high-g3','es','?debug=1','#x'),{href:'/es/checkin-page',fallback:true});
 assert.deepEqual(languageTarget('/checkin-school-high-g3','en'),{href:'/checkin-school-high-g3',fallback:false});
});
test('all translated visitor and test pages are generated, linked and use no external runtime',()=>{
 assert.equal(TRANSLATED_PAGES.length,19);
 for(const locale of ['zh','es'])for(const page of TRANSLATED_PAGES){
  const html=read(locale+'/'+page+'.html');assert.equal(html.trimEnd(),buildLanguagePage(locale,page).trimEnd());
  assert.match(html,/site-languages\.css/);assert.match(html,/site-languages\.js/);
  assert.doesNotMatch(html,/data-language-switch|For AI:|<textarea|type="text"/);
  if(locale==='es')assert.doesNotMatch(html,/zh\/typography|kaiti|fonts\.googleapis/);
  const data=JSON.parse(html.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/)[1]);
  assert.equal(data.inLanguage,locale==='zh'?'zh-CN':'es');
 }
});
test('visitor translations cover every visible text segment and reading/accessibility label',()=>{
 const technical=/^(HISTI(?:-Extended|-120|-60)?|CC BY-ND 4\.0|www\.histi\.org|localStorage|sessionStorage|histi\.preferences\.v1|connect-src 'none'|form-action 'none'|Check-ins)$/;
 for(const locale of ['zh','es']){
  const {t}=require('../'+locale+'/ui.js'),copy=require('../'+locale+'/visitor-text.js');
  for(const page of ['index','privacy','terms']){
   const body=read(page+'.html').split('</head>')[1];
   for(const m of [...body.matchAll(/>([^<>]+)</g),...body.matchAll(/(?:aria-label|title|data-reading-simple)="([^"]+)"/g)]){
    const s=m[1].trim().replaceAll('&amp;','&');if(!/[A-Za-z]{3}/.test(s)||technical.test(s))continue;
    assert.ok(copy[s]||t(s)!==s,locale+' '+page+': '+s);
   }
  }
 }
});
test('language UI is bounded, local-only, accessible and pauses for performance/reduced motion',()=>{
 const js=read('site-languages.js'),css=read('site-languages.css');
 assert.doesNotMatch(js,/setInterval|setTimeout|requestAnimationFrame|MutationObserver|fetch\(|localStorage|sessionStorage|innerHTML/);
 assert.match(js,/type='radio'/);assert.match(js,/if\(document\.getElementById\('histi-language-btn'\)\)return/);
 assert.match(css,/data-performance="on"/);assert.match(css,/prefers-reduced-motion:reduce/);assert.match(css,/width:66px/);
 assert.match(read('site-settings.js'),/document\.querySelector\('\.histi-utility-dock'\)\?\.append\(trigger\)/);
 for(const l of ['zh','es'])for(const text of ['Language','Switch language','Settings','Prefer not to answer','Keep my answers'])assert.notEqual(require('../'+l+'/ui.js').t(text),text);
 assert.match(read('fonts/noto-sans-sc/OFL.txt'),/SIL OPEN FONT LICENSE/);
 assert.match(read('fonts/noto-sans-sc/README.md'),/67bc647ce1910e92f461bcc82aae30f21d21a9cc/);
});
test('selector motion and time recommendations are translated without the visitor-page dictionary',()=>{
 for(const locale of ['zh','es']){
  const {t}=require('../'+locale+'/ui.js');
  for(const copy of ["Pause motion","Reduced motion","Motion paused","60 questions · about 10–15 minutes. You can still take breaks.","120 questions · about 20–25 minutes. There’s no need to rush.","245 questions · about 40–50 minutes. You don’t have to finish in one sitting.","Explore HISTI Full","Explore HISTI-120","Explore HISTI-60"])assert.notEqual(t(copy),copy,locale+': '+copy);
 }
});
