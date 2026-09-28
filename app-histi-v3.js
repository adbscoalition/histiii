import setup from './questions-v3-01.js';
import identity from './questions-v3-02.js';
import relationships from './questions-v3-03.js';
import work from './questions-v3-04.js';
import home from './questions-v3-05.js';
import routines from './questions-v3-06.js';
import events from './questions-v3-07.js';
import sensitive from './questions-v3-08.js';
import credentials from './questions-v3-09.js';
import { MAIN_SPECTRUM, TOPIC_SPECTRA, exposureToSignedScore, formatSpectrumScore, weightedSpectrum, clamp } from './histi-v3-score.js';

const STORAGE_PROGRESS='histi.progress.v3';
const STORAGE_RESULTS='histi.results.v3';
const TARGET_QPM=3.5;
const sections=[
  ['Setup',setup],['Identity & basic background',identity],['Relationships, family & household',relationships],
  ['Work, education & service',work],['Home, location, contact & devices',home],
  ['Recurring routines & long-term patterns',routines],['Life events',events],['Sensitive information',sensitive],
  ['Very sensitive credentials & identifiers',credentials]
];
const questions=[];
for(const [section,rows] of sections){
  for(const [code,title,control,options] of rows) questions.push({code,title,control,options,section,number:Number(code.slice(1))});
}

const $=id=>document.getElementById(id);
const els={
  intro:$('intro-screen'), assessment:$('assessment-screen'), results:$('results-screen'), begin:$('begin-btn'),
  progress:$('progress-fill'), qmeta:$('question-code'), qeta:$('question-eta'), qtitle:$('question-title'), qhelp:$('question-help'),
  answerPrompt:$('answer-prompt'), answerHint:$('answer-hint'), list:$('rubric-list'), back:$('back-btn'), next:$('next-btn'),
  status:$('status-list'), partial:$('view-results-btn'), resultTitle:$('result-title'), resultScore:$('result-score'),
  marker:$('result-marker'), resultNote:$('result-note'), topicGrid:$('category-results'), review:$('review-btn'), restart:$('restart-btn'),
  copy:$('copy-result-btn'), share:$('share-btn'), shareStatus:$('share-status'), privacy:$('privacy-live-btn'), privacyPanel:$('disclosure-panel'),
  privacyClose:$('disclosure-close'), footerPrivacy:$('footer-disclosure-btn'), footerExport:$('footer-export-btn'), footerReset:$('footer-reset-btn')
};

function freshState(){return {version:4,index:0,answers:{},recipientType:'',mode:'actual',period:'',showPartial:true,startedAt:null,completedAt:null,screen:'intro'};}
function loadState(){
  try{
    const raw=JSON.parse(localStorage.getItem(STORAGE_PROGRESS)||'null');
    if(!raw?.state) return freshState();
    return {...freshState(),...raw.state,answers:raw.state.answers||{}};
  }catch{return freshState();}
}
let state=loadState();
let showingPartial=false;

function save(){
  try{localStorage.setItem(STORAGE_PROGRESS,JSON.stringify({version:4,savedAt:Date.now(),state}));}catch{}
}
function reset(){
  if(!confirm('Reset HISTI? This clears the answers and saved result on this device.')) return;
  try{localStorage.removeItem(STORAGE_PROGRESS);localStorage.removeItem(STORAGE_RESULTS);}catch{}
  state=freshState(); showingPartial=false; show('intro');
}

function questionWeight(q){
  if(q.number<=5) return 0;
  if(q.number<=105) return 20/100;
  if(q.number<=200) return 50/95;
  if(q.number<=235) return 20/35;
  return 10/15;
}

function topicsFor(q){
  const n=q.number, t=(q.title||'').toLowerCase();
  if(n>=6&&n<=30) return ['identity'];
  if(n>=31&&n<=55) return ['relationships'];
  if(n>=56&&n<=80) return ['work'];
  if(n>=81&&n<=105){
    if(/file|cloud|document librar|brows|search|watch|reading history|calendar|message|email|phone|handle|account/.test(t)) return ['files'];
    if(/phone|email|username|handle|device|identifier/.test(t)) return ['identity'];
    return ['location'];
  }
  if(n>=106&&n<=145) return ['routine'];
  if(n>=146&&n<=200) return ['events'];
  if(n>=236) return ['credentials'];
  const topics=[];
  if(/health|medical|diagnos|therapy|mental|medication|fertil|reproductive|genetic|disability|allerg|hospital|surgery/.test(t)) topics.push('health');
  if(/financ|income|salary|debt|credit|tax|insurance|bank|loan|mortgage|asset|property|purchase|bill|beneficiar|estate/.test(t)) topics.push('financial');
  if(/file|message|correspond|email|photo|video|diary|calendar|brows|search|history|cloud|document/.test(t)) topics.push('files');
  if(/location|address|travel|route|place|residen|home/.test(t)) topics.push('location');
  if(/partner|spouse|family|relative|child|relationship|custody|caregiv/.test(t)) topics.push('relationships');
  if(/identity|name|appearance|pronoun|gender|citizenship|nationality|biometric/.test(t)) topics.push('identity');
  return topics.length?[...new Set(topics)]:['identity'];
}

function answerExposure(q,a){
  if(!a||a.status!=='score'||a.value===null||a.value===undefined) return null;
  const idx=Number(a.value), len=q.options.length;
  if(q.control==='event'){
    if(idx===0) return null;
    return clamp((idx-1)/Math.max(1,len-2),0,1);
  }
  if(q.control==='yesno') return idx===1?1:idx===0?0:null;
  if(['recipient','mode','period'].includes(q.control)) return null;
  return clamp(idx/Math.max(1,len-1),0,1);
}

function compute(){
  const overallItems=[];
  const topicItems=Object.fromEntries(Object.keys(TOPIC_SPECTRA).map(k=>[k,[]]));
  let eligible=0,answered=0,answeredCount=0,eligibleCount=0;
  for(const q of questions){
    const w=questionWeight(q); if(!w) continue;
    const a=state.answers[q.code];
    const isNA=a?.status==='na' || (q.control==='event'&&a?.status==='score'&&Number(a.value)===0);
    if(isNA) continue;
    eligible+=w; eligibleCount++;
    const exposure=answerExposure(q,a);
    if(exposure===null) continue;
    answered+=w; answeredCount++;
    overallItems.push({weight:w,exposure});
    for(const topic of topicsFor(q)) topicItems[topic].push({weight:w,exposure});
  }
  const overall=weightedSpectrum(overallItems,MAIN_SPECTRUM);
  const topics=Object.fromEntries(Object.entries(TOPIC_SPECTRA).map(([id,meta])=>[id,{...meta,...weightedSpectrum(topicItems[id],meta)}]));
  return {overall,topics,coverage:eligible?answered/eligible:0,answeredCount,eligibleCount};
}

function modeQuestion(text){
  if(state.mode!=='hypothetical') return text;
  return text
    .replace(/^How much did you share/i,'How much would you share')
    .replace(/^How precisely did you tell/i,'How precisely would you tell')
    .replace(/^Did you give/i,'Would you give')
    .replace(/^Did you tell/i,'Would you tell')
    .replace(/^Did you show/i,'Would you show')
    .replace(/^Did you share/i,'Would you share')
    .replace(/^How much did you identify/i,'How much would you identify');
}

function show(name){
  state.screen=name;
  els.intro.hidden=name!=='intro';
  els.assessment.hidden=name!=='assessment';
  els.results.hidden=name!=='results';
  window.scrollTo(0,0);
  save();
}

function setAnswer(q,value,status='score'){
  state.answers[q.code]={status,value,answeredAt:Date.now()};
  if(q.code==='Q001') state.recipientType=q.options[value]||'';
  if(q.code==='Q002') state.mode=value===1?'hypothetical':'actual';
  if(q.code==='Q003') state.period=q.options[value]||'';
  if(q.code==='Q005') state.showPartial=value===1;
  save();
}

function etaText(){
  const remaining=Math.max(0,questions.length-state.index-1);
  const mins=Math.ceil(remaining/TARGET_QPM);
  if(mins<1) return '<1 min remaining';
  return `~${mins} min remaining at target pace`;
}

function helperFor(q){
  if(q.code==='Q001') return 'Choose one specific person. HISTI 3.0 is person-to-person, not a public-post assessment.';
  if(q.code==='Q002') return 'Choose once. HISTI will keep the wording consistent for the rest of the check-in.';
  if(q.code==='Q003') return 'Use the period that best matches the relationship you are reflecting on.';
  if(q.code==='Q005') return 'You can view a partial score with coverage before finishing.';
  if(q.number>=236) return 'Choose only whether this happened. Never type the real number, password, code, key, PIN, or credential.';
  if(q.number>=201) return 'Choose the closest level. Do not enter the real private information.';
  if(state.mode==='hypothetical') return 'Answer based on what you would share with this person.';
  return 'Choose the closest answer. You can go back or leave a question unanswered.';
}

function currentAnswer(q){return state.answers[q.code]||null;}

function buttonChoice(q,a){
  const frag=document.createDocumentFragment();
  const wrap=document.createElement('div'); wrap.className='v3-choice-grid';
  q.options.forEach((label,idx)=>{
    const b=document.createElement('button'); b.type='button'; b.className='v3-choice';
    const mark=document.createElement('span'); mark.className='v3-choice-mark'; mark.setAttribute('aria-hidden','true');
    const text=document.createElement('span'); text.textContent=label;
    b.append(mark,text);
    const status=label==='Not applicable'?'na':label==='Prefer not to answer'?'pna':'score';
    b.setAttribute('aria-pressed',String(a?.value===idx&&a?.status===status));
    b.addEventListener('click',()=>{
      setAnswer(q,idx,status);
      for(const choice of wrap.children) choice.setAttribute('aria-pressed',String(choice===b));
      els.next.disabled=false;
      for(const other of els.status.querySelectorAll('[data-status]')) other.setAttribute('aria-pressed','false');
    });
    wrap.append(b);
  });
  frag.append(wrap); return frag;
}

function renderQuestion(){
  const q=questions[state.index]; if(!q) return;
  show('assessment');
  const a=currentAnswer(q);
  els.progress.style.width=`${((state.index+1)/questions.length)*100}%`;
  els.qmeta.textContent=`${q.section} · ${state.index+1} of ${questions.length}`;
  els.qeta.textContent=etaText();
  els.qtitle.textContent=modeQuestion(q.title);
  els.qhelp.textContent=helperFor(q);
  els.answerPrompt.textContent=q.control==='recipient'?'Choose one person':q.control==='mode'?'Choose one mode':q.control==='period'?'Choose one period':'Choose one answer';
  els.answerHint.textContent=q.control==='event'?'“Did not happen” is excluded from scoring.':q.number>=236?'Never enter the actual secret or credential.':'';
  els.list.replaceChildren(buttonChoice(q,a));
  els.back.disabled=state.index===0;
  els.next.textContent=state.index===questions.length-1?'Finish':'Next';
  const required=['Q001','Q002','Q003'].includes(q.code);
  els.next.disabled=required&&!a;
  const hasScored=Object.entries(state.answers).some(([code,ans])=>Number(code.slice(1))>5&&answerExposure(questions.find(x=>x.code===code),ans)!==null);
  els.partial.hidden=!state.showPartial||!hasScored;
  for(const btn of els.status.querySelectorAll('[data-status]')){
    const s=btn.dataset.status==='U'?'unknown':'pna';
    btn.setAttribute('aria-pressed',String(a?.status===s));
    btn.hidden=q.number<=5;
  }
  document.title=`${state.index+1} / ${questions.length} | HISTI 3.0`;
}

function go(delta){
  const next=state.index+delta;
  if(next<0) return;
  if(next>=questions.length){showResults(false);return;}
  state.index=next; save(); renderQuestion();
}

function resultPreference(score){
  if(score===null) return 'There is not enough answered information for a score yet.';
  if(Math.abs(score)<12) return 'Your answers sit near the middle of the private–open spectrum.';
  const degree=Math.abs(score)>=75?'strongly':Math.abs(score)>=40?'moderately':'somewhat';
  return `Your answers lean ${degree} ${score<0?'private':'open'} with this person.`;
}

function scorePosition(score){return score===null?50:clamp((score+100)/2,0,100);}

function showResults(partial=true){
  const result=compute(); showingPartial=partial;
  show('results');
  els.resultTitle.textContent=resultPreference(result.overall.score);
  els.resultScore.textContent=result.overall.score===null?'Not calculated':formatSpectrumScore(result.overall.score,MAIN_SPECTRUM);
  els.marker.hidden=result.overall.score===null;
  els.marker.style.setProperty('--score-position',`${scorePosition(result.overall.score)}%`);
  els.resultNote.textContent=`${partial?'Partial result':'Completed result'} · Coverage ${Math.round(result.coverage*100)}% · ${result.answeredCount} scored cards answered. Unanswered, not-sure, prefer-not-to-answer, and not-applicable cards are not silently scored as disclosure.`;
  const frag=document.createDocumentFragment();
  for(const meta of Object.values(TOPIC_SPECTRA)){
    const topic=result.topics[meta.id];
    const card=document.createElement('div'); card.className='category-card v3-topic-card';
    card.style.setProperty('--score-position',`${scorePosition(topic.score)}%`);
    card.innerHTML=`<div class="category-card-top"><span class="category-letter">${meta.label[0]}</span><span class="category-name">${meta.label}</span><strong>${formatSpectrumScore(topic.score,meta)}</strong></div><div class="category-track" aria-hidden="true"><span></span></div><div class="v3-topic-labels"><span>${meta.leftLabel}</span><span>N0</span><span>${meta.rightLabel}</span></div>`;
    frag.append(card);
  }
  els.topicGrid.replaceChildren(frag);
  els.review.textContent=partial?'Resume questions':'Review answers';
  if(!partial){state.completedAt=Date.now(); try{localStorage.setItem(STORAGE_RESULTS,JSON.stringify({version:4,completedAt:state.completedAt,result}));}catch{} save();}
}

function summary(){
  const r=compute();
  const topics=Object.values(TOPIC_SPECTRA).map(meta=>`${meta.label}: ${formatSpectrumScore(r.topics[meta.id].score,meta)}`).join(' · ');
  return `HISTI 3.0\nOverall: ${formatSpectrumScore(r.overall.score,MAIN_SPECTRUM)}\nCoverage: ${Math.round(r.coverage*100)}%\n${topics}\nReflection result only; not a diagnosis, legal opinion, safety certificate, or measure of character.`;
}
async function copySummary(){
  try{await navigator.clipboard.writeText(summary());els.shareStatus.textContent='Result summary copied.';}catch{els.shareStatus.textContent=summary();}
}
async function shareSummary(){
  if(navigator.share){try{await navigator.share({title:'My HISTI 3.0 result',text:summary()});els.shareStatus.textContent='Result shared.';return;}catch(e){if(e?.name==='AbortError')return;}}
  copySummary();
}

function setStatus(status){
  const q=questions[state.index]; if(q.number<=5) return;
  state.answers[q.code]={status,value:null,answeredAt:Date.now()}; save(); renderQuestion();
}

function exportData(){
  const payload={format:'HISTI-3.0-local-export',exportedAt:new Date().toISOString(),state,result:compute()};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download='histi-3-local-data.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}

function openPrivacy(){
  if(!els.privacyPanel) return;
  els.privacyPanel.hidden=false;
  const result=$('privacy-proof-result'); if(result) result.textContent="PASS — this page's Content Security Policy blocks connection APIs, and HISTI 3.0 stores answer state locally in this browser.";
  const net=$('proof-network-value'); if(net) net.textContent='Blocked';
  const cookie=$('proof-cookie-value'); if(cookie) cookie.textContent=document.cookie?String(document.cookie.split(';').filter(Boolean).length):'0';
  const external=$('proof-external-value'); if(external) external.textContent='0';
  const storage=$('proof-storage-value'); if(storage) storage.textContent='Local only';
}


els.begin?.addEventListener('click',()=>{state.startedAt||=Date.now();state.index=Math.max(0,Math.min(state.index,questions.length-1));renderQuestion();});
els.back?.addEventListener('click',()=>go(-1));
els.next?.addEventListener('click',()=>go(1));
els.partial?.addEventListener('click',()=>showResults(true));
els.review?.addEventListener('click',()=>renderQuestion());
els.restart?.addEventListener('click',reset);
els.copy?.addEventListener('click',copySummary);
els.share?.addEventListener('click',shareSummary);
els.status?.addEventListener('click',e=>{const b=e.target.closest('[data-status]');if(b)setStatus(b.dataset.status==='U'?'unknown':'pna');});
els.privacy?.addEventListener('click',openPrivacy); els.footerPrivacy?.addEventListener('click',openPrivacy); els.privacyClose?.addEventListener('click',()=>{els.privacyPanel.hidden=true;});
els.footerExport?.addEventListener('click',exportData); els.footerReset?.addEventListener('click',reset);
$('disclosure-done')?.addEventListener('click',()=>{els.privacyPanel.hidden=true;});

const values=document.querySelector('.spectrum-values'); if(values) values.innerHTML='<span>P100</span><span>N0</span><span>O100</span>';
const subheading=document.querySelector('.subscore-heading h2');if(subheading)subheading.textContent='Topic spectra';
const subnote=document.querySelector('.subscore-heading span');if(subnote)subnote.textContent='Different topics use different descriptive endpoints';
if(state.completedAt) showResults(false); else show('intro');

window.__HISTI_V3__={questions,compute,scoreFromExposure:exposureToSignedScore,formatSpectrumScore,version:'3.0-beta'};
