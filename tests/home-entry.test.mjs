import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const read=file=>readFileSync(new URL(`../${file}`,import.meta.url),'utf8');
const fixture=({home=true,hash='',reduced=false,referrer='',navigation='navigate',storage=new Map(),storageBlocked=false,clock=100000,assignFails=false,history,activation}={})=>{
  const classes=new Set(),timers=new Map(),frames=new Map(),documentEvents={},windowEvents={},motionEvents={};let id=0;
  const root={hasAttribute:name=>home&&name==='data-home-entry',classList:{contains:value=>classes.has(value),add:(...values)=>values.forEach(v=>classes.add(v)),remove:(...values)=>values.forEach(v=>classes.delete(v))}};
  const motion={matches:reduced,addEventListener:(name,fn)=>{motionEvents[name]=fn;}};
  const location={pathname:home?'/':'/checkin-page',hash,href:`https://www.histi.org/${home?'':'checkin-page'}${hash}`,origin:'https://www.histi.org',assign(url){if(assignFails)throw new Error('Navigation cancelled');this.assigned=url;}};
  const ghosts=[];
  const makeNode=()=>({children:[],style:{setProperty(name,value){this[name]=value;}},setAttribute(){},append(...nodes){this.children.push(...nodes);},remove(){ghosts.splice(ghosts.indexOf(this),1);}});
  const document={documentElement:root,referrer,readyState:'loading',hidden:false,body:{append:node=>ghosts.push(node)},createElement:makeNode,querySelectorAll:()=>[],addEventListener:(name,fn)=>{documentEvents[name]=fn;}};
  const sessionStorage={getItem(key){if(storageBlocked)throw new Error('Storage blocked');return storage.get(key)??null;},setItem(key,value){if(storageBlocked)throw new Error('Storage blocked');storage.set(key,value);},removeItem(key){if(storageBlocked)throw new Error('Storage blocked');storage.delete(key);}};
  const navigationEvents={};
  const browserNavigation=activation?{activation,addEventListener:(name,fn)=>{navigationEvents[name]=fn;}}:undefined;
  const window={location,history,navigation:browserNavigation,sessionStorage,performance:{getEntriesByType:()=>[{type:navigation}]},innerWidth:1280,innerHeight:800,getComputedStyle:()=>({getPropertyValue:key=>key==='border-top-left-radius'?'28px':''}),matchMedia:()=>motion,addEventListener:(name,fn)=>{windowEvents[name]=fn;}};
  const context={document,window,URL,Date:{now:()=>clock},setTimeout:(fn,ms)=>{const key=++id;timers.set(key,{fn,ms});return key;},clearTimeout:key=>timers.delete(key),requestAnimationFrame:fn=>{const key=++id;frames.set(key,fn);return key;},cancelAnimationFrame:key=>frames.delete(key)};
  runInNewContext(read('page-transitions.js'),context);
  const flushFrames=()=>{while(frames.size){const [key,fn]=frames.entries().next().value;frames.delete(key);fn();}};
  const fireTimer=ms=>{const [key,task]=[...timers].find(([,task])=>task.ms===ms)||[];assert.ok(task,`Expected ${ms}ms timer`);timers.delete(key);task.fn();};
  const ready=()=>{documentEvents.DOMContentLoaded({type:'DOMContentLoaded'});flushFrames();};
  return{classes,timers,frames,documentEvents,windowEvents,navigationEvents,browserNavigation,motionEvents,motion,document,location,storage,ready,fireTimer,ghosts,runIntro:()=>runInNewContext(read('home-intro.js'),context)};
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
  assert.equal(f.classes.has('histi-url-motion'),true);assert.equal(f.classes.has('histi-page-enter'),true);
  f.fireTimer(900);assert.equal(f.classes.has('histi-page-enter'),false);assert.equal(f.timers.size,0);
  assert.doesNotMatch(read('home-entry.css')+read('page-transitions.js'),/localStorage|showModal|body\.style\.overflow/);
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
  assert.deepEqual(Object.keys(f.windowEvents).sort(),['pagehide','pagereveal','pageshow','pageswap']);
  assert.doesNotMatch(read('page-transitions.js'),/setInterval|MutationObserver|innerHTML/);
  assert.equal((read('index.html').match(/class="visitor-step-code"/g)||[]).length,3);
  for(const page of ['checkin-page.html','checkin-4.html','checkin-4-g1.html','checkin-4-g2.html','checkin-4-g3.html','checkin-4-g4.html']) assert.doesNotMatch(read(page),/data-home-entry|home-entry\.css/);
});

test('test cards expand from their actual bounds, redirect once and release the clone',()=>{
  const f=fixture(); f.ready();
  for(let i=0;i<100;i++) {
    const face={style:{setProperty(name,value){this[name]=value;}},classList:{add(){},remove(){}},removeAttribute(){},setAttribute(){},querySelectorAll:()=>[]};
    const link={href:'https://www.histi.org/checkin-4',hasAttribute:()=>false,target:'',matches:()=>true,getBoundingClientRect:()=>({left:250,top:100,width:380,height:260}),cloneNode:()=>face};
    const click={button:0,target:{closest:()=>link},preventDefault(){}};
    f.documentEvents.click(click); f.documentEvents.click(click);
    assert.equal(f.ghosts.length,1); assert.equal(face.style.left,'250px'); assert.equal(face.style.width,'380px');
    const [surface,preview]=f.ghosts[0].children;assert.equal(preview,face);assert.equal(surface.style['--card-sx'],380/1280);assert.equal(surface.style['--card-sy'],260/800);
    assert.equal(surface.style['--card-radius-x'],`${28/(380/1280)}px`);
    assert.equal(f.classes.has('histi-page-enter'),false);
    assert.equal(f.classes.has('histi-url-card'),true);
    assert.equal([...f.timers.values()].filter(t=>t.ms===720).length,1);
    f.fireTimer(720); assert.equal(f.location.assigned,link.href);
    f.windowEvents.pagehide(); assert.equal(f.ghosts.length,0); assert.equal(f.timers.size,0); assert.equal(f.classes.has('histi-url-card'),false);
  }
  const css=read('page-transitions.css');
  assert.match(css,/@keyframes histi-card-open/); assert.match(css,/transform:translate\(var\(--card-x\)/);
  const face=css.match(/@keyframes histi-card-face \{([^\n]+)\}/)[1];assert.doesNotMatch(face,/scaleX|scaleY|--card-sx|--card-sy/);
  assert.match(css,/border-radius:0/);assert.match(css,/78% \{ transform:translate\(-3px,-2px\) scale\(1\.005\)/);
  assert.doesNotMatch(css,/infinite|blur\(|will-change/);
  assert.match(css,/filter:brightness\(\.18\)/); // Static contrast correction for the white logo, not an animated filter.
});

test('returning home skips the intro before paint; external arrivals remain eligible',()=>{
  for(const options of [{referrer:'https://www.histi.org/checkin-4'},{navigation:'back_forward'},{navigation:'reload'}]) {
    const f=fixture(options);assert.equal(f.classes.has('histi-home-return'),true);assert.equal(f.classes.has('histi-url-covered'),true);
    f.runIntro();assert.equal(f.classes.has('histi-intro-pending'),false);
    f.ready();
    if(options.navigation==='reload'){assert.equal(f.classes.has('histi-refresh'),true);f.fireTimer(700);}
    else {assert.equal(f.classes.has('histi-url-covered'),false);f.fireTimer(900);}
    assert.equal(f.classes.has('histi-url-covered'),false);assert.equal(f.timers.size,0);
  }
  for(const referrer of ['', 'https://example.org/', 'not a URL']) {
    const f=fixture({referrer});assert.equal(f.classes.has('histi-home-return'),false);assert.equal(f.classes.has('histi-url-covered'),false);
  }
  const f=fixture();f.ready();f.windowEvents.pagehide();f.windowEvents.pageshow({persisted:true});
  assert.equal(f.classes.has('histi-home-return'),true);assert.equal(f.classes.has('histi-url-covered'),false);assert.equal(f.frames.size+f.timers.size,0);
});

const homeClick=f=>f.documentEvents.click({button:0,target:{closest:()=>({href:'https://www.histi.org/',hasAttribute:()=>false,target:''})},preventDefault(){}});

test('no-referrer home navigation consumes one short-lived answer-free handoff',()=>{
  const outgoing=fixture({home:false});outgoing.ready();homeClick(outgoing);
  assert.equal(outgoing.storage.size,0);outgoing.fireTimer(340);
  assert.deepEqual([...outgoing.storage],[['histi.navigation.home','115000']]);
  outgoing.windowEvents.pagehide();assert.equal(outgoing.storage.size,1);
  const incoming=fixture({storage:outgoing.storage,clock:100500});
  assert.equal(incoming.classes.has('histi-home-return'),true);assert.equal(incoming.classes.has('histi-url-covered'),true);
  assert.equal(incoming.storage.size,0);incoming.runIntro();assert.equal(incoming.classes.has('histi-intro-pending'),false);
  incoming.ready();assert.equal(incoming.classes.has('histi-url-covered'),false);
  assert.equal(fixture({storage:incoming.storage}).classes.has('histi-home-return'),false);
  const headers=JSON.parse(read('vercel.json')).headers.flatMap(rule=>rule.headers);
  assert.ok(headers.some(header=>header.key==='Referrer-Policy'&&header.value==='no-referrer'));
  assert.ok(headers.some(header=>header.key==='Content-Security-Policy'&&header.value.includes("connect-src 'none'")));
  assert.match(read('privacy.html'),/single-use navigation flag[\s\S]*contains no answers or personal details/);
});

test('invalid handoffs and blocked storage do not block a fresh arrival',()=>{
  for(const flag of ['99999','100000','115001','NaN','https://example.org/']) {
    const f=fixture({storage:new Map([['histi.navigation.home',flag]])});
    assert.equal(f.classes.has('histi-home-return'),false);assert.equal(f.storage.size,0);
  }
  const f=fixture({storageBlocked:true});f.ready();assert.equal(f.classes.has('histi-url-covered'),false);
  const outgoing=fixture({home:false,storageBlocked:true});outgoing.ready();homeClick(outgoing);outgoing.fireTimer(340);
  assert.equal(outgoing.location.assigned,'https://www.histi.org/');
});

test('cancelled navigation clears its handoff; reduced motion preserves a native home link',()=>{
  for(const assignFails of [false,true]) {
    const f=fixture({home:false,assignFails});f.ready();homeClick(f);f.fireTimer(340);
    if(!assignFails){assert.equal(f.storage.size,1);f.fireTimer(1800);}
    assert.equal(f.storage.size,0);assert.equal(f.classes.has('histi-url-covered'),false);
  }
  const f=fixture({home:false,reduced:true});f.ready();homeClick(f);
  assert.equal(f.storage.size,1);assert.equal(f.timers.size,0);f.windowEvents.pagehide();assert.equal(f.storage.size,1);
  const incoming=fixture({storage:f.storage,reduced:true});incoming.runIntro();incoming.ready();
  assert.equal(incoming.classes.has('histi-home-return'),true);assert.equal(incoming.classes.has('histi-intro-pending'),false);assert.equal(incoming.storage.size,0);
  for(const options of [{ctrlKey:true},{button:1},{defaultPrevented:true}]) {
    const other=fixture({home:false});other.ready();
    other.documentEvents.click({button:0,...options,target:{closest:()=>({href:'https://www.histi.org/',hasAttribute:()=>false,target:''})},preventDefault(){}});
    assert.equal(other.storage.size,0);assert.equal(other.location.assigned,undefined);
  }
});

const activation=(from,to)=>({navigationType:'traverse',from:{index:from},entry:{index:to}});
const transition=()=>{
  let finish,fail,skips=0;
  const finished=new Promise((resolve,reject)=>{finish=resolve;fail=reject;});
  return{finished,finish,fail,skipTransition(){skips++;},get skips(){return skips;}};
};
const historyState=state=>({state,calls:[],replaceState(next,title,...url){this.calls.push({next,title,url});this.state=next;}});

test('native Back and Forward slide the outgoing snapshot in opposite directions',async()=>{
  for(const [from,to,direction] of [[9,2,'back'],[2,9,'forward']]) {
    const f=fixture({activation:activation(from,to)});f.ready();
    const outgoing=transition();f.windowEvents.pageswap({activation:activation(from,to),viewTransition:outgoing});
    assert.equal(outgoing.skips,0);assert.equal(f.classes.has(`histi-native-${direction}`),true);
    const incoming=transition();f.windowEvents.pagereveal({viewTransition:incoming});
    assert.equal(f.classes.has('histi-url-covered'),false);assert.equal(f.classes.has('histi-page-enter'),false);
    assert.equal(f.classes.has(`histi-native-${direction}`),true);assert.equal(f.frames.size+f.timers.size,0);
    f.runIntro();assert.equal(f.classes.has('histi-intro-pending'),false);
    incoming.finish();await Promise.resolve();assert.equal(f.classes.has(`histi-native-${direction}`),false);
  }
  const css=read('page-transitions.css');
  assert.match(css,/@view-transition \{ navigation:auto; \}/);
  assert.match(css,/@keyframes histi-browser-back[^\n]+translateX\(100%\)/);
  assert.match(css,/@keyframes histi-browser-forward[^\n]+translateX\(-100%\)/);
  assert.match(css,/histi-browser-reveal 380ms 520ms/);
  assert.match(css,/visibility:hidden!important; animation:none!important; transition:none!important/);
  assert.match(css,/@view-transition \{ navigation:none; \}/);
});

test('an early page reveal cannot restart the ordinary entrance or capture its veil',async()=>{
  const f=fixture({home:false,activation:activation(2,1)}),vt=transition();
  f.windowEvents.pagereveal({viewTransition:vt});f.ready();
  assert.equal(f.classes.has('histi-native-back'),true);assert.equal(f.classes.has('histi-url-covered'),false);
  assert.equal(f.frames.size+f.timers.size,0);vt.finish();await Promise.resolve();
  assert.equal(f.classes.has('histi-native-back'),false);
});

test('numeric direction fallback preserves history state, adds no entries and stores no URLs',async()=>{
  const storage=new Map(),first=historyState({owned:{keep:true}});
  fixture({home:false,history:first,storage});assert.equal(first.state.owned.keep,true);
  assert.equal(first.state.__histiTransitionEntry,1);assert.equal(first.calls.length,1);assert.deepEqual(first.calls[0].url,[]);
  const second=historyState(null);fixture({home:false,history:second,storage});assert.equal(second.state.__histiTransitionEntry,2);
  assert.deepEqual([...storage],[['histi.navigation.cursor','2']]);
  const back=fixture({home:false,history:first,storage,navigation:'back_forward'});back.ready();
  const vt=transition();back.windowEvents.pagereveal({viewTransition:vt});assert.equal(back.classes.has('histi-native-back'),true);
  vt.finish();await Promise.resolve();
  const forward=fixture({home:false,history:second,storage,navigation:'back_forward'});forward.ready();
  const next=transition();forward.windowEvents.pagereveal({viewTransition:next});assert.equal(forward.classes.has('histi-native-forward'),true);
  next.finish();await Promise.resolve();assert.equal(first.calls.length,1);assert.equal(second.calls.length,1);
  for(const state of ['other app state',42,['array state']]) {
    const untouched=historyState(state);fixture({history:untouched});assert.equal(untouched.state,state);assert.equal(untouched.calls.length,0);
  }
  assert.doesNotMatch(read('page-transitions.js'),/pushState|popstate|beforeunload|localStorage|fetch\(/);
});

test('native indices work with blocked storage and page-swap state works without entry indices',()=>{
  const f=fixture({activation:activation(20,2),storageBlocked:true});f.ready();
  const vt=transition();f.windowEvents.pagereveal({viewTransition:vt});assert.equal(f.classes.has('histi-native-back'),true);
  f.windowEvents.pagehide();assert.equal(vt.skips,1);
  const other=fixture();other.ready();const outgoing=transition();
  other.windowEvents.pageswap({activation:{navigationType:'traverse',from:{getState:()=>({__histiTransitionEntry:2})},entry:{getState:()=>({__histiTransitionEntry:1})}},viewTransition:outgoing});
  assert.equal(other.classes.has('histi-native-back'),true);assert.equal(outgoing.skips,0);
});

test('BFCache direction updates without retaining snapshots, listeners, timers or clones',async()=>{
  const history=historyState({__histiTransitionEntry:1}),storage=new Map([['histi.navigation.cursor','2']]);
  const f=fixture({home:false,history,storage});f.ready();
  for(let i=0;i<100;i++) {
    storage.set('histi.navigation.cursor','2');f.windowEvents.pageshow({persisted:true});
    const vt=transition();f.windowEvents.pagereveal({viewTransition:vt});assert.equal(f.classes.has('histi-native-back'),true);
    if(i%2)vt.fail(new Error('Skipped by browser'));else f.windowEvents.pagehide();
    vt.finish();await Promise.resolve();
    assert.equal(f.frames.size+f.timers.size+f.ghosts.length,0);assert.equal(f.classes.has('histi-native-back'),false);
  }
  assert.equal(history.calls.length,0);assert.equal(storage.size,1);
  assert.deepEqual(Object.keys(f.windowEvents).sort(),['pagehide','pagereveal','pageshow','pageswap']);
});

test('ordinary links, unknown directions, reduced motion and hidden tabs skip native history effects',()=>{
  for(const options of [{},{activation:{navigationType:'push'}},{activation:activation(2,2)},{activation:activation(2,1),reduced:true}]) {
    const f=fixture(options);f.ready();const vt=transition();f.windowEvents.pagereveal({viewTransition:vt});assert.equal(vt.skips,1);
    const outgoing=transition();f.windowEvents.pageswap({activation:options.activation,viewTransition:outgoing});assert.equal(outgoing.skips,1);
  }
  const f=fixture({activation:activation(2,1)});f.ready();f.document.hidden=true;
  const hidden=transition();f.windowEvents.pagereveal({viewTransition:hidden});assert.equal(hidden.skips,1);
  f.document.hidden=false;const live=transition();f.windowEvents.pagereveal({viewTransition:live});
  f.motion.matches=true;f.motionEvents.change();assert.equal(live.skips,1);assert.equal(f.classes.has('histi-native-back'),false);
  assert.equal(f.frames.size+f.timers.size,0);
});

test('refresh fades its loading cover in, then releases it without replaying intro',()=>{
  const f=fixture({navigation:'reload'});assert.equal(f.classes.has('histi-refresh'),true);f.runIntro();
  assert.equal(f.classes.has('histi-intro-pending'),false);f.ready();assert.equal(f.classes.has('histi-refresh'),true);
  assert.equal(f.classes.has('histi-page-enter'),false);assert.equal(f.frames.size,0);f.fireTimer(700);
  assert.equal(f.classes.has('histi-refresh'),false);assert.equal(f.classes.has('histi-url-covered'),false);assert.equal(f.timers.size,0);
  const reduced=fixture({navigation:'reload',reduced:true});reduced.ready();assert.equal(reduced.frames.size+reduced.timers.size,0);
  const outgoing=fixture({activation:{navigationType:'push'}});outgoing.ready();outgoing.navigationEvents.navigate({navigationType:'reload'});
  assert.equal(outgoing.classes.has('histi-refresh'),true);outgoing.fireTimer(1500);assert.equal(outgoing.classes.has('histi-refresh'),false);
  const css=read('page-transitions.css');assert.match(css,/histi-refresh-cover 320ms ease both/);assert.doesNotMatch(css,/infinite|will-change/);
});
