import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describeScore, describeRelationship, describeTopic, describePattern, referenceScore } from '../histi4-results.js';
import { calculate } from '../histi4-core.js';
import { FAMILIES, CATEGORY_META } from '../histi4-data.js';
import { CATEGORY_META as SCHOOL_META } from '../histi-school-data.js';

const read = file => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');

test('each topic has a distinct reading, a second explanation, and the chosen recipient', () => {
  for (const group of ['G1','G2','G3','G4']) {
    const person = describeRelationship(0, group).person;
    for (const score of [-100,-40,0,40,100]) {
      const descriptions = new Set();
      for (const key of Object.keys(CATEGORY_META)) {
        const topic = describeTopic(key, {score}, {group});
        assert.ok(topic.description.includes(person));
        assert.doesNotMatch(topic.description, /\{person\}|Your included choices|This snapshot/);
        assert.ok(topic.description.split(/\s+/).length >= 30);
        assert.ok(topic.detail.split(/\s+/).length >= 25);
        assert.ok(topic.prompt.length > 40);
        descriptions.add(topic.description);
      }
      assert.equal(descriptions.size, 5);
    }
    assert.ok(describeRelationship(0, group).context.length > 150);
  }
  assert.match(describeRelationship(0, 'G4').context, /not how close or healthy/);
  assert.match(describeTopic('A1',{score:-100},{group:'G3'}).description, /not how sociable/);
  assert.match(describeScore(0).description, /middle levels, or/);
});

test('school readings stay age-appropriate, voluntary, and free of adult-topic comparisons', () => {
  for (const group of ['G1','G2','G3','G4']) {
    const person = describeRelationship(0, group, {school:true}).person;
    for (const score of [-100,0,100]) {
      const descriptions = new Set();
      for (const key of Object.keys(SCHOOL_META)) {
        const topic = describeTopic(key, {score}, {group,school:true});
        assert.ok(topic.description.includes(person));
        assert.doesNotMatch(topic.description + topic.detail, /spouse|partner|finances|credentials|new job|diagnos/i);
        assert.ok(topic.description.split(/\s+/).length >= 20);
        descriptions.add(topic.description);
        assert.equal(referenceScore('school',group,key),null);
      }
      assert.equal(descriptions.size,4);
    }
  }
  assert.match(describeTopic('B',{score:100},{school:true,group:'G4'}).detail, /does not make your answer owed/);
  assert.match(describeTopic('C',{score:100},{school:true,group:'G3'}).detail, /imaginary examples only/);
  assert.match(describeTopic('A2',{score:100},{school:true,group:'G2'}).detail, /doesn’t prove/);
  assert.match(describeRelationship(0,'G4',{school:true}).context, /not a grade or a measure of honesty/);
});

test('unscored areas are not neutral, and open D readings never encourage credential sharing', () => {
  for (const score of [null, NaN]) assert.match(describeTopic('D',{score}).description, /not the same as a neutral/);
  for (const score of [-100,0,100]) {
    const topic = describeTopic('D',{score},{group:'G4'});
    assert.match(topic.detail, /Never enter real passwords, codes, or identifying details/);
    assert.match(topic.detail, /not permission to disclose/);
    assert.match(topic.detail, /not a recommendation to share/);
  }
  assert.equal(describeRelationship(0,'unknown').person,'this person');
});

function patternResult(scores, answered=5, total=245) {
  return {answered,total,categories:Object.fromEntries(Object.entries(scores).map(([key,score])=>[key,{score}]))};
}

test('pattern summaries handle absent topics, single areas, gaps, close scores, and school scope', () => {
  const empty = describePattern(patternResult({A1:null,A2:null,B:null,C:null,D:null},0),CATEGORY_META);
  assert.match(empty.description,/no scored topics/);
  const single = describePattern(patternResult({A1:100,A2:null,B:null,C:null,D:null},1),CATEGORY_META);
  assert.match(single.description,/only covers daily activities/);
  assert.doesNotMatch(single.description,/farther toward|higher|lower/);
  const gap = describePattern(patternResult({A1:100,A2:50,B:0,C:-50,D:-100}),CATEGORY_META);
  assert.equal(gap.title,'Where your answers differ.');
  assert.match(gap.description,/daily activities.*farther toward the open end.*very sensitive information/);
  assert.match(gap.note,/partial result.*different numbers of answers/);
  const allOpen = describePattern(patternResult({A1:100,A2:100,B:100,C:100,D:100},245),CATEGORY_META);
  assert.equal(allOpen.title,'Reading across the topics.');
  assert.match(allOpen.description,/fairly close together/);
  assert.doesNotMatch(allOpen.note,/partial/);
  const school = describePattern(patternResult({A1:100,A2:null,B:0,C:-100},48,48),SCHOOL_META);
  assert.match(school.description,/everyday life and preferences.*personal and sensitive information/);
  assert.doesNotMatch(school.description,/very sensitive|\bD\b/);
});

test('additional readings do not change stored answers or scoring and create no unbounded work', () => {
  const answers = {[FAMILIES[0][0]]:{status:'score',value:100},[FAMILIES[1][0]]:{status:'pna'}};
  const copy = structuredClone(answers), result = calculate(answers), before = structuredClone(result);
  for (let i=0;i<100;i++) {
    describePattern(result,CATEGORY_META);
    describeRelationship(result.score,'G3');
    for (const [key,bucket] of Object.entries(result.categories)) describeTopic(key,bucket,{group:'G3'});
  }
  assert.deepEqual(answers,copy);
  assert.deepEqual(result,before);
  assert.deepEqual(calculate(answers),before);
  assert.doesNotMatch(read('histi4-results.js'), /fetch\(|localStorage|setTimeout|setInterval|requestAnimationFrame|innerHTML/);
  const app=read('app-histi4.js');
  assert.match(app,/perspective\.replaceChildren/);
  assert.match(app,/if \(!\$\('result-next-copy'\)\)/);
  assert.match(app,/describeTopic\(key, bucket, \{ group, school \}\)/);
});

test('all sixteen current check-ins share the editorial results without changing question markup', () => {
  for (const variant of ['4','120','60','school']) {
    for (const group of ['g1','g2','g3','g4']) {
      const html=read(`checkin-${variant}-${group}.html`);
      for (const id of ['result-heading','result-score','category-results','result-read-dialog','resume-btn']) assert.equal(html.split(`id="${id}"`).length,2);
      assert.match(html,/About your answers/);
      assert.match(html,/A closer look, topic by topic/);
      assert.match(html,/What does the number mean/);
      assert.match(html,/The score is not fully accurate to true privacy and openness values\./);
      assert.match(html,/connect-src 'none'/);
      assert.match(html,/id="question-list"/);
      assert.doesNotMatch(html,/One person\. One moment\.|No better end of the scale\.|A SNAPSHOT, NOT A LABEL/);
    }
  }
  const css=read('histi4-results.css');
  assert.match(css,/\.result-topic-layout \{ display:grid; grid-template-columns:minmax\(0,\.7fr\) minmax\(0,1\.3fr\)/);
  assert.match(css,/\.result-topic-layout \{ grid-template-columns:1fr/);
  assert.doesNotMatch(css,/infinite|backdrop-filter|will-change/);
});
