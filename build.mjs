import fs from 'node:fs';
import vm from 'node:vm';

const wrapper = fs.readFileSync('index.html', 'utf8');
const payload = fs.readFileSync('histi-payload-clt6.js', 'utf8');

const open = wrapper.lastIndexOf('<script>');
const close = wrapper.lastIndexOf('</script>');
if (open < 0 || close <= open) throw new Error('Runtime patcher script not found');
const patcher = wrapper.slice(open + '<script>'.length, close);

let written = '';
const documentMock = {
  open() {},
  write(value) { written += String(value); },
  close() {},
  body: { innerHTML: '' }
};
const windowMock = {};

const context = vm.createContext({
  window: windowMock,
  document: documentMock,
  console,
  Uint8Array,
  Blob,
  Response,
  DecompressionStream,
  atob,
  setTimeout,
  clearTimeout
});

vm.runInContext(payload, context, { filename: 'histi-payload-clt6.js' });
const result = vm.runInContext(patcher, context, { filename: 'runtime-patcher.js' });
if (result && typeof result.then === 'function') await result;

if (!written.includes('<!doctype html>') || !written.includes('function renderAssessment')) {
  throw new Error('Direct HISTI build did not produce the application document');
}
if (written.includes('__HISTI_B64') || written.includes('DecompressionStream("gzip")') || written.includes('document.write(t)')) {
  throw new Error('Runtime loader unexpectedly survived direct build');
}

fs.rmSync('dist', { recursive:true, force:true });
fs.mkdirSync('dist', { recursive:true });
fs.writeFileSync('dist/index.html', written);
fs.writeFileSync('dist/build-info.json', JSON.stringify({
  mode:'direct-html',
  bytes:Buffer.byteLength(written),
  runtimeLoader:false,
  generatedAt:new Date().toISOString()
}, null, 2));
