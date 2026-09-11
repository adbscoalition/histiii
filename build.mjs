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
