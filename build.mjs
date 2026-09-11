import fs from 'node:fs';
import zlib from 'node:zlib';

const payload = fs.readFileSync('histi-payload-clt6.js', 'utf8');
const chunks = [...payload.matchAll(/"([A-Za-z0-9+/=]{1000,})"/g)].map(m => m[1]);
if (!chunks.length) throw new Error('HISTI payload chunks not found');
const b64 = chunks.join('');
if (b64.length !== 69668) throw new Error('Unexpected payload length: ' + b64.length);

const source = zlib.gunzipSync(Buffer.from(b64, 'base64')).toString('utf8');

fs.rmSync('dist', { recursive:true, force:true });
fs.mkdirSync('dist', { recursive:true });
fs.copyFileSync('index.html', 'dist/index.html');
fs.copyFileSync('histi-payload-clt6.js', 'dist/histi-payload-clt6.js');
fs.writeFileSync('dist/source.txt', source);
fs.writeFileSync('dist/source-stats.json', JSON.stringify({
  payloadChars:b64.length,
  sourceChars:source.length,
  addEventListener:(source.match(/addEventListener/g)||[]).length,
  setTimeout:(source.match(/setTimeout/g)||[]).length,
  requestAnimationFrame:(source.match(/requestAnimationFrame/g)||[]).length,
  innerHTML:(source.match(/innerHTML/g)||[]).length
}, null, 2));


function extractFunction(name) {
  const marker = 'function ' + name;
  const start = source.indexOf(marker);
  if (start < 0) return '// ' + name + ' not found\n';
  const brace = source.indexOf('{', start);
  if (brace < 0) return '// ' + name + ' malformed\n';
  let depth = 0;
  let quote = null;
  let escape = false;
  let templateDepth = 0;
  for (let i = brace; i < source.length; i++) {
    const c = source[i];
    if (escape) { escape = false; continue; }
    if (quote) {
      if (c === '\\') { escape = true; continue; }
      if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') { quote = c; continue; }
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) return source.slice(start, i + 1) + '\n';
    }
  }
  return source.slice(start) + '\n';
}

const names = [
  'saveProgress','applyUISettings','wireAnimationToggle','wireAccessibility',
  'wireDebugPanel','wireSwipeNavigation','animateCardResize','renderAssessment',
  'render','goNext','goBack','leaveQuestion','topbar'
];
let diagnostic = '';
for (const name of names) diagnostic += '\n===== ' + name + ' =====\n' + extractFunction(name);

diagnostic += '\n===== GLOBAL LISTENER/TIMER LINES =====\n' +
  source.split('\n').filter(line =>
    line.includes('addEventListener(') ||
    line.includes('setTimeout(') ||
    line.includes('requestAnimationFrame(') ||
    line.includes('setInterval(')
  ).join('\n');

fs.writeFileSync('dist/diagnostic.txt', diagnostic);
