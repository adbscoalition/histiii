import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { previewAt, initVisitorPlay } from '../visitor-play.js';

const read = file => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
class Node {
  constructor(dataset = {}) { this.dataset = dataset; this.textContent = ''; this.value = '30'; this.attributes = {}; this.listeners = {}; this.one = {}; this.many = {}; }
  querySelector(selector) { return this.one[selector] || null; }
  querySelectorAll(selector) { return this.many[selector] || []; }
  setAttribute(name, value) { this.attributes[name] = value; }
  addEventListener(name, fn) { (this.listeners[name] ||= []).push(fn); }
  closest() { return this; }
  emit(name, target = this) { for (const fn of this.listeners[name] || []) fn({ target }); }
}
const fixture = () => {
  const root = new Node(), demo = new Node(), levels = new Node(), range = new Node(), score = new Node(), adverb = new Node(), preference = new Node(), output = new Node();
  const topics = Array.from({length:5}, () => new Node());
  const colors = ['blue','rose','iris'].map(demoColor => new Node({demoColor}));
  const levelButtons = Array.from({length:5}, (_,i) => new Node({demoLevel:String(i+1)}));
  root.one = {'[data-cosmetic-demo]':demo,'[data-cosmetic-levels]':levels,'#sample-level-description':output};
  demo.one = {'input[type="range"]':range,'[data-demo-score]':score,'[data-demo-adverb]':adverb,'[data-demo-preference]':preference};
  demo.many = {'[data-demo-topic]':topics,'button[data-demo-color]':colors};
  levels.many = {'button[data-demo-level]':levelButtons};
  return {root,demo,levels,range,score,topics,colors,levelButtons,output};
};

test('cosmetic scores preserve the illustration, clamp safely, and reach both endpoints', () => {
  assert.equal(previewAt(30).code,'P40');
  assert.deepEqual(previewAt(30).topics,['O10','P20','P60','P70','P100']);
  assert.equal(previewAt(50).code,'N0');
  for (const [value,code] of [[-999,'P100'],[0,'P100'],[100,'O100'],[999,'O100']]) {
    assert.equal(previewAt(value).code,code);
    assert.ok(previewAt(value).topics.every(topic => topic === code));
  }
  for (let value=0;value<=100;value++) {
    const result=previewAt(value);
    assert.equal(result.value%10,0);
    for (const code of [result.code,...result.topics]) assert.ok(Number(code.slice(1))<=100);
  }
  assert.equal(previewAt(undefined).code,'P40');
  assert.equal(previewAt(Infinity).code,'P40');
});

test('2000 interactions and repeated initialization retain exactly three listeners and the same nodes', () => {
  const f=fixture();
  for (let i=0;i<100;i++) initVisitorPlay(f.root);
  assert.equal(f.range.listeners.input.length,1);
  assert.equal(f.demo.listeners.click.length,1);
  assert.equal(f.levels.listeners.click.length,1);
  for (let i=0;i<2000;i++) {
    f.range.value=String((i%11)*10);f.range.emit('input');
    const color=f.colors[i%3];f.demo.emit('click',color);
    assert.equal(f.demo.dataset.demoColor,color.dataset.demoColor);
    assert.equal(f.colors.filter(node=>node.attributes['aria-pressed']==='true').length,1);
    const button=f.levelButtons[i%5];f.levels.emit('click',{closest:()=>button});
    assert.equal(f.levelButtons.filter(node=>node.attributes['aria-pressed']==='true').length,1);
  }
  assert.equal(f.output.textContent,'Share completely openly');
  assert.ok(f.range.attributes['aria-valuetext'].includes(f.score.textContent));
  assert.equal(f.topics.length,5);
  assert.equal(Object.values(f.demo.listeners).flat().length,1);
  initVisitorPlay(new Node());
});

test('play controls are explicitly illustrative and absent from assessment pages', () => {
  const home=read('index.html'),js=read('visitor-play.js'),css=read('visitor-play.css');
  assert.match(home,/type="range" min="0" max="100" step="10" value="30"/);
  assert.match(home,/Just a preview\. Nothing here is saved\./);
  assert.match(home,/Interactive example HISTI result, not your score/);
  assert.match(home,/aria-live="polite">Context-dependent/);
  assert.equal((home.match(/data-demo-level="/g)||[]).length,5);
  assert.equal((home.match(/data-demo-topic>/g)||[]).length,5);
  assert.equal((home.match(/<button[^>]*data-demo-color=/g)||[]).length,3);
  assert.doesNotMatch(js,/localStorage|sessionStorage|fetch\(|setInterval|setTimeout|requestAnimationFrame|MutationObserver|innerHTML|createElement|import /);
  assert.doesNotMatch(css,/@keyframes|infinite|will-change|filter:|h4-slider|assessment-screen/);
  assert.match(css,/prefers-reduced-motion:reduce/);
  for (let group=1;group<=4;group++) assert.doesNotMatch(read(`checkin-4-g${group}.html`),/visitor-play\.js|cosmetic-demo/);
});

test('new icons are self-hosted vectors with labelled controls and no generated images', () => {
  const svg=read('visitor-icons.svg');
  assert.equal((svg.match(/<symbol /g)||[]).length,15);
  assert.match(svg, /id="friends"[^\n]*M3 20v-2a4 4 0 0 1 8 0v2M13 20v-2a4 4 0 0 1 8 0v2/);
  assert.match(read('visitor-play.css'), /overflow:visible/);
  assert.match(read('group-selector.css'), /overflow:visible/);
  assert.doesNotMatch(svg,/<image|<script|<foreignObject|<animate|https?:\/\/(?!www\.w3\.org)/);
  for (const page of ['index.html','checkin-4.html']) {
    const html=read(page);
    for (const [,symbol] of html.matchAll(/visitor-icons\.svg#([a-z]+)/g)) assert.ok(svg.includes(`id="${symbol}"`));
    assert.match(html,/<svg class="visitor-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">/);
  }
  assert.match(read('index.html'),/nav class="people-tags" aria-label="Try a relationship"/);
});
