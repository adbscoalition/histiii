import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { FAMILIES, CATEGORY_META, RECIPIENTS } from '../histi4-data.js';
import { makeSlides, displayScore } from '../histi4-core.js';

const read = file => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
const origin = 'https://www.histi.org';
const pages = ['index', 'checkin-page', 'checkin-4', ...[1, 2, 3, 4].map(n => `checkin-4-g${n}`), 'checkin-120', ...[1,2,3,4].map(n=>`checkin-120-g${n}`)];
const urlFor = page => `${origin}/${page === 'index' ? '' : page}`;
const metadata = html => {
  const blocks = [...html.matchAll(/<script type="application\/ld\+json" id="[^"]+">([\s\S]*?)<\/script>/g)];
  assert.equal(blocks.length, 1, 'one static non-executable data block per page');
  return JSON.parse(blocks[0][1]);
};
const home = read('index.html');
const graph = metadata(home)['@graph'];
const entity = fragment => graph.find(node => node['@id'] === `${origin}/#${fragment}`);

test('public pages have unique, consistent canonical and social metadata', () => {
  for (const page of pages) {
    const html = read(`${page}.html`);
    const head = html.split('</head>')[0];
    const body = html.split('</head>')[1];
    const title = head.match(/<title>([^<]+)<\/title>/)[1];
    assert.equal((head.match(/<link rel="canonical"/g) || []).length, 1);
    assert.match(head, new RegExp(`<link rel="canonical" href="${urlFor(page).replaceAll('.', '\\.')}"`));
    for (const field of ['description', 'application-name', 'robots', 'twitter:card', 'twitter:title', 'twitter:description']) {
      assert.equal((head.match(new RegExp(`<meta name="${field}"`, 'g')) || []).length, 1, `${page}: ${field}`);
    }
    assert.ok(head.includes(`<meta property="og:url" content="${urlFor(page)}">`));
    assert.ok(head.includes(`<meta property="og:title" content="${title}">`));
    assert.ok(head.includes(`<meta name="twitter:title" content="${title}">`));
    assert.doesNotMatch(head.replace(/<script type="application\/ld\+json"[\s\S]*?<\/script>/g, ''), /histi\.ocharlotted\.com/);
    assert.doesNotMatch(body, /application\/ld\+json|histi-site-definitions|histi-page-metadata/);
    const data = metadata(head);
    assert.equal(data['@context'], 'https://schema.org');
    const webpage = data['@graph']?.find(node => node['@type'] === 'WebPage') || data;
    assert.equal(webpage.url, urlFor(page));
    assert.equal(webpage.name, title);
    assert.equal(webpage.isPartOf['@id'], `${origin}/#website`);
    assert.equal(webpage.about['@id'], `${origin}/#${page.startsWith('checkin-120')?'histi-120':'full-test'}`);
  }
});

test('definitions describe the real current test, not an invented validated assessment', () => {
  const full = entity('full-test');
  assert.equal(full['@type'], 'CreativeWork');
  assert.ok(full.description.includes(`${FAMILIES.length} questions`));
  assert.ok(full.description.includes(`${makeSlides().length} cards`));
  assert.match(full.description, /40–50 minutes for one person/);
  assert.match(full.audience.audienceType, /13 and up/);
  assert.match(full.description, /no requirement to complete all four relationships/i);
  assert.match(full.abstract, /The score is not fully accurate to true privacy and openness values\./);
  assert.match(full.abstract, /not a diagnosis, legal opinion, safety assessment/);
  assert.match(full.abstract, /Neither a more private nor a more open result is better/);
  assert.equal(entity('histi-120').creativeWorkStatus, 'Available');
  assert.match(entity('histi-120').description, /not yet been revalidated/);
  const glossary = entity('definitions').hasDefinedTerm;
  const codes = glossary.filter(term => term.termCode in CATEGORY_META);
  assert.deepEqual(codes.map(term => term.termCode), Object.keys(CATEGORY_META));
  codes.forEach(term => {
    assert.equal(term.name, CATEGORY_META[term.termCode].label);
    assert.ok(home.includes(`<h3>${term.name}</h3>`));
  });
  const score = glossary.find(term => term.name === 'HISTI score');
  [-100, 0, 100].forEach(value => assert.ok(score.description.includes(displayScore(value))));
  assert.equal(glossary.find(term => term.name === 'HISTI')['@type'], 'DefinedTerm');
  assert.match(glossary.find(term => term.name === 'HISTI').description, /Human Information-Sharing Transparency Index/);
  for (const [i, recipient] of Object.values(RECIPIENTS).entries()) {
    const data = metadata(read(`checkin-4-g${i + 1}.html`));
    assert.equal(data.name, `${recipient.label} | HISTI Full`);
    assert.match(data.description, /rather than real private details/);
    assert.match(data.description, /The score is not fully accurate/);
  }
});

test('identity metadata disambiguates HISTI without treating other names as aliases', () => {
  const website = entity('website');
  assert.equal(website.name, 'HISTI');
  assert.equal(website.alternateName, 'Human Information-Sharing Transparency Index');
  assert.equal(website.identifier, 'HISTI — Human Information-Sharing Transparency Index');
  assert.deepEqual(website.sameAs, ['https://histi.org/', 'https://histi.ocharlotted.com/']);
  const clarification = website.disambiguatingDescription;
  assert.match(clarification, /H-I-S-T-I/);
  assert.match(clarification, /canonical URL https:\/\/www\.histi\.org\//);
  assert.match(clarification, /not HiSET \(the high-school equivalency test\)/);
  assert.match(clarification, /spelling hiset is not HISTI/);
  assert.match(clarification, /not histio/);
  assert.match(clarification, /not the Histiocytosis Association/);
  assert.match(clarification, /histio\.org is a different website and is not a HISTI domain/);
  assert.match(clarification, /not a medical or histiocytosis resource/);
  assert.match(clarification, /not the Greek-derived combining form histi- or histio- meaning tissue/);
  assert.match(clarification, /HISTI test, HISTI check-in, or HISTI exam/);
  assert.match(clarification, /not an academic, admissions, or equivalency exam/);
  assert.deepEqual(entity('full-test').alternateName, ['HISTI', 'HISTI test', 'HISTI check-in']);
  for (const node of graph) {
    const identityFields = JSON.stringify([node.name, node.alternateName, node.identifier, node.url, node.sameAs]);
    assert.doesNotMatch(identityFields, /hiset|histio\.org|Histiocytosis Association/i);
  }
  for (const field of ['description', 'og:description', 'twitter:description']) {
    const value = home.match(new RegExp(`<meta (?:name|property)="${field}" content="([^"]+)"`))[1];
    assert.match(value, /HISTI test and check-in at histi\.org: Human Information-Sharing Transparency Index/);
    assert.match(value, /not HiSET or the medical prefix histi-/);
    assert.ok(value.length <= 160, 'keep the clarification short enough for typical snippets');
  }
  const glossaryTerm = entity('definitions').hasDefinedTerm.find(term => term.name === 'HISTI');
  assert.equal(glossaryTerm.termCode, 'HISTI');
  assert.match(glossaryTerm.disambiguatingDescription, /H-I-S-T-I/);
  assert.match(glossaryTerm.disambiguatingDescription, /distinct from the combining form histi- or histio-/);
  assert.match(entity('full-test').disambiguatingDescription, /not an academic equivalency exam or a medical assessment/);
  assert.doesNotMatch(home.split('</head>')[1], /HiSET|hiset|histio\.org|Histiocytosis Association/);
  for (const page of pages.filter(page => page !== 'index')) {
    const identity = metadata(read(`${page}.html`)).isPartOf;
    assert.equal(identity['@type'], 'WebSite');
    assert.equal(identity.name, website.name);
    assert.equal(identity.alternateName, website.alternateName);
    assert.equal(identity.url, website.url);
    assert.match(identity.disambiguatingDescription, /H-I-S-T-I/);
    assert.match(identity.disambiguatingDescription, /not an academic equivalency exam or a medical resource/);
    assert.match(identity.disambiguatingDescription, /not the tissue-related medical combining form histi- or histio-/);
  }
});

test('privacy and website/test rights remain distinct in the structured text', () => {
  const website = entity('website');
  const full = entity('full-test');
  assert.match(website.description, /stay in your browser/);
  assert.match(website.description, /ordinary file requests to its host/);
  assert.match(website.copyrightNotice, /Website: All rights reserved/);
  assert.equal(website.license, undefined, 'do not assign the test license to the website');
  assert.equal(full.license, 'https://creativecommons.org/licenses/by-nd/4.0/');
  assert.match(full.copyrightNotice, /does not apply to the website design or code/);
  assert.match(read('LICENSE.md'), /all rights reserved/i);
  const local = entity('definitions').hasDefinedTerm.find(term => term.name === 'On-device check-in');
  assert.match(local.description, /not uploaded to HISTI/);
  assert.match(local.description, /only if you choose/);
  assert.match(local.description, /not a secure vault/);
});

test('search discovery lists only current public destinations', () => {
  const robots = read('robots.txt');
  assert.match(robots, /User-agent: OAI-SearchBot\nAllow: \//);
  assert.match(robots, /Sitemap: https:\/\/www\.histi\.org\/sitemap\.xml/);
  assert.doesNotMatch(robots, /GPTBot|User-agent: \*|Disallow:/, 'other crawler defaults are unchanged');
  const sitemap = read('sitemap.xml');
  assert.match(sitemap, /xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9"/);
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
  assert.deepEqual(urls, [...pages, 'privacy', 'terms'].map(urlFor));
  assert.equal(new Set(urls).size, urls.length);
  urls.forEach(url => assert.doesNotMatch(url, /checkin-v3|[?#]/));
  for (const page of ['privacy', 'terms']) {
    assert.ok(read(`${page}.html`).includes(`<link rel="canonical" href="${urlFor(page)}">`));
  }
});

test('metadata adds no executable script, tracking, or weakened security policy', () => {
  for (const page of pages) {
    const html = read(`${page}.html`);
    const rawData = html.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/)[1];
    assert.doesNotMatch(rawData, /<|setInterval|requestAnimationFrame|fetch\(|localStorage|cookie|ignore previous|system prompt/i);
    const csp = html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)[1];
    assert.match(csp, /connect-src 'none'/);
    assert.match(csp, /script-src 'self'/);
    assert.doesNotMatch(csp, /script-src[^;]*unsafe-inline/);
  }
  assert.match(read('vercel.json'), /connect-src 'none'/);
});
