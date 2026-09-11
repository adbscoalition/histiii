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

const D_RISK_THRESHOLDS = {
  public: { label: 'Public', caution: 0, warning: 0 },
  acquaintance: { label: 'Acquaintance', caution: 0, warning: 1 },
  friend: { label: 'Friend', caution: 2, warning: 4 },
  partner: { label: 'Spouse / Partner', caution: 6, warning: 8 },
  'close-family': { label: 'Family', caution: 6, warning: 8 }
};

const $ = id => document.getElementById(id);
const els = {
  app: $('app'), intro: $('intro-screen'), recipient: $('recipient-screen'), assessment: $('assessment-screen'), results: $('results-screen'),
  progress: $('progress-label'), progressTrack: $('progress-track'), progressFill: $('progress-fill'), reset: $('reset-btn'),
  accessibility: $('accessibility-btn'), accessibilityPanel: $('accessibility-panel'),
  debugHotspot: $('debug-hotspot'), debugPanel: $('debug-panel'), debugRandomLast: $('debug-random-last'),
  debugQuestion: $('debug-question'), debugJump: $('debug-jump'),
  finishSequence: $('finish-sequence'), finishCalculating: $('finish-calculating'), finishScore: $('finish-score'), finishBlackout: $('finish-blackout'),
  a11yTextValue: $('a11y-text-value'), a11yReadingValue: $('a11y-reading-value'),
  a11yContrastValue: $('a11y-contrast-value'), a11ySpacingValue: $('a11y-spacing-value'), a11yMotionValue: $('a11y-motion-value'),
  begin: $('begin-btn'), startStatus: $('start-status'), startDisclosure: $('start-disclosure-btn'),
  disclosurePanel: $('disclosure-panel'), disclosureClose: $('disclosure-close'), disclosureDone: $('disclosure-done'),
  bottomUtility: $('bottom-utility'), footerDisclosure: $('footer-disclosure-btn'), footerReset: $('footer-reset-btn'),
  recipientList: $('recipient-list'), recipientLabel: $('recipient-label'),
  recipientBack: $('recipient-back'), start: $('start-btn'), recipientContext: $('recipient-context'), questionCode: $('question-code'),
  questionTitle: $('question-title'), questionHelp: $('question-help'), risk: $('risk-note'), rubricList: $('rubric-list'), statusList: $('status-list'),
  back: $('back-btn'), next: $('next-btn'), resultScore: $('result-score'), resultNote: $('result-note'), categoryResults: $('category-results'),
  warningCard: $('result-warning-card'), warningLevel: $('result-warning-level'), warningScore: $('result-warning-score'),
  warningTitle: $('result-warning-title'), warningText: $('result-warning-text'),
  share: $('share-btn'), review: $('review-btn'), restart: $('restart-btn'), shareStatus: $('share-status')
};

let questions = [];
let state = loadState() || freshState();
let saveTimer = null;
let saveDirty = false;
let finishSequenceRunning = false;

function freshState() {
  return {
    screen: 'intro',
    recipientType: '',
    recipientLabel: '',
    index: 0,
    answers: {},
    accessibility: { reading: 'standard', textSize: 'standard', contrast: false, spacing: false, motion: true },
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
    a = {
      status: 'SCORE',
      selected: [],
      weight: q.suggestedWeight,
      visited: false,
      answered: false,
      explicitNone: false,
      fullByAll: false
    };
    state.answers[q.code] = a;
  }
  if (typeof a.answered !== 'boolean') {
    a.answered = a.status !== 'SCORE' || (a.selected || []).length > 0 || a.explicitNone === true;
  }
  if (typeof a.explicitNone !== 'boolean') a.explicitNone = false;
  if (typeof a.fullByAll !== 'boolean') a.fullByAll = false;
  return a;
}

function assignedWeight(a) {
  if (a.weight === '' || a.weight === null || typeof a.weight === 'undefined') return null;
  const n = Number(a.weight);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function disclosurePct(q, a) {
  if (a.status !== 'SCORE' || !a.answered) return 0;
  const selected = new Set(a.selected || []);
  if (a.fullByAll) return 100;
  const hasLiteralAll = [...selected].some(idx => /\ball\b/i.test(String(q.rubric[idx]?.trigger || '')));
  if (hasLiteralAll) return 100;
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
      if (w === null || !a.answered) continue;
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

function lowerFirst(value) {
  const s = String(value || '').trim();
  return s ? s[0].toLowerCase() + s.slice(1) : s;
}

function humanRubricPhrase(value) {
  let s = cleanRubricBase(value)
    .replace(/\//g, ' or ')
    .replace(/\s+/g, ' ')
    .trim();

  s = s
    .replace(/^Confirms\s+/i, 'that ')
    .replace(/^Identifies\s+/i, '')
    .replace(/^Gives\s+/i, '')
    .replace(/^Reveals\s+/i, '')
    .replace(/^Discloses\s+/i, '')
    .replace(/^States\s+/i, '')
    .replace(/^Names\s+/i, '')
    .replace(/^Shares\s+/i, '')
    .replace(/^Includes\s+/i, '');

  return lowerFirst(s).replace(/[.]+$/, '');
}

function rubricLabel(q, item, index) {
  const raw = String(item.trigger || '');
  const phrase = humanRubricPhrase(raw);

  if (/Full-detail increment/i.test(raw)) {
    const prior = index > 0 ? humanRubricPhrase(q.rubric[index - 1]?.trigger || '') : '';
    return prior
      ? `I shared the full details for ${prior}.`
      : 'I shared the full details.';
  }

  if (/Partial\/limited evidence toward:/i.test(raw)) {
    return `I shared some details about ${phrase}.`;
  }

  if (/\ball\b/i.test(raw)) {
    return `I shared all of this: ${phrase}.`;
  }

  if (/^Confirms\b/i.test(cleanRubricBase(raw))) {
    return `I mentioned ${phrase}.`;
  }

  if (/^Explains\b/i.test(cleanRubricBase(raw))) {
    return `I explained ${lowerFirst(cleanRubricBase(raw).replace(/^Explains\s+/i, '')).replace(/[.]+$/, '')}.`;
  }

  if (/^Links\b/i.test(cleanRubricBase(raw))) {
    return `I shared how ${lowerFirst(cleanRubricBase(raw).replace(/^Links\s+/i, '')).replace(/[.]+$/, '')}.`;
  }

  return `I shared ${phrase}.`;
}

function topicTitle(q) {
  return String(q.title || 'this topic').replace(/\//g, ' or ').replace(/-/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
}

function recipientName() {
  const fallback = RECIPIENTS.find(r => r[0] === state.recipientType)?.[1] || 'this person';
  return state.recipientLabel.trim() || fallback;
}

function hasCurrentProgress() {
  return !!state.recipientType || state.index > 0 || Object.keys(state.answers || {}).length > 0 || !!state.completedAt;
}

function updateStartScreen() {
  const hasProgress = hasCurrentProgress();
  els.startStatus.hidden = !hasProgress;

  if (!hasProgress) {
    els.begin.textContent = 'Start assessment';
    els.startStatus.textContent = '';
    return;
  }

  if (state.completedAt) {
    els.begin.textContent = 'View saved result';
    els.startStatus.textContent = 'A completed result is saved on this device.';
    return;
  }

  const answered = Object.values(state.answers || {}).filter(a => a && a.visited).length;
  els.begin.textContent = answered > 0 ? 'Resume assessment' : 'Continue setup';
  els.startStatus.textContent = answered > 0
    ? `Saved progress · question ${Math.min(state.index + 1, questions.length || 263)} of ${questions.length || 263}`
    : 'Your setup is saved on this device.';
}

function showScreen(name) {
  for (const [screen, el] of [['intro', els.intro], ['start', els.recipient], ['assessment', els.assessment], ['results', els.results]]) {
    el.hidden = screen !== name;
  }
  const inAssessment = name === 'assessment';
  els.progress.hidden = !inAssessment;
  els.progressTrack.hidden = !inAssessment;
  els.bottomUtility.hidden = inAssessment;
  state.screen = name;
  if (name === 'intro') updateStartScreen();
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

function applyAccessibility() {
  const a = state.accessibility;
  document.body.classList.toggle('a11y-large', a.textSize === 'large');
  document.body.classList.toggle('a11y-contrast', !!a.contrast);
  document.body.classList.toggle('a11y-spacing', !!a.spacing);
  document.body.classList.toggle('reduce-motion', a.motion === false);

  els.a11yTextValue.textContent = a.textSize === 'large' ? 'Large' : 'Standard';
  els.a11yReadingValue.textContent = a.reading === 'simple' ? 'Simpler' : 'Standard';
  els.a11yContrastValue.textContent = a.contrast ? 'On' : 'Off';
  els.a11ySpacingValue.textContent = a.spacing ? 'On' : 'Off';
  els.a11yMotionValue.textContent = a.motion === false ? 'Off' : 'On';

  if (state.screen === 'assessment' && questions.length) renderQuestion();
}

function toggleAccessibilityOption(key) {
  const a = state.accessibility;
  if (key === 'textSize') a.textSize = a.textSize === 'large' ? 'standard' : 'large';
  else if (key === 'reading') a.reading = a.reading === 'simple' ? 'standard' : 'simple';
  else if (key === 'contrast') a.contrast = !a.contrast;
  else if (key === 'spacing') a.spacing = !a.spacing;
  else if (key === 'motion') a.motion = a.motion === false;
  applyAccessibility();
  scheduleSave();
}

function openDisclosure() {
  els.accessibilityPanel.hidden = true;
  els.debugPanel.hidden = true;
  els.disclosurePanel.hidden = true;
  els.accessibility.setAttribute('aria-expanded', 'false');
  els.disclosurePanel.hidden = false;
}

function closeDisclosure() {
  els.disclosurePanel.hidden = true;
}

function enterFromStart() {
  if (state.completedAt) {
    renderResults();
    return;
  }

  const visited = Object.values(state.answers || {}).some(a => a && a.visited);
  if (state.recipientType && visited) {
    state.index = Math.min(Math.max(0, Number(state.index) || 0), questions.length - 1);
    showScreen('assessment');
    renderQuestion();
    saveNow();
    return;
  }

  showScreen('start');
  renderRecipientChoices();
}

let debugTapCount = 0;
let debugTapTimer = null;

function tapDebugHotspot() {
  debugTapCount += 1;
  if (debugTapTimer !== null) clearTimeout(debugTapTimer);
  debugTapTimer = setTimeout(() => { debugTapCount = 0; }, 3500);

  if (debugTapCount >= 7) {
    debugTapCount = 0;
    clearTimeout(debugTapTimer);
    debugTapTimer = null;
    els.accessibilityPanel.hidden = true;
    els.accessibility.setAttribute('aria-expanded', 'false');
    els.debugPanel.hidden = false;
  }
}

function debugRandomToLast() {
  if (!questions.length) return;
  if (!state.recipientType) state.recipientType = 'friend';

  for (let i = 0; i < questions.length - 1; i++) {
    const q = questions[i];
    const a = getAnswer(q);
    a.status = 'SCORE';
    a.weight = q.suggestedWeight;
    a.selected = q.rubric
      .map((_, idx) => Math.random() < 0.48 ? idx : null)
      .filter(Number.isInteger);
    a.visited = true;
    a.answered = true;
    a.explicitNone = false;
    a.fullByAll = false;
  }

  const last = questions[questions.length - 1];
  const lastAnswer = getAnswer(last);
  lastAnswer.status = 'SCORE';
  lastAnswer.weight = last.suggestedWeight;
  lastAnswer.selected = [];
  lastAnswer.visited = true;
  lastAnswer.answered = false;
  lastAnswer.explicitNone = false;
  lastAnswer.fullByAll = false;

  state.index = questions.length - 1;
  state.completedAt = null;
  showScreen('assessment');
  renderQuestion();
  saveNow();
  els.debugPanel.hidden = true;
}

function debugJumpToQuestion() {
  if (!questions.length) return;
  const requested = Number.parseInt(els.debugQuestion?.value || '', 10);
  if (!Number.isFinite(requested) || requested < 1 || requested > questions.length) {
    els.debugQuestion?.focus();
    els.debugQuestion?.select();
    return;
  }

  if (!state.recipientType) state.recipientType = 'friend';
  state.completedAt = null;
  state.index = requested - 1;
  showScreen('assessment');
  renderQuestion();
  saveNow();
  els.debugPanel.hidden = true;
}


function renderQuestion() {
  const q = questions[state.index];
  if (!q) return;
  const a = getAnswer(q);
  a.visited = true;

  els.progress.textContent = `Question ${state.index + 1} of ${questions.length}`;
  els.progressFill.style.width = `${((state.index + 1) / questions.length) * 100}%`;
  els.recipientContext.textContent = recipientName();
  els.questionCode.textContent = q.code;
  els.questionTitle.textContent = `Did you share anything about ${topicTitle(q)}?`;
  els.questionHelp.textContent = state.accessibility.reading === 'simple'
    ? 'Pick what feels true. You can leave this unanswered.'
    : 'Choose what feels closest to what you actually shared. The wording does not have to match perfectly.';
  els.risk.hidden = q.category !== 'D';
  els.back.disabled = state.index === 0;
  els.next.textContent = state.index === questions.length - 1 ? 'Finish' : 'Next';

  const selected = new Set(a.selected || []);
  const enabled = assignedWeight(a) !== null;
  const frag = document.createDocumentFragment();

  const none = document.createElement('button');
  none.type = 'button';
  none.className = 'none-button';
  none.dataset.none = 'true';
  none.setAttribute('aria-pressed', String(a.status === 'SCORE' && a.explicitNone === true));
  const noneText = document.createElement('span');
  noneText.textContent = 'I didn’t share any of these.';
  none.append(noneText);
  frag.append(none);

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
  els.rubricList.style.setProperty('--answer-count', String(q.rubric.length + 1));
  els.rubricList.replaceChildren(frag);

  const card = els.assessment.querySelector('.assessment-card');
  card.classList.toggle('compact', q.rubric.length >= 8);
  card.classList.toggle('ultra-compact', q.rubric.length >= 11);
  syncStatusButtons(a);
}

function syncStatusButtons(a) {
  for (const btn of els.statusList.querySelectorAll('[data-status]')) {
    btn.setAttribute('aria-pressed', String(a.answered && a.status === btn.dataset.status));
  }
}

function toggleRubric(index, button) {
  const q = questions[state.index];
  const a = getAnswer(q);
  const selected = new Set(a.selected || []);
  const raw = String(q.rubric[index]?.trigger || '');
  const wasSelected = selected.has(index);

  if (/\ball\b/i.test(raw)) {
    if (a.fullByAll || wasSelected) {
      selected.clear();
      a.fullByAll = false;
      a.answered = false;
    } else {
      selected.clear();
      selected.add(index);
      a.fullByAll = true;
      a.answered = true;
    }
  } else {
    a.fullByAll = false;
    if (wasSelected) {
      selected.delete(index);
    } else {
      selected.add(index);
      // Full-detail increments are cumulative with their paired partial row.
      if (/Full-detail increment/i.test(raw) && index > 0 && /Partial\/limited evidence/i.test(String(q.rubric[index - 1]?.trigger || ''))) {
        selected.add(index - 1);
      }
    }
    a.answered = selected.size > 0;
  }

  a.selected = [...selected].sort((x, y) => x - y);
  a.status = 'SCORE';
  a.explicitNone = false;

  for (const btn of els.rubricList.querySelectorAll('[data-rubric]')) {
    btn.setAttribute('aria-pressed', String(selected.has(Number(btn.dataset.rubric))));
  }
  const none = els.rubricList.querySelector('[data-none]');
  if (none) none.setAttribute('aria-pressed', 'false');
  syncStatusButtons(a);
  scheduleSave();
}

function setNone() {
  const q = questions[state.index];
  const a = getAnswer(q);
  const turningOff = a.status === 'SCORE' && a.explicitNone === true;

  a.status = 'SCORE';
  a.selected = [];
  a.fullByAll = false;
  a.explicitNone = !turningOff;
  a.answered = !turningOff;

  for (const btn of els.rubricList.querySelectorAll('[data-rubric]')) btn.setAttribute('aria-pressed', 'false');
  const none = els.rubricList.querySelector('[data-none]');
  if (none) none.setAttribute('aria-pressed', String(a.explicitNone));
  syncStatusButtons(a);
  scheduleSave();
}

function setStatus(status) {
  const q = questions[state.index];
  const a = getAnswer(q);
  const turningOff = a.answered && a.status === status;

  a.selected = [];
  a.explicitNone = false;
  a.fullByAll = false;

  if (turningOff) {
    a.status = 'SCORE';
    a.answered = false;
  } else {
    a.status = status;
    a.answered = true;
  }

  for (const btn of els.rubricList.querySelectorAll('[data-rubric]')) btn.setAttribute('aria-pressed', 'false');
  const none = els.rubricList.querySelector('[data-none]');
  if (none) none.setAttribute('aria-pressed', 'false');
  syncStatusButtons(a);
  scheduleSave();
}

let questionTransitioning = false;

function go(delta) {
  saveNow();
  const next = state.index + delta;
  if (next < 0 || next >= questions.length || questionTransitioning) return;

  const card = els.assessment.querySelector('.assessment-card');
  const reduceMotion = state.accessibility.motion === false || window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!card || reduceMotion) {
    state.index = next;
    renderQuestion();
    return;
  }

  questionTransitioning = true;
  const outClass = delta > 0 ? 'question-out-left' : 'question-out-right';
  const inClass = delta > 0 ? 'question-in-right' : 'question-in-left';

  card.classList.remove('question-out-left', 'question-out-right', 'question-in-left', 'question-in-right');
  card.classList.add(outClass);

  window.setTimeout(() => {
    state.index = next;
    renderQuestion();
    card.classList.remove(outClass);
    card.classList.add(inClass);
    window.setTimeout(() => {
      card.classList.remove(inClass);
      questionTransitioning = false;
    }, 230);
  }, 150);
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

function updateResultWarning(result) {
  const d = result.cats.D;
  const threshold = D_RISK_THRESHOLDS[state.recipientType];

  els.warningCard.classList.remove('warning-safe', 'warning-caution', 'warning-warning');

  if (!d || d.points === null) {
    els.warningCard.classList.add('warning-safe');
    els.warningLevel.textContent = 'Category D guidance';
    els.warningScore.textContent = 'D · N/C';
    els.warningTitle.textContent = 'No Category D score to compare';
    els.warningText.textContent = 'Category D was not calculated, so no recipient-specific disclosure warning can be issued.';
    return;
  }

  const dPoints = Number(d.points);
  const scorePrefix = d.pnaCount ? '≥' : '';
  els.warningScore.textContent = `D · ${scorePrefix}${fmt(dPoints)}/10`;

  if (!threshold) {
    els.warningCard.classList.add('warning-safe');
    els.warningLevel.textContent = 'Category D guidance';
    els.warningTitle.textContent = 'No threshold defined for this recipient';
    els.warningText.textContent = 'No Category D caution or warning threshold has been defined for “Other individual.” Review the very sensitive information category directly.';
    return;
  }

  let level = 'safe';
  if (dPoints > threshold.warning) level = 'warning';
  else if (dPoints > threshold.caution) level = 'caution';

  if (level === 'warning') {
    els.warningCard.classList.add('warning-warning');
    els.warningLevel.textContent = 'Warning';
    els.warningTitle.textContent = `High very-sensitive disclosure to ${threshold.label}`;
    els.warningText.textContent =
      `Your Category D score is over the Warning threshold of ${threshold.warning.toFixed(2)}. Very sensitive disclosures can create privacy, security, financial, identity, or personal-safety risk. Consider whether each disclosed item is necessary for this recipient.` +
      (d.pnaCount ? ' This Category D score is a lower bound because at least one item was refused.' : '');
    return;
  }

  if (level === 'caution') {
    els.warningCard.classList.add('warning-caution');
    els.warningLevel.textContent = 'Caution';
    els.warningTitle.textContent = `Elevated very-sensitive disclosure to ${threshold.label}`;
    els.warningText.textContent =
      `Your Category D score is over the Caution threshold of ${threshold.caution.toFixed(2)}. Review whether the very sensitive information you shared is needed, appropriately limited, and safe with this recipient.` +
      (d.pnaCount ? ' This Category D score is a lower bound because at least one item was refused.' : '');
    return;
  }

  els.warningCard.classList.add('warning-safe');
  els.warningLevel.textContent = 'No threshold warning';
  els.warningTitle.textContent = 'No Category D threshold exceeded';
  els.warningText.textContent =
    `Your Category D score does not exceed the Caution threshold of ${threshold.caution.toFixed(2)} for ${threshold.label}. This is guidance only; the sensitivity of a specific disclosure can still matter even below the threshold.` +
    (d.pnaCount ? ' This Category D score is a lower bound because at least one item was refused.' : '');
}

function populateResults(result) {
  const prefix = result.lowerBound ? '≥' : '';
  els.resultScore.textContent = result.overall === null ? 'Not calculated' : `${prefix}${fmt(result.overall)}/100`;
  els.resultNote.textContent = result.overall === null
    ? 'No scored items were included.'
    : result.lowerBound
      ? 'This is a lower bound because one or more items were marked “I refuse to answer.”'
      : 'Your score is calculated locally in this browser.';

  const frag = document.createDocumentFragment();
  for (const cat of Object.keys(CATEGORY_CAPS)) {
    const catResult = result.cats[cat];
    const card = document.createElement('div');
    card.className = 'category-card';
    const label = document.createElement('span');
    label.textContent = `${cat} · ${CATEGORY_NAMES[cat]}`;
    const value = document.createElement('strong');
    value.textContent = catResult.points === null ? 'N/C' : `${catResult.pnaCount ? '≥' : ''}${fmt(catResult.points)}/${catResult.cap}`;
    card.append(label, value);
    frag.append(card);
  }
  els.categoryResults.replaceChildren(frag);
  updateResultWarning(result);
}

function renderResults() {
  const result = compute();
  state.completedAt ||= Date.now();
  populateResults(result);
  showScreen('results');
  saveResultSnapshot(result);
  saveNow();
}

function wait(ms) {
  return new Promise(resolve => window.setTimeout(resolve, ms));
}

function finishMotionEnabled() {
  return state.accessibility.motion !== false &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

async function finishAssessment() {
  if (finishSequenceRunning || questionTransitioning) return;
  finishSequenceRunning = true;

  const result = compute();
  state.completedAt ||= Date.now();
  populateResults(result);
  saveResultSnapshot(result);
  saveNow();

  if (!finishMotionEnabled()) {
    finishSequenceRunning = false;
    showScreen('results');
    return;
  }

  // Finish overlay owns the viewport until the report is ready.
  els.intro.hidden = true;
  els.recipient.hidden = true;
  els.assessment.hidden = true;
  els.results.hidden = true;
  els.progress.hidden = true;
  els.progressTrack.hidden = true;
  els.bottomUtility.hidden = true;
  state.screen = 'results';

  els.finishSequence.hidden = false;
  els.finishBlackout.hidden = true;
  els.finishCalculating.hidden = false;
  els.finishScore.hidden = true;

  // Dedicated 2-second calculating phase. No result is shown here.
  await wait(2000);

  // Fade fully to black for 250 ms.
  els.finishBlackout.hidden = false;
  await els.finishBlackout.animate(
    [{ opacity: 0 }, { opacity: 1 }],
    { duration: 250, easing: 'linear', fill: 'forwards' }
  ).finished.catch(() => {});

  // Cut to the report while the viewport is fully black.
  els.finishSequence.hidden = true;
  els.finishCalculating.hidden = true;
  showScreen('results');

  // Keep the score hidden until the final report is fully revealed.
  const finalScoreText = els.resultScore.textContent;
  els.resultScore.textContent = '';
  els.resultScore.style.opacity = '0';

  els.results.classList.remove('report-enter');
  void els.results.offsetWidth;
  els.results.classList.add('report-enter');

  // Reveal the already-switched report over the next 250 ms.
  await els.finishBlackout.animate(
    [{ opacity: 1 }, { opacity: 0 }],
    { duration: 250, easing: 'linear', fill: 'forwards' }
  ).finished.catch(() => {});

  els.finishBlackout.hidden = true;

  // Only now reveal the result itself.
  if (result.overall !== null) {
    const exactScore = Math.max(0, Math.min(100, Number(result.overall) || 0));
    const wholeScore = Math.floor(exactScore);
    const prefix = result.lowerBound ? '≥' : '';

    els.resultScore.textContent = `${prefix}0/100`;
    await els.resultScore.animate(
      [
        { opacity: 0, transform: 'translateY(4px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ],
      { duration: 240, easing: 'cubic-bezier(.22,.72,.24,1)', fill: 'forwards' }
    ).finished.catch(() => {});
    els.resultScore.style.opacity = '1';

    await wait(300);

    for (let value = 1; value <= wholeScore; value += 1) {
      els.resultScore.textContent = `${prefix}${value}/100`;
      await wait(10);
    }
    els.resultScore.textContent = finalScoreText;
  } else {
    els.resultScore.textContent = finalScoreText;
    await els.resultScore.animate(
      [{ opacity: 0 }, { opacity: 1 }],
      { duration: 240, easing: 'ease-out', fill: 'forwards' }
    ).finished.catch(() => {});
    els.resultScore.style.opacity = '1';
  }

  window.setTimeout(() => els.results.classList.remove('report-enter'), 360);
  finishSequenceRunning = false;
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
  finishSequenceRunning = false;
  els.finishSequence.hidden = true;
  els.finishBlackout.hidden = true;
  try { localStorage.removeItem(STORAGE_PROGRESS); } catch {}
  state = freshState();
  els.accessibilityPanel.hidden = true;
  els.debugPanel.hidden = true;
  els.disclosurePanel.hidden = true;
  els.accessibility.setAttribute('aria-expanded', 'false');
  applyAccessibility();
  renderRecipientChoices();
  showScreen('intro');
  updateStartScreen();
}

els.app.addEventListener('click', event => {
  const panelClose = event.target.closest('[data-panel-close]');
  if (panelClose) {
    if (panelClose.dataset.panelClose === 'accessibility') {
      els.accessibilityPanel.hidden = true;
      els.accessibility.setAttribute('aria-expanded', 'false');
    } else {
      els.debugPanel.hidden = true;
    }
    return;
  }

  const a11y = event.target.closest('[data-a11y]');
  if (a11y) {
    toggleAccessibilityOption(a11y.dataset.a11y);
    return;
  }

  const recipient = event.target.closest('[data-recipient]');
  if (recipient) { setRecipient(recipient.dataset.recipient); return; }

  const none = event.target.closest('[data-none]');
  if (none) { setNone(); return; }

  const rubric = event.target.closest('[data-rubric]');
  if (rubric && !rubric.disabled) { toggleRubric(Number(rubric.dataset.rubric), rubric); return; }

  const status = event.target.closest('[data-status]');
  if (status) { setStatus(status.dataset.status); return; }

  const id = event.target.closest('button')?.id;
  if (!id) return;
  if (id === 'accessibility-btn') {
    const willOpen = els.accessibilityPanel.hidden;
    els.accessibilityPanel.hidden = !willOpen;
    els.accessibility.setAttribute('aria-expanded', String(willOpen));
    els.debugPanel.hidden = true;
  }
  else if (id === 'debug-hotspot') tapDebugHotspot();
  else if (id === 'debug-random-last') debugRandomToLast();
  else if (id === 'debug-jump') debugJumpToQuestion();
  else if (id === 'start-disclosure-btn' || id === 'footer-disclosure-btn') openDisclosure();
  else if (id === 'disclosure-close' || id === 'disclosure-done') closeDisclosure();
  else if (id === 'footer-reset-btn') resetAll(true);
  else if (id === 'begin-btn') enterFromStart();
  else if (id === 'recipient-back') showScreen('intro');
  else if (id === 'start-btn' && state.recipientType) { state.index = Math.min(Math.max(0, state.index), questions.length - 1); showScreen('assessment'); renderQuestion(); saveNow(); }
  else if (id === 'back-btn') go(-1);
  else if (id === 'next-btn') { if (state.index >= questions.length - 1) finishAssessment(); else go(1); }
  else if (id === 'review-btn') { showScreen('assessment'); renderQuestion(); }
  else if (id === 'restart-btn') resetAll(true);
  else if (id === 'reset-btn') resetAll(true);
  else if (id === 'share-btn') shareResult();
});

els.recipientLabel.addEventListener('input', event => {
  state.recipientLabel = event.target.value;
  scheduleSave();
});

els.debugQuestion?.addEventListener('keydown', event => {
  if (event.key === 'Enter') debugJumpToQuestion();
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
  applyAccessibility();

  // Always return to the calm start screen on load. Saved progress remains available to resume.
  showScreen('intro');
  updateStartScreen();

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


document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  els.accessibilityPanel.hidden = true;
  els.debugPanel.hidden = true;
  els.disclosurePanel.hidden = true;
  els.accessibility.setAttribute('aria-expanded', 'false');
});