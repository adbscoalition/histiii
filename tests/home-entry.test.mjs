import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const read=file=>readFileSync(new URL(`../${file}`,import.meta.url),'utf8');
const fixture=({home=true,hash='',reduced=false}={})=>{
  const classes=new Set(),timers=new Map(),frames=new Map(),documentEvents={},windowEvents={},motionEvents={};let id=0;
  const root={hasAttribute:name=>home&&name==='data-home-entry',classList:{add:(...values)=>values.forEach(v=>classes.add(v)),remove:(...values)=>values.forEach(v=>classes.delete(v))}};
  const motion={matches:reduced,addEventListener:(name,fn)=>{motionEvents[name]=fn;}};
  const location={pathname:home?'/':'/checkin-page',hash,href:`https://www.histi.org/${home?'':'checkin-page'}${hash}`,origin:'https://www.histi.org',assign(url){this.assigned=url;}};
  const ghosts=[];
  const document={documentElement:root,readyState:'loading',hidden:false,body:{append:node=>ghosts.push(node)},querySelectorAll:()=>[],addEventListener:(name,fn)=>{documentEvents[name]=fn;}};
  const window={location,innerWidth:1280,innerHeight:800,getComputedStyle:()=>({getPropertyValue:()=>''}),matchMedia:()=>motion,addEventListener:(name,fn)=>{windowEvents[name]=fn;}};
  runInNewContext(read('page-transitions.js'),{document,window,URL,setTimeout:(fn,ms)=>{const key=++id;timers.set(key,{fn,ms});return key;},clearTimeout:key=>timers.delete(key),requestAnimationFrame:fn=>{const key=++id;frames.set(key,fn);return key;},cancelAnimationFrame:key=>frames.delete(key)});
  const flushFrames=()=>{while(frames.size){const [key,fn]=frames.entries().next().value;frames.delete(key);fn();}};
  const fireTimer=ms=>{const [key,task]=[...timers].find(([,task])=>task.ms===ms)||[];assert.ok(task,`Expected ${ms}ms timer`);timers.delete(key);task.fn();};
  const ready=()=>{documentEvents.DOMContentLoaded();flushFrames();};
  return{classes,timers,frames,documentEvents,windowEvents,motionEvents,motion,document,location,ready,fireTimer,ghosts};
};

test('the homepage remains the destination, with no welcome page or required enter action',()=>{
  const html=read('index.html');
  assert.match(html,/<html lang="en" data-home-entry>/);
  assert.match(html,/id="hero-title"/);
  assert.match(html,/href="\/checkin-page">Explore check-ins/);
  assert.equal((html.match(/class="(?:hero-people )?hero-entry-line"/g)||[]).length,3);
  assert.doesNotMatch(html,/histi-welcome|home-welcome|data-welcome|Enter HISTI|Skip welcome/);
  for(const file of ['home-welcome.css','home-welcome.js','tests/home-welcome.test.mjs']) assert.equal(existsSync(new URL(`../${file}`,import.meta.url)),false);
  assert.ok(html.indexOf('home-entry.css')<html.indexOf('site-typography.css'));
  assert.match(read('home-entry.css'),/html\.histi-home-arriving:not\(\.histi-home-deep-link\)/);
  for(const font of ['idiqlat/regular','tiro-gurmukhi/regular','instrument-sans/variable']) assert.ok(html.includes(`rel="preload" href="/fonts/${font}.woff2"`));
});

test('homepage headline and supporting content reveal once with compositor-only motion',()=>{
  const css=read('home-entry.css');
  for(const delay of [80,160,240]) assert.ok(css.includes(`animation-delay:${delay}ms`));
  assert.match(css,/\.visitor-benefits \{ animation:home-entry-rise/);
  assert.match(css,/\.home-result \{ animation:home-entry-card 900ms 260ms/);
  const keyframes=[...css.matchAll(/@keyframes [^{]+\{ from \{([^}]+)\} to \{([^}]+)\} \}/g)];
  assert.equal(keyframes.length,4);
  for(const [,from,to] of keyframes) assert.doesNotMatch(from+to,/width|height|margin|padding|filter|clip/);
  assert.doesNotMatch(css,/infinite|will-change|position:fixed|pointer-events:none|overflow:hidden|filter:/);
  assert.match(css,/:focus-within \{ animation:none!important/);
  assert.match(css,/prefers-reduced-motion:reduce/);
});

test('direct homepage entry never paints the navigation veil or locks the page',()=>{
  const f=fixture();assert.equal(f.classes.has('histi-url-covered'),false);
  f.ready();assert.equal(f.classes.has('histi-url-covered'),false);
  assert.equal(f.classes.has('histi-url-motion'),false);assert.equal(f.classes.has('histi-page-enter'),true);
  f.fireTimer(900);assert.equal(f.classes.has('histi-page-enter'),false);assert.equal(f.timers.size,0);
  assert.doesNotMatch(read('home-entry.css')+read('page-transitions.js'),/sessionStorage|localStorage|showModal|body\.style\.overflow/);
});

test('deep links and reduced motion show the real page immediately',()=>{
  const hash=fixture({hash:'#about'});assert.equal(hash.classes.has('histi-home-deep-link'),true);hash.ready();assert.equal(hash.classes.has('histi-url-covered'),false);
  assert.match(read('home-entry.css'),/not\(\.histi-home-deep-link\)/);
  for(const home of [true,false]) {const f=fixture({home,reduced:true});f.ready();assert.equal(f.classes.size,0);assert.equal(f.timers.size,0);assert.equal(f.frames.size,0);}
});

test('cross-page exit and non-home entry retain the existing full-screen transitions',()=>{
  const f=fixture();f.ready();
  const link={href:'https://www.histi.org/checkin-page',hasAttribute:()=>false,target:''};
  let prevented=false;f.documentEvents.click({button:0,target:{closest:()=>link},preventDefault(){prevented=true;}});
  assert.equal(prevented,true);assert.equal(f.classes.has('histi-url-covered'),true);assert.equal(f.classes.has('histi-url-leaving'),true);
  f.fireTimer(340);assert.equal(f.location.assigned,link.href);
  f.windowEvents.pagehide();assert.equal(f.timers.size,0);assert.equal(f.frames.size,0);
  const other=fixture({home:false});assert.equal(other.classes.has('histi-url-covered'),true);other.ready();assert.equal(other.classes.has('histi-url-covered'),false);
});

test('repeated back/forward entry uses bounded timers and preserves the badge fixes',()=>{
  const f=fixture();f.ready();
  for(let i=0;i<100;i++){f.windowEvents.pageshow({persisted:true});f.windowEvents.pagehide();assert.equal(f.frames.size,0);assert.equal(f.timers.size,0);}
  assert.deepEqual(Object.keys(f.documentEvents).sort(),['DOMContentLoaded','click']);
  assert.deepEqual(Object.keys(f.windowEvents).sort(),['pagehide','pageshow']);
  assert.doesNotMatch(read('page-transitions.js'),/setInterval|MutationObserver|createElement|innerHTML/);
  assert.equal((read('index.html').match(/class="visitor-step-code"/g)||[]).length,3);
  for(const page of ['checkin-page.html','checkin-4.html','checkin-4-g1.html','checkin-4-g2.html','checkin-4-g3.html','checkin-4-g4.html']) assert.doesNotMatch(read(page),/data-home-entry|home-entry\.css/);
});

test('test cards expand from their actual bounds, redirect once and release the clone',()=>{
  for(let i=0;i<100;i++) {
    const f=fixture(); f.ready(); let removed=0;
    const ghost={style:{setProperty(){}},classList:{add(){}},removeAttribute(){},setAttribute(){},querySelectorAll:()=>[],remove(){removed++;}};
    const link={href:'https://www.histi.org/checkin-4',hasAttribute:()=>false,target:'',matches:()=>true,getBoundingClientRect:()=>({left:250,top:100,width:380,height:260}),cloneNode:()=>ghost};
    const click={button:0,target:{closest:()=>link},preventDefault(){}};
    f.documentEvents.click(click); f.documentEvents.click(click);
    assert.equal(f.ghosts.length,1); assert.equal(ghost.style.left,'250px'); assert.equal(ghost.style.width,'380px');
    assert.equal(f.classes.has('histi-url-card'),true);
    assert.equal([...f.timers.values()].filter(t=>t.ms===580).length,1);
    f.fireTimer(580); assert.equal(f.location.assigned,link.href);
    f.windowEvents.pagehide(); assert.equal(removed,1); assert.equal(f.timers.size,0); assert.equal(f.classes.has('histi-url-card'),false);
  }
  const css=read('page-transitions.css');
  assert.match(css,/@keyframes histi-card-open/); assert.match(css,/transform:translate\(var\(--card-end-x\)/);
  assert.doesNotMatch(css,/infinite|blur\(|will-change/);
  assert.match(css,/filter:brightness\(\.18\)/); // Static contrast correction for the white logo, not an animated filter.
});
