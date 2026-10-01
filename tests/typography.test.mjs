import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const read = path => readFileSync(new URL(path, root), 'utf8');

test('every page finishes its styles with the shared font hierarchy', () => {
  for (const file of readdirSync(root).filter(name => name.endsWith('.html'))) {
    const styles = [...read(file).matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/g)];
    assert.equal(styles.at(-1)?.[1], '/site-typography.css?v=1', file);
  }
});

test('the supplied fonts are self-hosted with their original licenses', () => {
  const css = read('site-typography.css');
  const assets = [...css.matchAll(/url\('([^']+)'\)/g)].map(match => match[1].slice(1));
  assert.equal(assets.length, 3);
  for (const asset of assets) {
    assert.ok(statSync(new URL(asset, root)).size > 1000, asset);
    assert.match(read(asset.replace(/[^/]+$/, 'OFL.txt')), /SIL OPEN FONT LICENSE/);
  }
  assert.match(css, /font-synthesis: none/);
  assert.match(css, /--font-display: "Idiqlat"/);
  assert.match(css, /--font-heading: "Tiro Gurmukhi"/);
  assert.match(css, /--font-ui: "Instrument Sans"/);
  assert.match(css, /\.home-final h2, \.score \{[^}]+font-weight: 400 !important;[^}]+font-style: normal !important;[^}]+letter-spacing: normal !important;/);
});

test('shared result images use the same font families without bolding Idiqlat', () => {
  for (const file of ['app-public-sans.js', 'app-histi120.js']) {
    const js = read(file);
    assert.doesNotMatch(js, /Public Sans/);
    assert.match(js, /400 58px "Idiqlat"/);
    assert.match(js, /400 25px "Tiro Gurmukhi"/);
    assert.match(js, /600 16px "Instrument Sans"/);
    assert.doesNotMatch(js, /[5-9]\d{2} \d+px "Idiqlat"/);
  }
});
