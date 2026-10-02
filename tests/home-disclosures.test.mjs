import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { initFaq } from '../home-disclosures.js';

const fixture = () => {
  const animations = [];
  const details = Array.from({length:6}, () => ({
    open:false, dataset:{}, style:{},
    getBoundingClientRect() { return {height: this.open ? 165 : 65}; },
    animate(frames, options) {
      const animation = {frames, options, cancelled:false, onfinish:null, cancel() { this.cancelled=true; }, finish() { this.onfinish?.(); }};
      animations.push(animation);
      return animation;
    }
  }));
  const listeners = [];
  const list = {dataset:{}, querySelectorAll:()=>details, addEventListener:(name,fn)=>listeners.push(fn)};
  const root = {querySelector:()=>list};
  const click = index => {
    let prevented=false;
    const summary = {parentElement:details[index]};
    listeners.forEach(fn=>fn({target:{closest:()=>summary}, preventDefault:()=>{prevented=true;}}));
    assert.ok(prevented);
  };
  return {root,listeners,details,animations,click};
};

test('FAQ opens and closes with a finite height animation and releases its styles', () => {
  const f=fixture();initFaq(f.root,{reducedMotion:()=>false});
  f.click(0);
  assert.equal(f.details[0].open,true);
  assert.deepEqual(f.animations[0].frames,[{height:'65px'},{height:'165px'}]);
  assert.equal(f.animations[0].options.duration,320);
  f.animations[0].finish();
  assert.equal(f.details[0].style.height,'');
  f.click(0);
  assert.equal(f.details[0].open,true,'answer remains rendered while closing');
  assert.deepEqual(f.animations[1].frames,[{height:'165px'},{height:'65px'}]);
  f.animations[1].finish();
  assert.equal(f.details[0].open,false);
  assert.equal(f.details[0].style.overflow,'');
  assert.equal(f.animations[1].onfinish,null);
});

test('rapid reversals cancel the previous animation and never add more listeners', () => {
  const f=fixture();for(let i=0;i<100;i++) initFaq(f.root,{reducedMotion:()=>false});
  assert.equal(f.listeners.length,1);
  for(let i=0;i<1000;i++) f.click(0);
  assert.ok(f.animations.slice(0,-1).every(animation=>animation.cancelled && animation.onfinish===null));
  f.animations.at(-1).finish();
  assert.equal(f.details[0].open,false);
  assert.equal(f.details[0].style.height,'');
});

test('reduced motion and browsers without animation retain immediate native details', () => {
  for(const reduced of [true,false]) {
    const f=fixture();if(!reduced) f.details.forEach(details=>delete details.animate);
    initFaq(f.root,{reducedMotion:()=>reduced});
    f.click(0);assert.equal(f.details[0].open,true);
    f.click(0);assert.equal(f.details[0].open,false);
    assert.equal(f.animations.length,0);
  }
  initFaq({querySelector:()=>null});
});

test('homepage keeps six native FAQs, the check-in link, and the exact disclaimer', () => {
  const read = file=>readFileSync(new URL(`../${file}`,import.meta.url),'utf8');
  const html=read('index.html'),js=read('home-disclosures.js');
  assert.equal((html.match(/<details>/g)||[]).length,6);
  assert.match(html,/home-disclosures\.js\?v=faq-1/);
  assert.match(html,/aria-labelledby="ready-title"/);
  assert.match(html,/aria-label="Your next steps"/);
  assert.match(html,/Choose your check-in/);
  assert.match(html,/The score is not fully accurate to true privacy and openness values\./);
  assert.doesNotMatch(js,/localStorage|fetch\(|setInterval|setTimeout|requestAnimationFrame|innerHTML|MutationObserver/);
});
