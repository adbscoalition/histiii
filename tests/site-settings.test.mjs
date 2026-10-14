import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import settings from '../site-settings.js';
import { plainOverall, plainTopic, plainPattern, plainRecipient } from '../histi-plain-reading.js';
import { describeRelationship } from '../histi4-results.js';
import { calculate } from '../histi4-core.js';
import { CATEGORY_META, FAMILIES } from '../histi4-data.js';
import { CATEGORY_META as SCHOOL_META } from '../histi-school-data.js';
const { DEFAULTS, STORAGE_KEY, normalizePreferences } = settings;
const read = file => readFileSync(new URL(`../${file}`,import.meta.url),'utf8');

test('preferences accept only the four supported fields and reject corrupt values',()=>{
  for(const value of [null,undefined,42,[],{reading:'advanced',contrast:'red',textSize:999,performance:'false'}]) assert.deepEqual(normalizePreferences(value),DEFAULTS);
  assert.deepEqual(normalizePreferences({reading:'simple',contrast:'high',textSize:'largest',performance:true,answers:{secret:'not a preference'}}),{reading:'simple',contrast:'high',textSize:'largest',performance:true});
  assert.equal(Object.keys(normalizePreferences({})).length,4);
  assert.ok(Object.isFrozen(DEFAULTS));
});

class Element {
  constructor(tag,doc) {this.tagName=tag.toUpperCase();this.doc=doc;this.dataset={};this.attributes={};this.children=[];this.listeners={};this.text='';this.open=false;this.classes=new Set();this.classList={add:name=>this.classes.add(name)};}
  set textContent(value) {this.text=value;this.children=[];}
  get textContent() {return this.text+this.children.map(n=>n.textContent).join('');}
  append(...nodes) {for(const n of nodes){n.parentElement=this;this.children.push(n);}}
  setAttribute(name,value) {this.attributes[name]=String(value);}
  hasAttribute(name) {return name in this.attributes || name==='data-reading-standard'&&'readingStandard' in this.dataset;}
  addEventListener(type,fn) {(this.listeners[type] ||= []).push(fn);}
  emit(type,event={}) {for(const fn of this.listeners[type]||[])fn({target:this,...event});}
  all() {return [this,...this.children.flatMap(n=>n.all())];}
  querySelector(selector) {return this.all().find(n=>selector==='[data-performance-label]'&&'performanceLabel' in n.dataset) || null;}
  closest(selector) {return selector==='button[data-setting]'&&this.tagName==='BUTTON'&&this.dataset.setting ? this : this.parentElement?.closest(selector)||null;}
  focus() {this.doc.activeElement=this;}
  showModal() {this.open=true;}
  close() {this.open=false;this.emit('close');}
  getBoundingClientRect() {return {left:0,right:300,top:0,bottom:600};}
}
function fixture({stored=null,blocked=false}={}) {
  const listeners={},windowListeners={},storage=new Map(),writes=[];let cancelled=0;
  if(stored!==null)storage.set(STORAGE_KEY,stored);
  storage.set('histi.four-groups.G1.v1','synthetic check-in progress');
  const doc={readyState:'loading',hidden:false,documentElement:{dataset:{}},addEventListener:(type,fn)=>{(listeners[type] ||= []).push(fn);},dispatchEvent:event=>{for(const fn of listeners[event.type]||[])fn(event);},createElement:tag=>new Element(tag,doc),createElementNS:(_,tag)=>new Element(tag,doc),getAnimations:()=>[{cancel(){cancelled++;}}]};
  doc.body=new Element('body',doc);
  const copy=new Element('p',doc);copy.dataset.readingSimple='Short words.';copy.textContent='A longer explanation.';doc.body.append(copy);
  doc.querySelectorAll=selector=>selector==='[data-reading-simple]'?doc.body.all().filter(n=>'readingSimple' in n.dataset):[];
  doc.querySelector=selector=>selector==='dialog[open]'?doc.body.all().find(n=>n.tagName==='DIALOG'&&n.open)||null:null;
  doc.getElementById=id=>doc.body.all().find(n=>n.id===id)||null;
  const host={localStorage:{getItem:key=>{if(blocked)throw Error('Blocked');return storage.get(key)||null;},setItem:(key,value)=>{if(blocked)throw Error('Blocked');writes.push([key,value]);storage.set(key,value);},removeItem:key=>{if(blocked)throw Error('Blocked');storage.delete(key);}},addEventListener:(type,fn)=>{(windowListeners[type] ||= []).push(fn);}};
  const context={document:doc,window:host,CustomEvent:class {constructor(type,options){this.type=type;this.detail=options.detail;}}};
  const run=()=>runInNewContext(read('site-settings.js'),context);
  const ready=()=>{doc.readyState='complete';doc.dispatchEvent({type:'DOMContentLoaded'});};
  const choose=(key,value)=>{const button=doc.body.all().find(n=>n.dataset.setting===key&&n.dataset.value===value);assert.ok(button);doc.getElementById('histi-settings-dialog').emit('click',{target:button});};
  run();
  return {doc,host,copy,storage,writes,listeners,windowListeners,run,ready,choose,cancelled:()=>cancelled};
}

test('saved settings apply before DOM-ready, then the controls mirror them',()=>{
  const f=fixture({stored:JSON.stringify({reading:'simple',contrast:'high',textSize:'largest',performance:true})});
  assert.equal(f.doc.documentElement.dataset.performance,'on');
  assert.equal(f.doc.documentElement.dataset.reading,'simple');
  assert.equal(f.doc.getElementById('histi-settings-btn'),null);
  f.ready();assert.equal(f.copy.textContent,'Short words.');
  assert.equal(f.doc.getElementById('settings-performance').attributes['aria-checked'],'true');
  assert.ok(f.cancelled()>0);
  assert.equal(f.writes.length,0,'loading saved preferences does not rewrite storage');
});

test('repeated opens, changes, and resets reuse one panel and never touch answers',()=>{
  const f=fixture();f.ready();const count=f.doc.body.all().length;
  for(let i=0;i<100;i++){f.run();f.doc.getElementById('histi-settings-btn').emit('click');assert.equal(f.doc.getElementById('histi-settings-dialog').open,true);f.doc.getElementById('histi-settings-dialog').close();}
  assert.equal(f.doc.body.all().length,count);
  assert.equal(f.windowListeners.storage.length,1);assert.equal(f.listeners.DOMContentLoaded.length,1);
  f.choose('reading','simple');assert.equal(f.copy.textContent,'Short words.');
  f.choose('reading','standard');assert.equal(f.copy.textContent,'A longer explanation.');
  f.choose('contrast','high');f.choose('textSize','largest');
  f.doc.getElementById('settings-performance').emit('click');assert.equal(f.doc.documentElement.dataset.performance,'on');
  const before=f.writes.length;f.choose('textSize','largest');assert.equal(f.writes.length,before,'unchanged selection is a no-op');
  assert.ok(f.writes.every(([key,value])=>key===STORAGE_KEY&&Object.keys(JSON.parse(value)).length===4));
  f.doc.body.all().find(n=>n.className==='histi-settings-reset').emit('click');
  assert.equal(f.storage.get('histi.four-groups.G1.v1'),'synthetic check-in progress');
  assert.equal(f.storage.has(STORAGE_KEY),false);assert.equal(f.doc.documentElement.dataset.performance,'off');
  assert.match(f.doc.body.all().find(n=>n.className==='histi-settings-status').textContent,/answers are unchanged/);
});

test('storage failures still allow local changes; cross-tab updates do not write answers or echo writes',()=>{
  const blocked=fixture({blocked:true});blocked.ready();blocked.choose('contrast','high');
  assert.equal(blocked.doc.documentElement.dataset.contrast,'high');
  assert.match(blocked.doc.body.all().find(n=>n.className==='histi-settings-status').textContent,/did not allow saving/);
  const f=fixture();f.ready();
  f.windowListeners.storage[0]({key:STORAGE_KEY,newValue:JSON.stringify({reading:'simple',performance:true})});
  assert.equal(f.doc.documentElement.dataset.performance,'on');assert.equal(f.copy.textContent,'Short words.');assert.equal(f.writes.length,0);
  f.windowListeners.storage[0]({key:'histi.four-groups.G1.v1',newValue:'something unrelated'});
  assert.equal(f.doc.documentElement.dataset.performance,'on');
  f.windowListeners.storage[0]({key:STORAGE_KEY,newValue:'broken json'});assert.equal(f.doc.documentElement.dataset.performance,'off');
  f.storage.set(STORAGE_KEY,JSON.stringify({reading:'simple',performance:true}));
  f.windowListeners.pageshow[0]({persisted:false});assert.equal(f.doc.documentElement.dataset.performance,'off');
  f.windowListeners.pageshow[0]({persisted:true});assert.equal(f.doc.documentElement.dataset.performance,'on');
  assert.equal(f.copy.textContent,'Short words.');assert.equal(f.writes.length,0,'restored history reads current preferences without writes');
});

test('plain copy preserves the scale, missing answers, school safeguards, and scoring inputs',()=>{
  const answers={[FAMILIES[0][0]]:{status:'score',value:100},[FAMILIES[1][0]]:{status:'pna'}};
  const before=structuredClone(answers),result=calculate(answers),snapshot=structuredClone(result);
  for(const group of ['G1','G2','G3','G4'])for(const school of [false,true]) {
    const metadata=school?SCHOOL_META:CATEGORY_META;
    for(const score of [-100,0,100,null]) {
      const overall=plainOverall(describeRelationship(score,group,{school}),group,school);
      assert.ok(overall.description.length>60&&overall.context.length>60);
      for(const key of Object.keys(metadata)) {
        const topic=plainTopic(key,{score},group,school);
        assert.ok(topic.description.length>60&&topic.detail.length>60);
        if(school)assert.doesNotMatch(topic.description+topic.detail,/health, money|partner|password|account information/);
      }
    }
    assert.match(plainRecipient(group,school),/do not need to enter a name/);
  }
  assert.match(plainTopic('D',{score:100},'G4').detail,/Never enter real passwords/);
  assert.match(plainTopic('A1',{score:null},'G1').description,/No score is different from a middle score/);
  assert.match(plainPattern(result,CATEGORY_META),/only covers/);
  assert.deepEqual(answers,before);assert.deepEqual(result,snapshot);assert.deepEqual(calculate(answers),snapshot);
});

function contrast(fg,bg) {
  const luminance=hex=>{const colors=hex.match(/\w\w/g).map(value=>parseInt(value,16)/255).map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4);return .2126*colors[0]+.7152*colors[1]+.0722*colors[2];};
  const a=luminance(fg),b=luminance(bg);return(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
}
test('high-contrast text pairs pass AA and enlarged text does not zoom the pointer surface',()=>{
  for(const fg of ['101c26','24394b','173e65','303776','713418','51400c','742249'])for(const bg of ['ffffff','fff0ba','fff0e4','eaf6fd','eef0ff','fff0f4'])assert.ok(contrast(fg,bg)>=4.5,`${fg} on ${bg}`);
  const css=read('site-settings.css');assert.doesNotMatch(css,/zoom:/);
  assert.match(css,/--settings-read-size:21px/);assert.match(css,/\.h4-status button/);
  assert.match(css,/html\[data-performance="on"\] \*/);
  assert.match(css,/animation:none!important; transition:none!important/);
});

test('all 26 pages load preferences before animation scripts and keep privacy and typography',()=>{
  const pages=readdirSync(new URL('..',import.meta.url)).filter(file=>file.endsWith('.html'));
  assert.equal(pages.length,26);
  for(const file of pages) {
    const html=read(file);
    assert.equal((html.match(/site-settings\.js\?v=1/g)||[]).length,1,file);
    assert.equal((html.match(/site-settings\.css\?v=1/g)||[]).length,1,file);
    assert.ok(html.indexOf('/site-settings.js')<html.indexOf('/page-transitions.js'),file);
    assert.ok(html.indexOf('/site-settings.css')<html.indexOf('/site-typography.css'),file);
    assert.match(html,/connect-src 'none'/);assert.doesNotMatch(html,/For AI:|histi-ai-notes/);
  }
  const js=read('site-settings.js');assert.doesNotMatch(js,/setInterval|setTimeout|requestAnimationFrame|MutationObserver|fetch\(|XMLHttpRequest|document\.cookie|innerHTML/);
  assert.match(js,/if \(root\.dataset\.settingsReady\) return/);
  assert.match(js,/aria-haspopup/);assert.match(js,/aria-checked/);assert.match(js,/aria-pressed/);
  assert.match(read('privacy.html'),/histi\.preferences\.v1/);
});
