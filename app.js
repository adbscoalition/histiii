const STORAGE_PROGRESS = 'histi.progress.v3';
const STORAGE_RESULTS = 'histi.results.v3';
const CATEGORY_CAPS = { A: 50, B: 20, C: 20, D: 10 };
const CATEGORY_NAMES = {
  A: 'Personal Events',
  B: 'Basic Information',
  C: 'Sensitive Information',
  D: 'Very Sensitive Information'
};
const RECIPIENTS = [
  ['close-family', 'Close family member', 'A parent, sibling, child, or another close relative'],
  ['partner', 'Spouse or partner', 'A spouse, romantic partner, or long-term partner'],
  ['friend', 'Friend', 'Someone you consider a friend'],
  ['acquaintance', 'Acquaintance', 'A coworker, classmate, neighbor, or casual contact'],
  ['other', 'Other individual', 'Any specific person not covered above'],
  ['public', 'General public', 'Optional: a separate public-facing profile']
];

const $ = id => document.getElementById(id);
const els = {
  app: $('app'), intro: $('intro-screen'), recipient: $('recipient-screen'), assessment: $('assessment-screen'), results: $('results-screen'),
  progress: $('progress-label'), reset: $('reset-btn'), begin: $('begin-btn'), recipientList: $('recipient-list'), recipientLabel: $('recipient-label'),
  recipientBack: $('recipient-back'), start: $('start-btn'), recipientContext: $('recipient-context'), questionCode: $('question-code'),
  questionTitle: $('question-title'), questionHelp: $('question-help'), risk: $('risk-note'), rubricList: $('rubric-list'), statusList: $('status-list'),
  back: $('back-btn'), next: $('next-btn'), resultScore: $('result-score'), resultNote: $('result-note'), categoryResults: $('category-results'),
  share: $('share-btn'), review: $('review-btn'), restart: $('restart-btn'), shareStatus: $('share-status')
};

let questions = [];
let state = loadState() || freshState();
let saveTimer = null;
let saveDirty = false;

function freshState() {
  return {
    screen: 'intro',
    recipientType: '',
    recipientLabel: '',
    index: 0,
    answers: {},
    accessibility: { reading: 'standard', textSize: 'standard', contrast: false, spacing: false },
    animationsEnabled: false,
    resultReveal: false,
    completedAt: null
  };
}

function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_PROGRESS) || 'null');
    if (!parsed || parsed.version !== 3 || !parsed.state) return null;
    const next = { ...freshState(), ...parsed.state };
    next.answers = parsed.state.answers || {};
    next.accessibility = { ...freshState().accessibility, ...(parsed.state.accessibility || {}) };
    if (next.screen === 'calculating') next.screen = 'results';
    return next;
  } catch {
    return null;
  }
}

function snapshot() {
  return {
    screen: state.screen,
    recipientType: state.recipientType,
    recipientLabel: state.recipientLabel,
    index: state.index,
    answers: state.answers,
    accessibility: state.accessibility,
    animationsEnabled: false,
    resultReveal: false,
    completedAt: state.completedAt || null
  };
}

function saveNow() {
  if (saveTimer !== null) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  saveDirty = false;
  try {
    localStorage.setItem(STORAGE_PROGRESS, JSON.stringify({ version: 3, savedAt: Date.now(), state: snapshot() }));
  } catch {}
}

function scheduleSave() {
  saveDirty = true;
  if (saveTimer !== null) clearTimeout(saveTimer);
  saveTimer = setTimeout(saveNow, 500);
}

function getAnswer(q) {
  let a = state.answers[q.code];
  if (!a) {
    a = { status: 'SCORE', selected: [], weight: q.suggestedWeight, visited: false };
    state.answers[q.code] = a;
  }
  return a;
}

function assignedWeight(a) {
  if (a.weight === '' || a.weight === null || typeof a.weight === 'undefined') return null;
  const n = Number(a.weight);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function disclosurePct(q, a) {
  if (a.status !== 'SCORE') return 0;
  const selected = new Set(a.selected || []);
  return Math.min(100, q.rubric.reduce((sum, item, idx) => sum + (selected.has(idx) ? Number(item.share) : 0), 0));
}

function compute() {
  const cats = {};
  for (const cat of Object.keys(CATEGORY_CAPS)) {
    const qs = questions.filter(q => q.category === cat);
    let includedWeight = 0;
    let achievedWeight = 0;
    let pnaCount = 0;
    for (const q of qs) {
      const a = getAnswer(q);
      const w = assignedWeight(a);
      if (w === null) continue;
      if (a.status === 'SCORE' || a.status === 'PNA') {
        includedWeight += w;
        if (a.status === 'PNA') pnaCount++;
        else achievedWeight += w * (disclosurePct(q, a) / 100);
      }
    }
    const ratio = includedWeight > 0 ? achievedWeight / includedWeight : null;
    cats[cat] = {
      ratio,
      points: ratio === null ? null : ratio * CATEGORY_CAPS[cat],
      cap: CATEGORY_CAPS[cat],
      pnaCount
    };
  }
  const active = Object.values(cats).filter(c => c.ratio !== null);
  const activeCap = active.reduce((sum, c) => sum + c.cap, 0);
  const rawPoints = active.reduce((sum, c) => sum + c.points, 0);
  return {
    cats,
    overall: activeCap > 0 ? (rawPoints / activeCap) * 100 : null,
    lowerBound: active.some(c => c.pnaCount > 0)
  };
}

function cleanRubricBase(value) {
  return String(value || '')
    .replace(/^\d+[A-Z]?\.\s*/, '')
    .replace(/^Partial\/limited evidence toward:\s*/i, '')
    .replace(/^Full-detail increment\s*[—-]\s*/i, '')
    .replace(/^completes\s+\d+[A-Z]?\s+with\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function rubricLabel(q, item, index) {
  const raw = String(item.trigger || '');
  if (/Full-detail increment/i.test(raw)) {
    const prev = index > 0 ? cleanRubricBase(q.rubric[index - 1].trigger) : 'the previous detail';
    return `Exact or complete details for: ${prev}`;
  }
  if (/Partial\/limited evidence toward:/i.test(raw)) return `Some detail about: ${cleanRubricBase(raw)}`;
  return cleanRubricBase(raw)
    .replace(/^Confirms\s+/i, 'That ')
    .replace(/^Identifies\s+/i, 'Who: ')
    .replace(/^Gives\s+/i, 'Shared ')
    .replace(/^Reveals\s+/i, 'Shared ')
    .replace(/^Shares\s+/i, 'Shared ')
    .replace(/^Includes\s+/i, 'Included ');
}

function topicTitle(q) {
  return String(q.title || 'this topic').replace(/\//g, ' or ').replace(/-/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
}

function recipientName() {
  const fallback = RECIPIENTS.find(r => r[0] === state.recipientType)?.[1] || 'this person';
  return state.recipientLabel.trim() || fallback;
}

function showScreen(name) {
  for (const [screen, el] of [['intro', els.intro], ['start', els.recipient], ['assessment', els.assessment], ['results', els.results]]) {
    el.hidden = screen !== name;
  }
  els.progress.hidden = name !== 'assessment';
  state.screen = name;
}

function renderRecipientChoices() {
  const frag = document.createDocumentFragment();
  for (const [id, title, help] of RECIPIENTS) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'choice-button';
    btn.dataset.recipient = id;
    btn.setAttribute('aria-pressed', String(state.recipientType === id));
    const strong = document.createElement('strong');
    strong.textContent = title;
    const span = document.createElement('span');
    span.textContent = help;
    btn.append(strong, span);
    frag.append(btn);
  }
  els.recipientList.replaceChildren(frag);
  els.recipientLabel.value = state.recipientLabel || '';
  els.start.disabled = !state.recipientType;
}

function setRecipient(id) {
  state.recipientType = id;
  for (const btn of els.recipientList.querySelectorAll('[data-recipient]')) {
    btn.setAttribute('aria-pressed', String(btn.dataset.recipient === id));
  }
  els.start.disabled = false;
  scheduleSave();
}

function renderQuestion() {
  const q = questions[state.index];
  if (!q) return;
  const a = getAnswer(q);
  a.visited = true;

  els.progress.textContent = `Question ${state.index + 1} of ${questions.length}`;
  els.recipientContext.textContent = `Thinking about ${recipientName()}`;
  els.questionCode.textContent = q.code;
  els.questionTitle.textContent = `What did you share about ${topicTitle(q)}?`;
  els.questionHelp.textContent = 'Pick the details you remember sharing. If none fit, leave every detail unselected.';
  els.risk.hidden = q.category !== 'D';
  els.back.disabled = state.index === 0;
  els.next.textContent = state.index === questions.length - 1 ? 'Finish' : 'Next';

  const selected = new Set(a.selected || []);
  const enabled = assignedWeight(a) !== null;
  const frag = document.createDocumentFragment();
  q.rubric.forEach((item, idx) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'rubric-button';
    btn.dataset.rubric = String(idx);
    btn.disabled = !enabled;
    btn.setAttribute('aria-pressed', String(a.status === 'SCORE' && selected.has(idx)));
    const span = document.createElement('span');
    span.textContent = rubricLabel(q, item, idx);
    btn.append(span);
    frag.append(btn);
  });
  els.rubricList.replaceChildren(frag);
  syncStatusButtons(a);
}

function syncStatusButtons(a) {
  for (const btn of els.statusList.querySelectorAll('[data-status]')) {
    btn.setAttribute('aria-pressed', String(a.status === btn.dataset.status));
  }
}

function toggleRubric(index, button) {
  const q = questions[state.index];
  const a = getAnswer(q);
  const selected = new Set(a.selected || []);
  if (selected.has(index)) selected.delete(index); else selected.add(index);
  a.selected = [...selected].sort((x, y) => x - y);
  a.status = 'SCORE';
  button.setAttribute('aria-pressed', String(selected.has(index)));
  syncStatusButtons(a);
  scheduleSave();
}

function setStatus(status) {
  const q = questions[state.index];
  const a = getAnswer(q);
  a.status = status;
  if (status !== 'SCORE') a.selected = [];
  for (const btn of els.rubricList.querySelectorAll('[data-rubric]')) btn.setAttribute('aria-pressed', 'false');
  syncStatusButtons(a);
  scheduleSave();
}

function go(delta) {
  saveNow();
  const next = state.index + delta;
  if (next < 0 || next >= questions.length) return;
  state.index = next;
  renderQuestion();
  window.scrollTo(0, 0);
}

function fmt(n) {
  return Number(n).toFixed(2).replace(/\.00$/, '');
}

function saveResultSnapshot(result) {
  if (!state.completedAt || result.overall === null) return;
  try {
    const current = JSON.parse(localStorage.getItem(STORAGE_RESULTS) || '[]');
    const list = Array.isArray(current) ? current : [];
    if (list.some(x => x && x.completedAt === state.completedAt)) return;
    list.unshift({
      completedAt: state.completedAt,
      recipientType: state.recipientType,
      recipientLabel: state.recipientLabel,
      overall: result.overall,
      lowerBound: result.lowerBound,
      categories: Object.fromEntries(Object.entries(result.cats).map(([k, c]) => [k, { points: c.points, cap: c.cap, pnaCount: c.pnaCount }]))
    });
    localStorage.setItem(STORAGE_RESULTS, JSON.stringify(list.slice(0, 12)));
  } catch {}
}

function renderResults() {
  const result = compute();
  state.completedAt ||= Date.now();
  showScreen('results');
  const prefix = result.lowerBound ? '≥' : '';
  els.resultScore.textContent = result.overall === null ? 'Not calculated' : `${prefix}${fmt(result.overall)}/100`;
  els.resultNote.textContent = result.overall === null
    ? 'No scored items were included.'
    : result.lowerBound
      ? 'This is a lower bound because one or more items were marked “Prefer not to answer.”'
      : 'Your score is calculated locally in this browser.';

  const frag = document.createDocumentFragment();
  for (const cat of Object.keys(CATEGORY_CAPS)) {
    const c = result.cats[cat];
    const card = document.createElement('div');
    card.className = 'category-card';
    const label = document.createElement('span');
    label.textContent = `${cat} · ${CATEGORY_NAMES[cat]}`;
    const value = document.createElement('strong');
    value.textContent = c.points === null ? 'N/C' : `${c.pnaCount ? '≥' : ''}${fmt(c.points)}/${c.cap}`;
    card.append(label, value);
    frag.append(card);
  }
  els.categoryResults.replaceChildren(frag);
  saveResultSnapshot(result);
  saveNow();
}

async function shareResult() {
  const result = compute();
  const text = `HISTI — ${recipientName()}\nOverall: ${result.overall === null ? 'Not calculated' : `${result.lowerBound ? '≥' : ''}${fmt(result.overall)}/100`}\nCalculated on-device.`;
  try {
    if (navigator.share) await navigator.share({ title: 'My HISTI result', text });
    else if (navigator.clipboard) await navigator.clipboard.writeText(text);
    else throw new Error('Sharing is unavailable');
    els.shareStatus.textContent = navigator.share ? 'Share sheet opened.' : 'Summary copied.';
  } catch (err) {
    if (err?.name !== 'AbortError') els.shareStatus.textContent = 'Could not share this result.';
  }
}

function resetAll(confirmFirst = true) {
  if (confirmFirst && !window.confirm('Reset this assessment? All answers and current progress will be cleared.')) return;
  if (saveTimer !== null) clearTimeout(saveTimer);
  saveTimer = null;
  saveDirty = false;
  try { localStorage.removeItem(STORAGE_PROGRESS); } catch {}
  state = freshState();
  renderRecipientChoices();
  showScreen('intro');
}

els.app.addEventListener('click', event => {
  const recipient = event.target.closest('[data-recipient]');
  if (recipient) { setRecipient(recipient.dataset.recipient); return; }

  const rubric = event.target.closest('[data-rubric]');
  if (rubric && !rubric.disabled) { toggleRubric(Number(rubric.dataset.rubric), rubric); return; }

  const status = event.target.closest('[data-status]');
  if (status) { setStatus(status.dataset.status); return; }

  const id = event.target.closest('button')?.id;
  if (!id) return;
  if (id === 'begin-btn') { showScreen('start'); renderRecipientChoices(); }
  else if (id === 'recipient-back') showScreen('intro');
  else if (id === 'start-btn' && state.recipientType) { state.index = Math.min(Math.max(0, state.index), questions.length - 1); showScreen('assessment'); renderQuestion(); saveNow(); }
  else if (id === 'back-btn') go(-1);
  else if (id === 'next-btn') { if (state.index >= questions.length - 1) renderResults(); else go(1); }
  else if (id === 'review-btn') { showScreen('assessment'); renderQuestion(); }
  else if (id === 'restart-btn') resetAll(true);
  else if (id === 'reset-btn') resetAll(true);
  else if (id === 'share-btn') shareResult();
});

els.recipientLabel.addEventListener('input', event => {
  state.recipientLabel = event.target.value;
  scheduleSave();
});

window.addEventListener('pagehide', () => { if (saveDirty) saveNow(); });
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && saveDirty) saveNow(); });

async function boot() {
  const response = await fetch('/questions.json', { cache: 'force-cache' });
  if (!response.ok) throw new Error('Could not load question catalogue');
  const data = await response.json();
  questions = Array.isArray(data.questions) ? data.questions : [];
  if (!questions.length) throw new Error('Question catalogue is empty');
  state.index = Math.min(Math.max(0, Number(state.index) || 0), questions.length - 1);
  renderRecipientChoices();

  if (state.screen === 'assessment') { showScreen('assessment'); renderQuestion(); }
  else if (state.screen === 'results') renderResults();
  else if (state.screen === 'start') showScreen('start');
  else showScreen('intro');

  window.__HISTI_DIAG__ = () => ({
    screen: state.screen,
    question: state.index,
    answers: Object.keys(state.answers).length,
    domNodes: document.getElementsByTagName('*').length,
    jsHeap: performance.memory ? {
      used: performance.memory.usedJSHeapSize,
      total: performance.memory.totalJSHeapSize,
      limit: performance.memory.jsHeapSizeLimit
    } : null
  });
}

boot().catch(err => {
  console.error(err);
  els.app.replaceChildren(Object.assign(document.createElement('p'), { textContent: 'HISTI could not load.' }));
});
