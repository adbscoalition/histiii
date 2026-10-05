import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describeScore, describeTopic, coverageText, createResultReveal } from '../histi4-results.js';
import { calculate, displayScore } from '../histi4-core.js';
import { FAMILIES, CATEGORY_META } from '../histi4-data.js';

const read = file => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');

test('descriptions cover both endpoints, the midpoint, and absent scores without changing scoring', () => {
  for (const [score, key] of [[-100,'private-strong'],[-70,'private-strong'],[-69,'private'],[-20,'private'],[-19,'middle'],[0,'middle'],[19,'middle'],[20,'open'],[69,'open'],[70,'open-strong'],[100,'open-strong'],[null,'unscored']]) {
    assert.equal(describeScore(score).key, key);
    assert.ok(describeScore(score).description.length > 90);
  }
  assert.equal(displayScore(-40), 'P40');
  assert.equal(displayScore(0), 'N0');
  assert.equal(displayScore(40), 'O40');
  for (const key of Object.keys(CATEGORY_META)) {
    const empty = describeTopic(key, {score:null});
    assert.match(empty.description, /not the same as a neutral result/);
    assert.ok(empty.scope && empty.prompt);
    assert.match(describeTopic(key, {score:100}).description, /not a recommendation to share/);
  }
  assert.match(describeTopic('D', {score:100}).prompt, /Never share real passwords or codes/);
});

test('coverage labels and missing areas use the existing inclusion rules', () => {
  assert.equal(coverageText(calculate({})), '0 of 245 questions scored · 0 of 5 areas represented');
  const result = calculate({ [FAMILIES[0][0]]: {status:'pna'}, [FAMILIES[1][0]]: {status:'unknown'}, [FAMILIES[2][0]]: {status:'na'} });
  assert.equal(coverageText(result), '1 of 245 questions scored · 1 of 5 areas represented');
  assert.equal(result.categories.A1.earned, 1);
  assert.equal(result.categories.B.score, null);
});

function animationHarness() {
  const running = new Set();
  const requests = [];
  let reduced = false;
  const node = marker => ({
    classList: {contains: name => marker && name === 'spectrum-marker'},
    animate(frames, options) {
      let resolve, reject;
      const animation = { finished:new Promise((yes,no)=>{resolve=yes;reject=no;}), cancel(){running.delete(animation);reject(new Error('Cancelled'));}, finish(){running.delete(animation);resolve();} };
      running.add(animation); requests.push({frames,options}); return animation;
    }
  });
  const nodes = Object.fromEntries(['.result-introduction','.result-score-panel','.result-score-line','.spectrum-marker:not([hidden])','.result-perspective'].map(selector=>[selector,node(selector.includes('marker'))]));
  const topics = Array.from({length:5},()=>node(false));
  const panel = {querySelector:selector=>nodes[selector],querySelectorAll:()=>topics};
  const reveal = createResultReveal(()=>reduced);
  return {reveal,panel,running,requests,reduce:()=>{reduced=true;}};
}

test('100 result replays keep at most ten native animations and release all effects', async () => {
  const h=animationHarness();
  for(let i=0;i<100;i++) {h.reveal.play(h.panel);assert.equal(h.running.size,10);}
  for(const request of h.requests) {
    assert.equal(request.options.fill,'backwards');
    assert.ok(request.options.duration+request.options.delay<=1500);
    assert.ok(request.frames.every(frame=>Object.keys(frame).every(key=>['opacity','transform','offset'].includes(key))));
  }
  for(const animation of [...h.running])animation.finish();
  await Promise.resolve();
  assert.equal(h.running.size,0);
  h.reveal.play(h.panel);h.reveal.cancel();assert.equal(h.running.size,0);
  await Promise.resolve();
});

test('reduced motion and unsupported animation show results immediately', () => {
  const h=animationHarness();h.reduce();h.reveal.play(h.panel);assert.equal(h.requests.length,0);
  createResultReveal(()=>false).play({querySelector:()=>null,querySelectorAll:()=>[]});
});

test('all four routes share the accessible result card and no animation or score loop', () => {
  for(const group of ['g1','g2','g3','g4']) {
    const html=read(`checkin-4-${group}.html`);
    for(const id of ['result-recipient','result-state','result-description','result-context','result-score-meaning','result-early-note','result-explain-btn','result-read-dialog','result-replay-btn'])assert.equal(html.split(`id="${id}"`).length,2);
    assert.match(html,/aria-haspopup="dialog" aria-controls="result-read-dialog"/);
    assert.match(html,/histi4-results\.css\?v=1/);
    assert.match(html,/not a percentage of your privacy/);
    assert.match(html,/The score is not fully accurate to true privacy and openness values\./);
  }
  const app=read('app-histi4.js');
  assert.match(app,/if \(rendered && focusId === 'result-heading'\) revealResult\(\)/);
  assert.match(app,/if \(!transitionBusy\) revealResult\(\)/);
  assert.match(app,/marker.hidden = bucket.score === null/);
  assert.match(app,/window.addEventListener\('pagehide', resultReveal.cancel\)/);
  assert.doesNotMatch(read('histi4-results.js'),/requestAnimationFrame|setInterval|setTimeout|MutationObserver|innerHTML/);
  assert.doesNotMatch(read('histi4-results.css'),/infinite|filter:|will-change|backdrop-filter/);
  assert.match(read('histi4-results.css'),/grid-template-columns:1fr/);
});
