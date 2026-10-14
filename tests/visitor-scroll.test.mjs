import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { wheelDistance, glidePosition, initVisitorScroll } from '../visitor-scroll.js';
const read = file => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
class Events {
  constructor() { this.listeners={}; }
  addEventListener(type,fn) { (this.listeners[type] ||= []).push(fn); }
  emit(type,event={}) { for(const fn of this.listeners[type] || []) fn(event); }
}
class Node extends Events {
  constructor() { super();this.dataset={};this.attributes={};this.nodeType=1;this.scrollHeight=100;this.clientHeight=100;this.parentElement=null;this.label={textContent:''};this.hidden=true; }
  querySelector() { return this.label; }
  setAttribute(name,value) { this.attributes[name]=value; }
  closest(selector) { return selector==='[data-scroll-glide]'&&this.isToggle ? this : selector.includes('input,')&&(this.isInput||this.isSlider) ? this : selector.includes('data-visitor-motion')&&this.isMotion ? this : null; }
}
const fixture = () => {
  const root=new Events(),host=new Events(),button=new Node(),element=new Node(),motion=new Events(),pointer=new Events();
  root.body=new Node();root.body.dataset.page='formats';root.body.paused=false;root.body.classList={contains:name=>name==='reduce-motion'?root.body.reduced:root.body.paused};
  root.documentElement=new Node();root.scrollingElement={scrollHeight:5000};root.hidden=false;
  button.isToggle=true;element.parentElement=root.body;
  root.querySelectorAll=()=>[button];root.querySelector=()=>root.dialog||root.dragging?{}:null;
  root.documentElement.matches=()=>Boolean(root.covered);
  motion.matches=false;pointer.matches=true;host.matchMedia=query=>query.includes('reduced-motion')?motion:pointer;
  let now=0,id=0,peak=0;const pending=new Map(),requests=new Set(),positions=[];
  host.scrollY=0;host.scrollX=0;host.innerHeight=800;host.performance={now:()=>now};
  host.requestAnimationFrame=fn=>{const key=++id;pending.set(key,fn);peak=Math.max(peak,pending.size);return key;};
  host.cancelAnimationFrame=key=>pending.delete(key);
  host.scrollTo=request=>{assert.equal(request.behavior,'instant');requests.add(request);host.scrollY=Math.round(request.top);positions.push(host.scrollY);host.emit('scroll');};
  host.getComputedStyle=node=>({overflowY:node.overflow || 'visible'});
  const step=(duration=16)=>{now+=duration;const batch=[...pending.values()];pending.clear();batch.forEach(fn=>fn(now));};
  const finish=()=>{let count=0;while(pending.size&&count<60){step();count++;}assert.ok(count<60,'glide stops, rather than keeping idle frames alive');return count;};
  const wheel=(overrides={})=>{const event={target:element,deltaY:400,deltaX:0,deltaMode:0,cancelable:true,prevented:false,preventDefault(){this.prevented=true;},...overrides};host.emit('wheel',event);return event;};
  return {root,host,button,element,motion,pointer,pending,requests,positions,step,finish,wheel,peak:()=>peak};
};

test('glide normalizes wheel units and approaches a target without overshooting',()=>{
  assert.equal(wheelDistance({deltaY:3,deltaMode:1},800),48);
  assert.equal(wheelDistance({deltaY:1,deltaMode:2},800),680);
  assert.equal(wheelDistance({deltaY:Infinity,deltaMode:0},800),0);
  assert.equal(wheelDistance({deltaY:9999,deltaMode:0},800),1800);
  for(const target of [-500,500]) {
    let position=0;
    for(let i=0;i<60;i++){position=glidePosition(position,target,16);assert.ok(position>=Math.min(0,target)&&position<=Math.max(0,target));}
    assert.equal(position,target);
  }
});

test('2000 wheel events coalesce into one frame chain, reuse one write object, and stop by the deadline',()=>{
  const f=fixture();for(let i=0;i<100;i++)initVisitorScroll(f.root,f.host);
  assert.equal(f.host.listeners.wheel.length,1);assert.equal(f.root.listeners.click.length,1);
  for(let i=0;i<2000;i++)assert.equal(f.wheel().prevented,true);
  assert.equal(f.pending.size,1);assert.equal(f.peak(),1);
  assert.ok(f.finish()<=41);assert.equal(f.pending.size,0);assert.equal(f.requests.size,1);
  assert.equal(f.host.scrollY,4200);assert.equal(f.root.documentElement.dataset.scrollGlideActive,'false');
  assert.ok(f.positions.every(value=>value>=0&&value<=4200));
});

test('reversing the gesture replaces momentum; keyboard, pointer, and external scroll cancel immediately',()=>{
  const f=fixture();initVisitorScroll(f.root,f.host);f.wheel();f.step();const before=f.host.scrollY;
  assert.ok(before>0&&before<400);f.wheel({deltaY:-100});f.step();assert.ok(f.host.scrollY<before);f.finish();assert.equal(f.host.scrollY,0);
  for(const type of ['keydown','pointerdown','touchstart','resize','hashchange','pagehide']) {f.wheel();assert.equal(f.pending.size,1);f.host.emit(type);assert.equal(f.pending.size,0);}
  f.wheel();f.host.scrollY=600;f.host.emit('scroll');assert.equal(f.pending.size,0);
  f.wheel();f.root.hidden=true;f.root.emit('visibilitychange');assert.equal(f.pending.size,0);
});

test('reduced motion, coarse pointers, controls, dialogs, nested scrolling, zoom, and horizontal gestures stay native',()=>{
  const f=fixture();initVisitorScroll(f.root,f.host);
  for(const overrides of [{ctrlKey:true},{metaKey:true},{shiftKey:true},{altKey:true},{cancelable:false},{defaultPrevented:true},{deltaX:500}]) assert.equal(f.wheel(overrides).prevented,false);
  f.element.isInput=true;assert.equal(f.wheel().prevented,false);f.element.isInput=false;
  f.root.dialog=true;assert.equal(f.wheel().prevented,false);f.root.dialog=false;
  f.element.scrollHeight=400;f.element.overflow='auto';assert.equal(f.wheel().prevented,false);f.element.scrollHeight=100;
  f.root.body.paused=true;assert.equal(f.wheel().prevented,false);f.root.body.paused=false;
  f.wheel();assert.equal(f.pending.size,1);
  f.motion.matches=true;f.motion.emit('change');assert.equal(f.pending.size,0);assert.equal(f.wheel().prevented,false);
  f.motion.matches=false;f.pointer.matches=false;f.pointer.emit('change');assert.equal(f.wheel().prevented,false);
  const other=fixture();other.root.body.dataset.page='unknown';initVisitorScroll(other.root,other.host);assert.equal(other.host.listeners.wheel,undefined);
});

test('every page identity glides, including restored pages that start partway down',()=>{
  for(const page of ['home','formats','people','checkin','privacy','terms']) {
    const f=fixture();f.root.body.dataset.page=page;f.host.scrollY=1700;initVisitorScroll(f.root,f.host);
    assert.equal(f.wheel().prevented,true,page);f.finish();assert.equal(f.host.scrollY,2100,page);
    f.host.emit('pagehide');initVisitorScroll(f.root,f.host);assert.equal(f.host.listeners.wheel.length,1);
    f.wheel({deltaY:-400});f.finish();assert.equal(f.host.scrollY,1700,page);
  }
});

test('slider drags, URL covers, app reduced-motion settings, and programmatic card changes cancel the glide',()=>{
  const f=fixture();f.root.body.dataset.page='checkin';initVisitorScroll(f.root,f.host);
  f.element.isSlider=true;assert.equal(f.wheel().prevented,false);f.element.isSlider=false;
  for(const flag of ['dragging','covered']) {f.wheel();assert.equal(f.pending.size,1);f.root[flag]=true;assert.equal(f.wheel().prevented,false);assert.equal(f.pending.size,0);f.root[flag]=false;}
  f.wheel();f.root.body.reduced=true;f.step();assert.equal(f.pending.size,0);assert.equal(f.wheel().prevented,false);f.root.body.reduced=false;
  f.wheel();f.step();f.host.scrollY=0;f.host.emit('scroll');assert.equal(f.pending.size,0);
  f.wheel();f.finish();assert.equal(f.host.scrollY,400);
});

test('site-wide scroll physics is bounded and has no timers, storage, generated nodes, or scoring changes',()=>{
  const js=read('visitor-scroll.js');
  assert.match(js,/now - lastInput >= 650/);assert.match(js,/if \(!frame\)/);assert.match(js,/host\.cancelAnimationFrame\(frame\)/);
  assert.doesNotMatch(js,/setInterval|setTimeout|localStorage|sessionStorage|fetch\(|createElement|innerHTML|MutationObserver/);
  const pages=readdirSync(new URL('..',import.meta.url)).filter(file=>file.endsWith('.html'));
  assert.equal(pages.length,26);
  for(const page of pages) {const html=read(page);assert.match(html,/visitor-scroll\.js\?v=settings-1/);assert.match(html,/visitor-scroll\.css\?v=3/);assert.doesNotMatch(html,/data-scroll-glide|data-scroll-label|histi-scroll-toggle/,page);}
  const css=read('visitor-scroll.css');assert.match(css,/body\[data-page="checkin"\]\) \{ scroll-behavior:auto/);assert.doesNotMatch(css,/histi-scroll-toggle/);assert.match(css,/prefers-reduced-motion:reduce/);
});

test('performance mode cancels pending glide immediately and leaves wheel input native',()=>{
  const f=fixture();initVisitorScroll(f.root,f.host);f.wheel();assert.equal(f.pending.size,1);
  f.root.documentElement.dataset.performance='on';f.root.emit('histi:preferences');
  assert.equal(f.pending.size,0);assert.equal(f.wheel().prevented,false);
  f.root.documentElement.dataset.performance='off';f.root.emit('histi:preferences');
  assert.equal(f.wheel().prevented,true);f.finish();assert.equal(f.pending.size,0);
  assert.equal(f.root.listeners['histi:preferences'].length,1);
});
