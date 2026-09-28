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
const LEVEL_CONTROLS=new Set(['familiarity','agreement','disclosure','location','access','routine','sensitive','event']);
const BOUNDARIES={
  106:{from:'A',to:'B',level:'caution',title:'The next section gets more personal.',copy:'The following questions cover routines and life events. Continue at your own pace; choose descriptions only and keep the real details to yourself.'},
  201:{from:'B',to:'C',level:'warning',title:'You’re about to be asked about sensitive information.',copy:'These questions cover health, finances, private records, and other personal subjects. Only choose a level; never enter, paste, or repeat the real information.',skippable:true,end:235},
  236:{from:'C',to:'D',level:'warning-strong',title:'You’re about to be asked about very sensitive information.',copy:'These questions ask only whether you shared credentials or identifiers. Never enter an actual password, PIN, code, account number, key, or document content.',skippable:true,end:250}
};
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
const questionsByCode=new Map(questions.map(q=>[q.code,q]));

const $=id=>document.getElementById(id);
const els={
  intro:$('intro-screen'), boundary:$('boundary-screen'), assessment:$('assessment-screen'), results:$('results-screen'), begin:$('begin-btn'),
  progress:$('progress-fill'), qmeta:$('question-code'), qeta:$('question-eta'), qtitle:$('question-title'), qhelp:$('question-help'),
  answerPrompt:$('answer-prompt'), answerHint:$('answer-hint'), list:$('rubric-list'), back:$('back-btn'), next:$('next-btn'),
  status:$('status-list'), partial:$('view-results-btn'), risk:$('risk-note'), riskTitle:$('risk-title'), riskText:$('risk-text'),
  boundaryCard:$('boundary-card'), boundaryLevel:$('boundary-level'), boundaryRoute:$('boundary-route'), boundaryTitle:$('boundary-title'), boundaryCopy:$('boundary-copy'), boundarySkipRight:$('boundary-skip-right'), boundaryBack:$('boundary-back'), boundarySkip:$('boundary-skip'), boundaryContinue:$('boundary-continue'),
  skipDialog:$('section-skip-dialog'), skipCategory:$('section-skip-category'), skipReasons:$('section-skip-dialog'), skipBack:$('section-skip-back'), skipConfirm:$('section-skip-confirm'),
  resultTitle:$('result-title'), resultScore:$('result-score'), resultWarning:$('result-warning-card'), resultWarningTitle:$('result-warning-title'), resultWarningText:$('result-warning-text'),
  marker:$('result-marker'), resultNote:$('result-note'), topicGrid:$('category-results'), review:$('review-btn'), restart:$('restart-btn'),
  copy:$('copy-result-btn'), share:$('share-btn'), shareStatus:$('share-status'), privacy:$('privacy-live-btn'), privacyPanel:$('disclosure-panel'),
  privacyClose:$('disclosure-close'), footerPrivacy:$('footer-disclosure-btn'), footerExport:$('footer-export-btn'), footerReset:$('footer-reset-btn')
};

function freshState(){return {version:5,index:0,answers:{},recipientType:'',mode:'actual',period:'',showPartial:true,startedAt:null,completedAt:null,screen:'intro',boundarySeen:{},pendingBoundary:null,sectionSkips:{}};}
function loadState(){
  try{
    const raw=JSON.parse(localStorage.getItem(STORAGE_PROGRESS)||'null');
    if(!raw?.state) return freshState();
    return {...freshState(),...raw.state,answers:raw.state.answers||{},boundarySeen:raw.state.boundarySeen||{},sectionSkips:raw.state.sectionSkips||{}};
  }catch{return freshState();}
}
let state=loadState();
let showingPartial=false;

function save(){
  try{localStorage.setItem(STORAGE_PROGRESS,JSON.stringify({version:5,savedAt:Date.now(),state}));}catch{}
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
    if((q.number>=201&&q.number<=235&&state.sectionSkips.C)||(q.number>=236&&state.sectionSkips.D)) continue;
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

function show(name,scroll=true){
  state.screen=name;
  els.intro.hidden=name!=='intro';
  els.boundary.hidden=name!=='boundary';
  els.assessment.hidden=name!=='assessment';
  els.results.hidden=name!=='results';
  if(scroll) window.scrollTo(0,0);
  save();
}

function setAnswer(q,value,status='score'){
  state.answers[q.code]={status,value,answeredAt:Date.now()};
  if(q.number>=201&&q.number<=235) delete state.sectionSkips.C;
  if(q.number>=236) delete state.sectionSkips.D;
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
  if(q.code==='Q004') return 'Choose the closest level, or continue without answering.';
  if(q.code==='Q005') return 'You can view a partial score with coverage before finishing.';
  if(q.number>=236) return 'Choose only whether this happened. Never type the real number, password, code, key, PIN, or credential.';
  if(q.number>=201) return 'Choose the closest level. Do not enter the real private information.';
  if(state.mode==='hypothetical') return 'Answer based on what you would share with this person.';
  return 'Choose the closest answer. You can go back or leave a question unanswered.';
}

function currentAnswer(q){return state.answers[q.code]||null;}

function clearOtherAnswers(){
  for(const other of els.status.querySelectorAll('[data-status]')) other.setAttribute('aria-pressed','false');
}

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
      clearOtherAnswers();
    });
    wrap.append(b);
  });
  frag.append(wrap); return frag;
}

function sliderChoice(q,a){
  const isEvent=q.control==='event';
  const offset=isEvent?1:0;
  const selected=a?.status==='score'&&a.value!==null&&a.value!==undefined&&Number.isInteger(Number(a.value))&&Number(a.value)>=offset&&Number(a.value)<q.options.length;
  const wrap=document.createElement('div'); wrap.className='v3-level-wrap';
  if(isEvent){
    const na=document.createElement('button'); na.type='button'; na.className='v3-event-na'; na.textContent=q.options[0];
    na.setAttribute('aria-pressed',String(a?.status==='na'||(a?.status==='score'&&Number(a.value)===0)));
    na.addEventListener('click',()=>{setAnswer(q,0,'na');renderQuestion(false);});
    wrap.append(na);
  }
  const level=document.createElement('div'); level.className='v3-level-value'; level.setAttribute('aria-live','polite');
  const caption=document.createElement('span'); caption.className='v3-level-caption';
  const value=document.createElement('strong'); value.className='v3-level-answer';
  level.append(caption,value);
  const input=document.createElement('input'); input.className='v3-level-slider'; input.type='range'; input.min='0'; input.max=String(q.options.length-1-offset); input.step='1';
  input.value=String(selected?Number(a.value)-offset:2);
  input.setAttribute('aria-label',isEvent?'How much you shared about this event':q.control==='familiarity'?'How well this person knows you':q.control==='agreement'?'Agreement level':'Level of sharing');
  const endpoints=document.createElement('div'); endpoints.className='v3-level-endpoints';
  const first=document.createElement('span'); first.textContent=q.options[offset];
  const last=document.createElement('span'); last.textContent=q.options.at(-1);
  endpoints.append(first,last);
  const steps=document.createElement('div'); steps.className='v3-level-steps'; steps.setAttribute('aria-hidden','true');
  for(let i=offset;i<q.options.length;i++){const tick=document.createElement('span'); tick.textContent=String(i-offset+1); steps.append(tick);}
  function update(active){
    const idx=Number(input.value);
    caption.textContent=active?`Level ${idx+1} of ${q.options.length-offset}`:'No level selected';
    value.textContent=active?q.options[idx+offset]:'Move the slider to choose a level';
    input.setAttribute('aria-valuetext',active?q.options[idx+offset]:'No level selected');
    wrap.classList.toggle('is-unanswered',!active);
    input.style.setProperty('--level-fill',active?`${idx/(q.options.length-1-offset)*100}%`:'0%');
  }
  function commit(){
    const idx=Number(input.value)+offset;
    if(currentAnswer(q)?.status==='score'&&Number(currentAnswer(q).value)===idx) return;
    setAnswer(q,idx,'score'); update(true); els.next.disabled=false; clearOtherAnswers();
    if(isEvent) wrap.querySelector('.v3-event-na')?.setAttribute('aria-pressed','false');
  }
  input.addEventListener('input',()=>update(true));
  input.addEventListener('change',commit);
  input.addEventListener('click',commit);
  input.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();commit();}});
  update(selected);
  wrap.append(level,input,steps,endpoints);
  return wrap;
}

function renderQuestion(scroll=true){
  const q=questions[state.index]; if(!q) return;
  show('assessment',scroll);
  const a=currentAnswer(q);
  els.progress.style.width=`${((state.index+1)/questions.length)*100}%`;
  els.qmeta.textContent=`${q.section} · ${state.index+1} of ${questions.length}`;
  els.qeta.textContent=etaText();
  els.qtitle.textContent=modeQuestion(q.title);
  els.qhelp.textContent=helperFor(q);
  els.risk.hidden=q.number<201;
  if(q.number>=201){
    els.risk.classList.toggle('risk-critical',q.number>=236);
    els.riskTitle.textContent=q.number>=236?'Never enter the actual sensitive value':'Keep the real personal details private';
    els.riskText.textContent=q.number>=236?'Choose an answer only. Never type a password, code, ID number, account number, key, PIN, or document content.':'Choose a level only. Never type or paste medical, financial, legal, location, or other real private information.';
  }
  els.answerPrompt.textContent=q.control==='recipient'?'Choose one person':q.control==='mode'?'Choose one mode':q.control==='period'?'Choose one period':LEVEL_CONTROLS.has(q.control)?'Choose the closest level':'Choose one answer';
  els.answerHint.textContent=q.control==='event'?'“Did not happen” is excluded from scoring.':'';
  els.list.replaceChildren(LEVEL_CONTROLS.has(q.control)?sliderChoice(q,a):buttonChoice(q,a));
  els.back.disabled=state.index===0;
  els.next.textContent=state.index===questions.length-1?'Finish':'Next';
  const required=['Q001','Q002','Q003'].includes(q.code);
  els.next.disabled=required&&!a;
  const hasScored=Object.entries(state.answers).some(([code,ans])=>{const candidate=questionsByCode.get(code);return candidate?.number>5&&answerExposure(candidate,ans)!==null;});
  els.partial.hidden=!state.showPartial||!hasScored;
  const statusAllowed=q.number>5||q.number===4;
  els.status.hidden=!statusAllowed;
  for(const btn of els.status.querySelectorAll('[data-status]')){
    const s=btn.dataset.status==='U'?'unknown':btn.dataset.status==='NA'?'na':'pna';
    btn.setAttribute('aria-pressed',String(a?.status===s));
    btn.hidden=!statusAllowed||(s==='na'&&(q.number===4||q.control==='event'||q.options.includes('Not applicable')))||(s==='pna'&&q.options.includes('Prefer not to answer'));
  }
  document.title=`${state.index+1} / ${questions.length} | HISTI 3.0`;
}

function openBoundary(target){
  const config=BOUNDARIES[target];
  if(!config||state.boundarySeen[target]) return false;
  state.pendingBoundary=target;
  els.boundaryCard.dataset.level=config.level;
  els.boundaryLevel.textContent=config.level==='caution'?'Caution':'Warning';
  els.boundaryRoute.textContent=`${config.from} → ${config.to}`;
  els.boundaryTitle.textContent=config.title;
  els.boundaryCopy.textContent=config.copy;
  els.boundarySkip.hidden=!config.skippable;
  els.boundarySkipRight.hidden=!config.skippable;
  show('boundary');
  return true;
}

function continueBoundary(){
  const target=state.pendingBoundary;
  if(!BOUNDARIES[target]) return;
  state.boundarySeen[target]=true;
  state.pendingBoundary=null;
  state.index=target-1;
  renderQuestion();
}

function skipBoundarySection(){
  const target=state.pendingBoundary;
  const config=BOUNDARIES[target];
  const reason=els.skipReasons.querySelector('input[name="section-skip-reason"]:checked')?.value;
  if(!config?.skippable||!['uncomfortable','refuse'].includes(reason)) return;
  state.sectionSkips[config.to]=reason;
  state.boundarySeen[target]=true;
  for(let n=target;n<=config.end;n++) delete state.answers[`Q${String(n).padStart(3,'0')}`];
  state.pendingBoundary=null;
  els.skipDialog.hidden=true;
  if(config.to==='C'){
    if(openBoundary(236)) return;
    state.index=235;
    renderQuestion();
  }else{
    state.index=questions.length-1;
    showResults(false);
  }
}

function go(delta){
  let next=state.index+delta;
  if(next<0) return;
  if(delta>0&&state.sectionSkips.C&&next>=200&&next<=234) next=235;
  if(delta>0&&state.sectionSkips.D&&next>=235){showResults(false);return;}
  if(next>=questions.length){showResults(false);return;}
  if(delta>0&&openBoundary(next+1)) return;
  state.index=next; save(); renderQuestion();
}

function resultPreference(score){
  if(score===null) return 'There is not enough answered information for a score yet.';
  if(Math.abs(score)<12) return 'Your answers sit near the middle of the private–open spectrum.';
  const degree=Math.abs(score)>=75?'strongly':Math.abs(score)>=40?'moderately':'somewhat';
  return `Your answers lean ${degree} ${score<0?'private':'open'} with this person.`;
}

function scorePosition(score){return score===null?50:clamp((score+100)/2,0,100);}
function coverageText(coverage){return coverage>0&&coverage<.01?'<1%':`${Math.round(coverage*100)}%`;}

function showResults(partial=true){
  const result=compute(); showingPartial=partial;
  show('results');
  els.resultTitle.textContent=resultPreference(result.overall.score);
  els.resultScore.textContent=result.overall.score===null?'Not calculated':formatSpectrumScore(result.overall.score,MAIN_SPECTRUM);
  els.marker.hidden=result.overall.score===null;
  els.marker.style.setProperty('--score-position',`${scorePosition(result.overall.score)}%`);
  const skipped=Object.keys(state.sectionSkips).filter(k=>['C','D'].includes(k));
  els.resultNote.textContent=`${partial?'Partial result':'Completed result'} · Coverage ${coverageText(result.coverage)} · ${result.answeredCount} scored cards answered. Unanswered, not-sure, prefer-not-to-answer, and not-applicable cards are not silently scored as disclosure.${skipped.length?` Skipped section${skipped.length>1?'s':''} ${skipped.join(' and ')} excluded from calculation.`:''}`;
  const frag=document.createDocumentFragment();
  for(const meta of Object.values(TOPIC_SPECTRA)){
    const topic=result.topics[meta.id];
    const card=document.createElement('div'); card.className='category-card v3-topic-card';
    card.style.setProperty('--score-position',`${scorePosition(topic.score)}%`);
    card.innerHTML=`<div class="category-card-top"><span class="category-letter">${meta.label[0]}</span><span class="category-name">${meta.label}</span><strong>${formatSpectrumScore(topic.score,meta)}</strong></div><div class="category-track" aria-hidden="true"><span></span></div><div class="v3-topic-labels"><span>${meta.leftLabel}</span><span>N0</span><span>${meta.rightLabel}</span></div>`;
    frag.append(card);
  }
  els.topicGrid.replaceChildren(frag);
  const dAnswers=questions.filter(q=>q.number>=236).map(q=>answerExposure(q,state.answers[q.code])).filter(x=>x!==null);
  const dShared=dAnswers.some(x=>x>0);
  els.resultWarning.classList.toggle('is-caution',dShared);
  els.resultWarningTitle.textContent=dShared?'Review very sensitive sharing':'A note about very sensitive information';
  els.resultWarningText.textContent=dShared?'At least one answer indicates a credential or identifier was shared. This is a prompt to review, not a judgment that any disclosure was safe or unsafe. Keep real values private.':dAnswers.length?'Your answers did not indicate sharing in this section. That does not certify any specific situation as safe; context still matters.':'This section was skipped or has no scored answers, so HISTI cannot make a comparison about very sensitive information.';
  els.review.textContent=partial?'Resume questions':'Review answers';
  if(!partial){state.completedAt=Date.now(); try{localStorage.setItem(STORAGE_RESULTS,JSON.stringify({version:5,completedAt:state.completedAt,result}));}catch{} save();}
}

function summary(){
  const r=compute();
  const topics=Object.values(TOPIC_SPECTRA).map(meta=>`${meta.label}: ${formatSpectrumScore(r.topics[meta.id].score,meta)}`).join(' · ');
  const skipped=Object.keys(state.sectionSkips).filter(k=>['C','D'].includes(k));
  return `HISTI 3.0\nOverall: ${formatSpectrumScore(r.overall.score,MAIN_SPECTRUM)}\nCoverage: ${coverageText(r.coverage)}${skipped.length?` (skipped ${skipped.join(' and ')} excluded)`:''}\n${topics}\nReflection result only; not a diagnosis, legal opinion, safety certificate, or measure of character.`;
}
async function copySummary(){
  try{await navigator.clipboard.writeText(summary());els.shareStatus.textContent='Result summary copied.';}catch{els.shareStatus.textContent=summary();}
}
async function shareSummary(){
  if(navigator.share){try{await navigator.share({title:'My HISTI 3.0 result',text:summary()});els.shareStatus.textContent='Result shared.';return;}catch(e){if(e?.name==='AbortError')return;}}
  copySummary();
}

function setStatus(status){
  const q=questions[state.index]; if(q.number<=5&&q.number!==4) return;
  setAnswer(q,null,status); renderQuestion(false);
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
els.review?.addEventListener('click',()=>{state.completedAt=null;renderQuestion();});
els.restart?.addEventListener('click',reset);
els.copy?.addEventListener('click',copySummary);
els.share?.addEventListener('click',shareSummary);
els.status?.addEventListener('click',e=>{const b=e.target.closest('[data-status]');if(b)setStatus(b.dataset.status==='U'?'unknown':b.dataset.status==='NA'?'na':'pna');});
els.boundaryBack?.addEventListener('click',()=>{state.pendingBoundary=null;renderQuestion();});
els.boundaryContinue?.addEventListener('click',continueBoundary);
els.boundarySkip?.addEventListener('click',()=>{const config=BOUNDARIES[state.pendingBoundary];if(!config?.skippable)return;els.skipCategory.textContent=config.to;for(const input of els.skipReasons.querySelectorAll('input[name="section-skip-reason"]'))input.checked=false;els.skipConfirm.disabled=true;els.skipDialog.hidden=false;});
els.skipReasons?.addEventListener('change',()=>{els.skipConfirm.disabled=!els.skipReasons.querySelector('input[name="section-skip-reason"]:checked');});
els.skipBack?.addEventListener('click',()=>{els.skipDialog.hidden=true;});
els.skipConfirm?.addEventListener('click',skipBoundarySection);
els.privacy?.addEventListener('click',openPrivacy); els.footerPrivacy?.addEventListener('click',openPrivacy); els.privacyClose?.addEventListener('click',()=>{els.privacyPanel.hidden=true;});
els.footerExport?.addEventListener('click',exportData); els.footerReset?.addEventListener('click',reset);
$('disclosure-done')?.addEventListener('click',()=>{els.privacyPanel.hidden=true;});

const values=document.querySelector('.spectrum-values'); if(values) values.innerHTML='<span>P100</span><span>N0</span><span>O100</span>';
const subheading=document.querySelector('.subscore-heading h2');if(subheading)subheading.textContent='Topic spectra';
const subnote=document.querySelector('.subscore-heading span');if(subnote)subnote.textContent='Different topics use different descriptive endpoints';
state.index=Math.max(0,Math.min(Number(state.index)||0,questions.length-1));
if(state.completedAt) showResults(false);
else if(state.screen==='boundary'&&BOUNDARIES[state.pendingBoundary]){if(!openBoundary(state.pendingBoundary)) renderQuestion();}
else if(state.startedAt&&state.screen==='assessment') renderQuestion();
else if(state.startedAt&&state.screen==='results') showResults(true);
else show('intro');

window.__HISTI_V3__={questions,compute,scoreFromExposure:exposureToSignedScore,formatSpectrumScore,version:'3.0-beta'};
