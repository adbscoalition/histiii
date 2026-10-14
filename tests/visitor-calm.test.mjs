import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { paceRecommendation, initVisitorCalm } from '../visitor-calm.js';

const read = file => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
class Node {
  constructor(dataset={}) {
    this.dataset=dataset; this.attributes={}; this.listeners={}; this.one={}; this.many={}; this.textContent='';
    const classes=new Set();
    this.classList={add:(...names)=>names.forEach(name=>classes.add(name)),remove:(...names)=>names.forEach(name=>classes.delete(name)),contains:name=>classes.has(name),toggle:(name,on)=>on?classes.add(name):classes.delete(name)};
  }
  querySelector(selector) { return this.one[selector] || null; }
  querySelectorAll(selector) { return this.many[selector] || []; }
  setAttribute(name,value) { this.attributes[name]=value; }
  getAttribute(name) { return this.attributes[name] ?? null; }
  addEventListener(name,fn) { (this.listeners[name] ||= []).push(fn); }
  emit(name,target=this) { for(const fn of this.listeners[name] || []) fn({target}); }
  closest(selector) { return selector==='[data-pace-choice]'&&this.dataset.paceChoice ? this : selector==='[data-visitor-motion]'&&this.dataset.visitorMotion!==undefined ? this : null; }
  getBoundingClientRect() { return {top:1000}; }
}
const fixture = () => {
  const root=new Node(),guide=new Node(),output=new Node(),link=new Node(),toggle=new Node({visitorMotion:''}),label=new Node();
  const choices=['60','120','full'].map(paceChoice=>new Node({paceChoice}));
  const icons=choices.map(()=>new Node());
  const cards=['/checkin-60','/checkin-120','/checkin-4'].map(href=>{const node=new Node();node.setAttribute('href',href);return node;});
  const live=new Set(); let peak=0;
  const animate = (frames,options) => {
    assert.ok(options.duration<=440); assert.equal(options.fill,'none'); assert.ok(frames.every(frame=>Object.keys(frame).every(key=>['opacity','transform','offset'].includes(key))));
    const animation={cancel(){live.delete(this);this.oncancel?.();},finish(){live.delete(this);this.onfinish?.();}};
    live.add(animation);peak=Math.max(peak,live.size);return animation;
  };
  output.animate=animate; icons.forEach((icon,index)=>{icon.animate=animate;choices[index].one['.visitor-icon']=icon;});
  guide.one={'[data-pace-output]':output,'[data-pace-link]':link};guide.many['[data-pace-choice]']=choices;
  link.one['[data-pace-link-label]']=new Node();toggle.one['[data-motion-label]']=label;
  root.body=new Node({page:'home'});root.documentElement=new Node();root.defaultView=new Node();
  root.many={'[data-pace-guide]':[guide],'[data-visitor-motion]':[toggle],'.home-format,.app-card.available':cards,'[data-calm-reveal],body[data-page="formats"] .app-card':[guide,...cards]};
  const motion=new Node();motion.matches=false;
  return {root,guide,output,link,toggle,label,choices,cards,motion,live,peak:()=>peak};
};

test('the pace guide maps only to available tests with the real per-person estimates',()=>{
  assert.deepEqual(['60','120','full'].map(key=>paceRecommendation(key).route),['/checkin-60','/checkin-120','/checkin-4']);
  for(const [key,time] of [['60','10–15'],['120','20–25'],['full','40–50']]) assert.ok(paceRecommendation(key).note.includes(time));
  for(const key of ['__proto__','toString','unknown',null,undefined]) assert.equal(paceRecommendation(key),null);
});

test('2000 choices and 100 initializations keep two finite effects and one guide listener',()=>{
  const f=fixture();
  for(let i=0;i<100;i++) initVisitorCalm(f.root,{motion:f.motion,Observer:null});
  assert.equal(f.guide.listeners.click.length,1);assert.equal(f.motion.listeners.change.length,1);
  for(let i=0;i<2000;i++) {
    const choice=f.choices[i%3];f.guide.emit('click',choice);
    assert.equal(f.choices.filter(button=>button.attributes['aria-pressed']==='true').length,1);
    assert.equal(f.cards.filter(card=>card.dataset.paceRecommended==='true').length,1);
    assert.equal(f.link.getAttribute('href'),paceRecommendation(choice.dataset.paceChoice).route);
    assert.ok(f.live.size<=2);
  }
  assert.equal(f.peak(),2);
  for(const animation of [...f.live]) animation.finish();
  assert.equal(f.live.size,0);
  f.guide.emit('click',new Node({paceChoice:'unknown'}));
  assert.equal(f.live.size,0);
  f.guide.emit('click',f.toggle);assert.equal(f.root.body.classList.contains('visitor-motion-paused'),true);
  f.guide.emit('click',f.choices[2]);assert.equal(f.live.size,0);
  assert.equal(f.toggle.attributes['aria-pressed'],'true');assert.equal(f.label.textContent,'Motion paused');
});

test('reduced motion and page departure reveal content and cancel in-flight effects',()=>{
  const f=fixture(); let observer;
  class Observer {
    constructor(callback) { observer=this;this.callback=callback;this.targets=new Set();this.disconnected=false; }
    observe(node) { this.targets.add(node); }
    unobserve(node) { this.targets.delete(node); }
    disconnect() { this.targets.clear();this.disconnected=true; }
  }
  initVisitorCalm(f.root,{motion:f.motion,Observer,viewportHeight:720});
  assert.equal(observer.targets.size,4);assert.equal(f.guide.classList.contains('visitor-awaiting'),true);
  f.guide.emit('click',f.choices[0]);assert.equal(f.live.size,2);
  f.motion.matches=true;f.motion.emit('change');
  assert.equal(f.live.size,0);assert.equal(f.guide.classList.contains('visitor-awaiting'),false);
  assert.equal(observer.disconnected,true);assert.equal(f.toggle.disabled,true);assert.equal(f.label.textContent,'Reduced motion');
  f.motion.matches=false;f.motion.emit('change');f.guide.emit('click',f.choices[1]);assert.equal(f.live.size,2);
  f.root.defaultView.emit('pagehide');assert.equal(f.live.size,0);
  const other=fixture();other.root.body.dataset.page='checkin';initVisitorCalm(other.root,{motion:other.motion,Observer:null});assert.equal(other.guide.listeners.click,undefined);
});

test('visitor extras stay off assessments and add no background layers or motion loops',()=>{
  const js=read('visitor-calm.js'),css=read('visitor-calm.css');
  assert.doesNotMatch(js,/localStorage|sessionStorage|fetch\(|setInterval|setTimeout|requestAnimationFrame|MutationObserver|innerHTML|createElement|import /);
  assert.doesNotMatch(css,/infinite|will-change|filter:|backdrop-filter|h4-slider|assessment-screen/);
  assert.match(css,/prefers-reduced-motion:reduce/);assert.match(js,/observer\.unobserve\(entry\.target\)/);
  for(const page of ['index.html','checkin-page.html']) {
    const html=read(page);assert.match(html,/visitor-calm\.css\?v=1/);assert.match(html,/visitor-calm\.js\?v=settings-1/);
    assert.equal((html.match(/data-pace-choice="/g)||[]).length,3);
    assert.match(html,/data-pace-output aria-live="polite"/);assert.match(html,/aria-label="Pause decorative motion" aria-pressed="false"/);
    assert.equal((html.match(/class="suite-color-field"/g)||[]).length,1);
  }
  for(const variant of ['4','120','60']) for(const suffix of ['', '-g1','-g2','-g3','-g4']) assert.doesNotMatch(read(`checkin-${variant}${suffix}.html`),/visitor-calm|data-pace-guide/);
});
