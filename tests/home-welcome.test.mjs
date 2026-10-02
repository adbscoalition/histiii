import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { initWelcome } from '../home-welcome.js';

const fixture = ({seen=false,hash='',reduced=false,blockedStorage=false,hidden=false}={}) => {
  const records = new Map(seen ? [['histi.welcome.v1','seen']] : []),animations=[];
  const root={hidden,activeElement:null};
  class Node {
    constructor(dataset={}) { this.dataset=dataset;this.listeners={};this.attributes={};this.hidden=false;this.isConnected=true; }
    addEventListener(name,fn) { (this.listeners[name] ||= []).push(fn); }
    emit(name,event={}) { for(const fn of this.listeners[name]||[]) fn({target:this,preventDefault(){this.prevented=true;},...event}); }
    setAttribute(name,value) { this.attributes[name]=value; }
    closest(selector) { return selector==='[data-welcome-tab]' && this.dataset.welcomeTab ? this : selector==='[data-welcome-dismiss]' && this.dataset.dismiss ? this : null; }
    focus() { root.activeElement=this; }
  }
  const body=new Node(),dialog=new Node(),replay=new Node(),homeAction=new Node(),enter=new Node({dismiss:true});
  const bodyClasses=new Set();body.style={overflow:'clip'};body.classList={add:c=>bodyClasses.add(c),remove:c=>bodyClasses.delete(c)};
  replay.hidden=true;root.body=body;root.activeElement=body;
  const tabs=['people','pace','privacy'].map(welcomeTab=>new Node({welcomeTab}));
  const panels=['people','pace','privacy'].map(welcomePanel=>new Node({welcomePanel}));
  const scrollPane={scrollTop:123};
  dialog.querySelector=()=>scrollPane;
  dialog.querySelectorAll=selector=>selector==='[data-welcome-tab]' ? tabs : panels;
  root.querySelector=selector=>({'#histi-welcome':dialog,'[data-welcome-open]':replay,'.home-hero .home-button-primary':homeAction}[selector]);
  dialog.open=false;dialog.opens=0;
  dialog.showModal=()=>{dialog.open=true;dialog.opens++;enter.focus();};
  dialog.close=()=>{dialog.open=false;dialog.emit('close');};
  dialog.animate=(frames,options)=>{
    const animation={frames,options,onfinish:null,cancelled:false,cancel(){this.cancelled=true;},finish(){this.onfinish?.();}};
    animations.push(animation);return animation;
  };
  const options={currentHash:()=>hash,reducedMotion:()=>reduced,getStorage:()=>{
    if(blockedStorage) throw new Error('Storage unavailable');
    return{getItem:key=>records.get(key),setItem:(key,value)=>records.set(key,value)};
  }};
  const click=target=>dialog.emit('click',{target});
  return{root,dialog,replay,homeAction,enter,tabs,panels,records,animations,bodyClasses,options,click,scrollPane};
};

test('the first visit is a usable welcome, not an automatic timed gate',()=>{
  const f=fixture();initWelcome(f.root,f.options);
  assert.equal(f.dialog.open,true);assert.equal(f.root.body.style.overflow,'hidden');
  assert.equal(f.replay.hidden,false);assert.equal(f.records.size,0);
  assert.equal(f.scrollPane.scrollTop,0);
  assert.equal(f.tabs[0].attributes['aria-selected'],'true');
  assert.deepEqual(f.panels.map(p=>p.hidden),[false,true,true]);
  f.click(f.enter);f.click(f.enter);
  assert.equal(f.animations.length,1);assert.equal(f.animations[0].options.duration,280);
  f.animations[0].finish();
  assert.equal(f.dialog.open,false);assert.equal(f.root.body.style.overflow,'clip');
  assert.equal(f.root.activeElement,f.homeAction);
  assert.equal(f.records.get('histi.welcome.v1'),'seen');
  assert.equal(f.bodyClasses.size,0);assert.equal(f.animations[0].onfinish,null);
});

test('seen sessions and deep links bypass the welcome but can explicitly reopen it',()=>{
  for(const config of [{seen:true},{hash:'#areas-title'}]) {
    const f=fixture(config);initWelcome(f.root,f.options);
    assert.equal(f.dialog.open,false);assert.equal(f.root.body.style.overflow,'clip');
    f.replay.focus();f.replay.emit('click');assert.equal(f.dialog.open,true);
    assert.equal(f.scrollPane.scrollTop,0);
    f.click(f.enter);f.animations.at(-1).finish();
    assert.equal(f.root.activeElement,f.replay);
  }
});

test('tabs support delegated clicks, roving focus, keyboard wrapping, and one visible panel',()=>{
  const f=fixture();initWelcome(f.root,f.options);
  f.click({closest:selector=>selector==='[data-welcome-tab]' ? f.tabs[1] : null});
  assert.deepEqual(f.panels.map(p=>p.hidden),[true,false,true]);
  for(const [from,key,to] of [[1,'ArrowRight',2],[2,'ArrowRight',0],[0,'ArrowLeft',2],[2,'Home',0],[0,'End',2]]) {
    let prevented=false;
    f.dialog.emit('keydown',{target:f.tabs[from],key,preventDefault(){prevented=true;}});
    assert.ok(prevented);assert.equal(f.root.activeElement,f.tabs[to]);
    assert.equal(f.tabs.filter(t=>t.attributes['tabindex']==='0').length,1);
    assert.equal(f.panels.filter(p=>!p.hidden).length,1);
  }
});

test('Escape, direct closure, unavailable storage, and reduced motion never trap the visitor',()=>{
  for(const config of [{reduced:true},{hidden:true},{blockedStorage:true}]) {
    const f=fixture(config);initWelcome(f.root,f.options);
    f.dialog.emit('cancel');f.animations.at(-1)?.finish();
    assert.equal(f.dialog.open,false);assert.equal(f.root.body.style.overflow,'clip');
  }
  const f=fixture();initWelcome(f.root,f.options);f.click(f.enter);f.dialog.close();
  assert.equal(f.animations[0].cancelled,true);assert.equal(f.animations[0].onfinish,null);
  assert.equal(f.root.body.style.overflow,'clip');
  const unsupported=fixture();delete unsupported.dialog.showModal;
  initWelcome(unsupported.root,unsupported.options);assert.equal(unsupported.replay.hidden,true);
  initWelcome({querySelector:()=>null});
});

test('100 opens and 1000 tab selections keep the same nodes and exactly five listeners',()=>{
  const f=fixture();for(let i=0;i<100;i++) initWelcome(f.root,f.options);
  for(let i=0;i<100;i++) {
    for(let j=0;j<10;j++) f.click(f.tabs[j%3]);
    f.click(f.enter);f.animations.at(-1).finish();
    f.replay.emit('click');
  }
  assert.equal(Object.values(f.dialog.listeners).flat().length,4);
  assert.equal(f.replay.listeners.click.length,1);
  assert.equal(f.tabs.length,3);assert.equal(f.panels.length,3);assert.equal(f.records.size,1);
  assert.ok(f.animations.every(a=>a.cancelled && a.onfinish===null));
});

test('welcome is homepage-only, progressively enhanced, and retains the existing font hierarchy',()=>{
  const read=file=>readFileSync(new URL(`../${file}`,import.meta.url),'utf8');
  const html=read('index.html'),js=read('home-welcome.js'),css=read('home-welcome.css');
  assert.match(html,/<dialog id="histi-welcome"[^>]*aria-labelledby="welcome-title"/);
  assert.doesNotMatch(html,/<dialog id="histi-welcome"[^>]*\sopen(?:\s|>)/);
  assert.equal((html.match(/role="tab"/g)||[]).length,3);
  assert.equal((html.match(/role="tabpanel"/g)||[]).length,3);
  assert.match(html,/Enter HISTI/);assert.match(html,/Skip welcome/);
  assert.match(html,/data-welcome-open aria-haspopup="dialog" hidden/);
  assert.ok(html.indexOf('home-welcome.css')<html.indexOf('site-typography.css'));
  assert.match(css,/grid-template-rows:auto minmax\(0,1fr\) auto/);
  assert.match(css,/prefers-reduced-motion:reduce/);
  assert.doesNotMatch(js,/localStorage|fetch\(|setInterval|setTimeout|requestAnimationFrame|MutationObserver|innerHTML|createElement/);
  assert.doesNotMatch(css,/infinite|will-change|backdrop-filter|filter:/);
  for(const page of ['checkin-page.html','checkin-4.html','checkin-4-g1.html','checkin-4-g2.html','checkin-4-g3.html','checkin-4-g4.html','privacy.html','terms.html']) assert.doesNotMatch(read(page),/home-welcome\.js|id="histi-welcome"/);
});
