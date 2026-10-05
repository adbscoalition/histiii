import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
const read=file=>readFileSync(new URL(`../${file}`,import.meta.url),'utf8');

test('spring motion is finite and confined to non-question surfaces and decorative icons',()=>{
  const shared=read('site-experience.css'), motion=read('site-motion.css');
  const selector=shared.slice(shared.indexOf('/* A small spring'),shared.indexOf('/* Keep the recipient chooser'));
  assert.doesNotMatch(selector,/\.assessment-card|\.h4-segment|\.h4-control/);
  assert.match(selector,/suite-spring-enter/);
  assert.match(shared,/65% \{ opacity:1; transform:translateY\(-3px\) scale\(1\.03\)/);
  assert.match(motion,/--motion-spring: cubic-bezier\(\.2,1\.35,\.32,1\)/);
  assert.match(motion,/transform 450ms var\(--motion-spring\)/);
  assert.match(motion,/suite-icon-arrive 720ms/);
  assert.match(motion,/body\.reduce-motion :is\(\.h4-choice,\.app-card,\.home-format\) svg \{ animation:none!important/);
  assert.doesNotMatch(motion,/infinite|will-change|filter:|setInterval/);
  for(const page of readdirSync(new URL('../',import.meta.url)).filter(f=>f.endsWith('.html'))) {
    const html=read(page);
    assert.match(html,/page-transitions\.css\?v=refresh-3/);
    assert.match(html,/site-motion\.css\?v=spring-1/);
    assert.match(html,/site-experience\.css\?v=spring-1/);
  }
});
