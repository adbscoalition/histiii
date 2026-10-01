const trigger = document.getElementById('privacy-live-btn');

if (trigger) {
  const template = document.createElement('template');
  template.innerHTML = `
    <dialog class="h4-proof-dialog" aria-labelledby="h4-proof-title" aria-describedby="h4-proof-intro">
      <div class="h4-proof-head">
        <p class="eyebrow">Privacy proof</p>
        <button class="h4-proof-close" type="button" aria-label="Close privacy proof">Close</button>
      </div>
      <h2 id="h4-proof-title">Your answers stay in this browser.</h2>
      <p id="h4-proof-intro" class="h4-proof-intro">HISTI check-ins save answers and progress locally. Run the page checks below to inspect the browser policy and resources currently visible to this page.</p>
      <p class="h4-proof-safety" role="note"><strong>Reflect on sharing. Don’t share the actual information here.</strong>Never enter passwords, one-time codes, real names, contact details, ID numbers, financial details, medical records, or other identifying information. The questions ask for levels and descriptions, not the information itself. On a shared device, reset your local check-in when you finish.</p>
      <div class="h4-proof-policy" role="note"><strong>Browser-enforced connection policy</strong><code>connect-src 'none'</code><span>This page's Content Security Policy blocks fetch, XHR, WebSocket, EventSource, and sendBeacon connections.</span></div>
      <div class="h4-proof-grid" aria-label="Live privacy checks">
        <article><strong data-proof="connections">Checking…</strong><span>Connection APIs</span></article>
        <article><strong data-proof="forms">Checking…</strong><span>Form submissions</span></article>
        <article><strong data-proof="hosts">Checking…</strong><span>Observed third-party hosts</span></article>
        <article><strong data-proof="cookies">Checking…</strong><span>Page-visible cookies</span></article>
        <article><strong data-proof="storage">Checking…</strong><span>Local HISTI records</span></article>
      </div>
      <p class="h4-proof-result" data-proof="result" role="status">Run the browser check to see the current result.</p>
      <p class="h4-proof-caveat">Static files still load from the website host. This check inspects the page policy and observed resources; it is not a complete network audit. You can confirm in DevTools → Network and Application → Local Storage.</p>
      <div class="h4-proof-actions"><a href="/privacy">Read the privacy policy</a><button class="h4-proof-run" type="button">Run privacy check</button></div>
    </dialog>`;
  const panel = template.content.firstElementChild;
  document.body.append(panel);
  const field = name => panel.querySelector(`[data-proof="${name}"]`);
  const snapshot = () => {
    const policy = document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.content || '';
    const connections = /(?:^|;)\s*connect-src\s+'none'\s*(?:;|$)/i.test(policy);
    const forms = /(?:^|;)\s*form-action\s+'none'\s*(?:;|$)/i.test(policy);
    const hosts = new Set();
    for (const entry of performance.getEntriesByType('resource')) {
      try {
        const url = new URL(entry.name, location.href);
        if ((url.protocol === 'http:' || url.protocol === 'https:') && url.origin !== location.origin && url.host) hosts.add(url.host);
      } catch {}
    }
    let records = null;
    try {
      records = 0;
      for (let index = 0; index < localStorage.length; index++) {
        if (localStorage.key(index)?.startsWith('histi.')) records++;
      }
    } catch { records = null; }
    const cookies = document.cookie ? document.cookie.split(';').filter(Boolean).length : 0;
    return { connections, forms, hosts: [...hosts], records, cookies };
  };
  const run = () => {
    const proof = snapshot();
    field('connections').textContent = proof.connections ? 'Blocked' : 'Not verified';
    field('forms').textContent = proof.forms ? 'Blocked' : 'Not verified';
    field('hosts').textContent = proof.hosts.length ? `${proof.hosts.length}: ${proof.hosts.join(', ')}` : '0';
    field('cookies').textContent = String(proof.cookies);
    field('storage').textContent = proof.records === null ? 'Unavailable' : `${proof.records} local key${proof.records === 1 ? '' : 's'}`;
    const passed = proof.connections && proof.forms && proof.hosts.length === 0 && proof.cookies === 0 && proof.records !== null;
    const result = field('result');
    result.dataset.state = passed ? 'pass' : 'fail';
    result.textContent = passed
      ? 'Current checks pass: connections and forms are blocked, no third-party runtime host or page-visible cookie was observed, and HISTI storage is local.'
      : 'One or more checks need attention. Inspect the values above and the browser Network panel before relying on a local-only claim.';
    trigger.dataset.state = passed ? 'pass' : 'fail';
    trigger.querySelector('#privacy-live-label').textContent = 'Privacy proof';
  };
  const openProof = () => { if (!panel.open) panel.showModal(); run(); };
  trigger.addEventListener('click', openProof);
  document.querySelectorAll('[data-privacy-proof]').forEach(link => {
    link.addEventListener('click', event => { event.preventDefault(); openProof(); });
  });
  if (location.hash === '#privacy-proof') openProof();
  window.addEventListener('hashchange', () => {
    if (location.hash === '#privacy-proof') openProof();
  });
  panel.querySelector('.h4-proof-close').addEventListener('click', () => panel.close());
  panel.querySelector('.h4-proof-run').addEventListener('click', run);
  panel.addEventListener('click', event => { if (event.target === panel) panel.close(); });
  panel.addEventListener('close', () => trigger.focus());
}
