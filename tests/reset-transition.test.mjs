import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
const read=file=>readFileSync(new URL(`../${file}`,import.meta.url),'utf8');
const events=()=>{const listeners=new Map();return{listeners,addEventListener:(key,fn)=>listeners.set(key,fn),removeEventListener:(key,fn)=>{if(listeners.get(key)===fn)listeners.delete(key);}};};
function fixture() {
  const timers=new Map();let id=0,focusCount=0;
  const node=()=>{const classes=new Set();return{children:[],hidden:true,classList:{add:c=>classes.add(c),remove:c=>classes.delete(c),contains:c=>classes.has(c)},setAttribute(){},append(...children){this.children.push(...children);},offsetWidth:100};};
  const body=node(),regions=[{inert:false},{inert:false},{inert:true}];
  const motion={...events(),matches:false};
  const document={...events(),hidden:false,body,createElement:node,querySelectorAll:()=>regions,querySelector:()=>({focus:()=>{focusCount++;}})};
  const window={...events(),matchMedia:()=>motion};
  const api=runInNewContext(read('reset-transition.js').replace('export function','function')+'\n({resetTransition})',{document,window,setTimeout:(fn,ms)=>{const key=++id;timers.set(key,{fn,ms});return key;},clearTimeout:key=>timers.delete(key),Promise,Set});
  const fire=ms=>{const [key,timer]=[...timers].find(([,t])=>t.ms===ms)||[];assert.ok(timer,`Expected ${ms}ms timer`);timers.delete(key);timer.fn();};
  const clean=()=>{assert.equal(timers.size,0);assert.equal(document.listeners.size+window.listeners.size+motion.listeners.size,0);assert.deepEqual(regions.map(n=>n.inert),[false,false,true]);if(body.children.length)assert.equal(body.children[0].hidden,true);};
  return{...api,body,motion,document,window,timers,fire,clean,focusCount:()=>focusCount};
}
test('100 confirmed resets reuse one screen, mutate once and clean up all timers/listeners',async()=>{
  const f=fixture();let commits=0;
  for(let i=0;i<100;i++) {
    const result=f.resetTransition(()=>{commits++;});
    assert.equal(await f.resetTransition(()=>assert.fail('duplicate reset')),false);
    assert.equal(f.body.children.length,1);assert.equal(f.timers.size,2);assert.equal(commits,i);
    f.fire(320);assert.equal(commits,i+1);f.fire(440);f.fire(380);
    assert.equal(await result,true);f.clean();
  }
  assert.equal(f.focusCount(),100);
});
test('hidden tabs, reduced motion, navigation and fallback cannot strand a confirmed reset',async()=>{
  for(const mode of ['hidden','motion','pagehide','fallback']) {
    const f=fixture();let committed=0;const result=f.resetTransition(()=>{committed++;});
    if(mode==='hidden'){f.document.hidden=true;f.document.listeners.get('visibilitychange')();}
    if(mode==='motion'){f.motion.matches=true;f.motion.listeners.get('change')();}
    if(mode==='pagehide')f.window.listeners.get('pagehide')();
    if(mode==='fallback')f.fire(1800);
    assert.equal(await result,true);assert.equal(committed,1);f.clean();
  }
  const f=fixture();f.motion.matches=true;let commits=0;
  await f.resetTransition(()=>{commits++;});assert.equal(commits,1);assert.equal(f.body.children.length,0);f.clean();
});
test('render failure rejects after restoring the page and every app confirms before resetting',async()=>{
  const f=fixture();const result=f.resetTransition(()=>{throw Error('render failed');});
  f.fire(320);await assert.rejects(result,/render failed/);f.clean();
  for(const app of ['app-histi4.js','app-histi-v3.js','app-histi120.js','app-public-sans.js']) {
    const source=read(app);assert.ok(source.includes("import { resetTransition }"));
    const reset=source.slice(source.search(/async function reset(?:All)?\(/));
    assert.ok(reset.indexOf('await confirmReset')<reset.indexOf('await resetTransition'));
  }
  assert.doesNotMatch(read('reset-transition.js'),/setInterval|requestAnimationFrame|MutationObserver|innerHTML/);
});
