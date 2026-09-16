import condensedData from './questions-histi120.js';

// Independent storage and administration; original catalogue remains the scoring authority.
const scoreItems = condensedData.scoringItems;
const itemByCode = new Map(scoreItems.map(q => [q.code, q]));
let activeItemCode = null;
function answerItem() { return itemByCode.get(activeItemCode) || itemByCode.get(questions[state.index]?.items[0]); }
function answerRoot() { return [...els.rubricList.querySelectorAll('[data-item-code]')].find(el => el.dataset.itemCode === activeItemCode) || els.rubricList; }

const STORAGE_PROGRESS = 'histi.120.progress.v1';
const STORAGE_RESULTS = 'histi.120.results.v1';
const CATEGORY_CAPS = { A: 50, B: 20, C: 20, D: 10 };
const CATEGORY_NAMES = {
  A: 'Personal Events',
  B: 'Basic Information',
  C: 'Sensitive Information',
  D: 'Very Sensitive Information'
};
const RESULT_DISCLAIMER = 'The score is not fully accurate to true privacy and openness values. HISTI-120 is a reflection tool, not a diagnosis, safety verdict, or measure of character.';
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

const CATEGORY_BOUNDARIES = {
  'A>B': {
    from: 'A',
    to: 'B',
    level: 'caution',
    label: 'Caution',
    title: 'The next section gets more personal.',
    copy: 'Category B covers basic identifying and contact information. Continue at your own pace; choose descriptions only and keep the real details to yourself.',
    skippable: false
  },
  'B>C': {
    from: 'B',
    to: 'C',
    level: 'warning',
    label: 'Warning',
    title: 'You’re about to be asked about sensitive information.',
    copy: 'The next section asks whether you did or would disclose sensitive information. HISTI only asks which description fits — never enter, paste, or repeat the real information.',
    skippable: true
  },
  'C>D': {
    from: 'C',
    to: 'D',
    level: 'warning-strong',
    label: 'Warning',
    title: 'You’re about to be asked about very sensitive information.',
    copy: 'The next section includes especially sensitive topics such as credentials, identifiers, financial details, security information, and other very sensitive data. Keep every real value private; choose descriptions only.',
    skippable: true
  }
};

const $ = id => document.getElementById(id);
const els = {
  app: $('app'), intro: $('intro-screen'), recipient: $('recipient-screen'), handoff: $('handoff-screen'), boundary: $('boundary-screen'), assessment: $('assessment-screen'), results: $('results-screen'),
  progress: $('progress-label'), progressTrack: $('progress-track'), progressFill: $('progress-fill'), reset: $('reset-btn'),
  accessibility: $('accessibility-btn'), accessibilityPanel: $('accessibility-panel'),
  debugPanel: $('debug-panel'), debugRandomLast: $('debug-random-last'),
  debugWatermark: $('debug-watermark'), debugWatermarkToggle: $('debug-watermark-toggle'), debugWatermarkValue: $('debug-watermark-value'),
  debugQuestion: $('debug-question'), debugJump: $('debug-jump'),
  finishSequence: $('finish-sequence'), finishCalculating: $('finish-calculating'), finishScore: $('finish-score'), finishBlackout: $('finish-blackout'),
  a11yTextValue: $('a11y-text-value'), a11yReadingValue: $('a11y-reading-value'),
  a11yContrastValue: $('a11y-contrast-value'), a11ySpacingValue: $('a11y-spacing-value'), a11yMotionValue: $('a11y-motion-value'),
  begin: $('begin-btn'), startStatus: $('start-status'), startDisclosure: $('start-disclosure-btn'),
  disclosurePanel: $('disclosure-panel'), disclosureClose: $('disclosure-close'), disclosureDone: $('disclosure-done'), privacyProofRun: $('privacy-proof-run'), privacyProofResult: $('privacy-proof-result'),
  privacyLive: $('privacy-live-btn'), privacyLiveLabel: $('privacy-live-label'), proofNetworkValue: $('proof-network-value'), proofCookieValue: $('proof-cookie-value'), proofExternalValue: $('proof-external-value'), proofStorageValue: $('proof-storage-value'), privacyProofUpdated: $('privacy-proof-updated'),
  dataExportDialog: $('data-export-dialog'), dataExportClose: $('data-export-close'), dataExportDownload: $('data-export-download'), dataExportCopy: $('data-export-copy'), dataExportView: $('data-export-view'), dataExportRawWrap: $('data-export-raw-wrap'), dataExportRaw: $('data-export-raw'), dataExportStatus: $('data-export-status'),
  bottomUtility: $('bottom-utility'), footerDisclosure: $('footer-disclosure-btn'), footerExport: $('footer-export-btn'), footerReset: $('footer-reset-btn'),
  recipientList: $('recipient-list'), recipientLabel: $('recipient-label'),
  recipientBack: $('recipient-back'), start: $('start-btn'), handoffMessage: $('handoff-message'), handoffTyped: $('handoff-typed'), handoffNext: $('handoff-next'),
  boundaryCard: $('boundary-card'), boundaryLevel: $('boundary-level'), boundaryRoute: $('boundary-route'), boundaryTitle: $('boundary-title'), boundaryCopy: $('boundary-copy'), boundarySkipRight: $('boundary-skip-right'), boundarySkip: $('boundary-skip'), boundaryContinue: $('boundary-continue'),
  sectionSkipDialog: $('section-skip-dialog'), sectionSkipCategory: $('section-skip-category'), sectionSkipReasons: $('section-skip-reasons'), sectionSkipBack: $('section-skip-back'), sectionSkipConfirm: $('section-skip-confirm'),
  questionCode: $('question-code'), answerPrompt: $('answer-prompt'), answerHint: $('answer-hint'),
  questionTitle: $('question-title'), questionHelp: $('question-help'), risk: $('risk-note'), riskTitle: $('risk-title'), riskText: $('risk-text'), rubricList: $('rubric-list'), statusList: $('status-list'),
  back: $('back-btn'), next: $('next-btn'), resultTitle: $('result-title'), resultScore: $('result-score'), resultMarker: $('result-marker'), resultNote: $('result-note'), categoryResults: $('category-results'),
  warningCard: $('result-warning-card'), warningLevel: $('result-warning-level'), warningScore: $('result-warning-score'),
  warningTitle: $('result-warning-title'), warningText: $('result-warning-text'),
  share: $('share-btn'), copyResult: $('copy-result-btn'), review: $('review-btn'), restart: $('restart-btn'), shareStatus: $('share-status')
};

let questions = [];
let state = loadState() || freshState();
let saveTimer = null;
let saveDirty = false;
let finishSequenceRunning = false;
let handoffAnimationFrame = null;
let handoffRevealTimer = null;
let handoffRunId = 0;

function freshState() {
  return {
    screen: 'intro',
    recipientType: '',
    recipientLabel: '',
    observationPeriod: 'past-year',
    index: 0,
    answers: {},
    categorySkips: {},
    boundarySeen: {},
    pendingBoundary: null,
    accessibility: { reading: 'standard', textSize: 'standard', contrast: false, spacing: false, motion: true },
    debugGenerated: false,
    debugWatermarkEnabled: true,
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
    next.categorySkips = parsed.state.categorySkips || {};
    next.boundarySeen = parsed.state.boundarySeen || {};
    next.pendingBoundary = parsed.state.pendingBoundary || null;
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
    observationPeriod: state.observationPeriod,
    index: state.index,
    answers: state.answers,
    categorySkips: state.categorySkips,
    boundarySeen: state.boundarySeen,
    pendingBoundary: state.pendingBoundary,
    accessibility: state.accessibility,
    debugGenerated: !!state.debugGenerated,
    debugWatermarkEnabled: state.debugWatermarkEnabled !== false,
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
  refreshPrivacyProof();
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
  // "Not yet" was removed from the UI. Normalize legacy NA answers back to
  // unanswered SCORE state so a hidden old status cannot affect scoring.
  if (a.status === 'NA') {
    a.status = 'SCORE';
    a.selected = [];
    a.answered = false;
    a.explicitNone = false;
    a.fullByAll = false;
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
  return Math.min(100, q.rubric.reduce((sum, item, idx) => {
    if (!selected.has(idx)) return sum;
    // A selected Full row replaces its paired Partial row for scoring. The
    // Partial remains selected in the UI to show that Full includes it.
    const fullIndex = pairedFullIndex(q, idx);
    if (fullIndex >= 0 && selected.has(fullIndex)) return sum;
    return sum + Number(item.share);
  }, 0));
}

function compute() {
  const cats = {};
  for (const cat of Object.keys(CATEGORY_CAPS)) {
    const skipMode = state.categorySkips?.[cat] || null;
    if (skipMode === 'exclude') {
      cats[cat] = {
        ratio: null,
        points: null,
        cap: CATEGORY_CAPS[cat],
        pnaCount: 0,
        skipMode
      };
      continue;
    }
    if (skipMode === 'private') {
      cats[cat] = {
        ratio: 0,
        points: 0,
        cap: CATEGORY_CAPS[cat],
        pnaCount: 0,
        skipMode
      };
      continue;
    }

    const qs = scoreItems.filter(q => q.category === cat);
    let includedWeight = 0;
    let achievedWeight = 0;
    let pnaCount = 0;
    for (const q of qs) {
      const a = getAnswer(q);
      const w = assignedWeight(a);
      if (w === null || !a.answered) continue;
      if (a.status !== 'SCORE') continue; // NA / NQ / U / refusal / duplicates are exclusions.
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
      pnaCount,
      skipMode: null
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
    .replace(/^Identifies(?: or clearly describes)?\s+/i, '')
    .replace(/^Gives\s+/i, '')
    .replace(/^Reveals\s+/i, '')
    .replace(/^Discloses\s+/i, '')
    .replace(/^States\s+/i, '')
    .replace(/^Names\s+/i, '')
    .replace(/^Shares\s+/i, '')
    .replace(/^Includes\s+/i, '');

  return lowerFirst(s).replace(/[.]+$/, '');
}

function comfortableSensitivePhrase(value) {
  let s = cleanRubricBase(value)
    .replace(/^Core increment\s*[—-]\s*/i, '')
    .replace(/\//g, ' or ')
    .replace(/\s+/g, ' ')
    .trim();

  s = s
    .replace(/^(Confirms|Identifies|Gives|Reveals|Discloses|States|Names|Shares|Includes|Shows)\s+/i, '');

  return lowerFirst(s).replace(/[.]+$/, '');
}

function sensitiveRubricLabel(q, item, index) {
  const raw = String(item.trigger || '');
  const phrase = comfortableSensitivePhrase(raw);

  if (/Full-detail increment/i.test(raw)) {
    const prior = index > 0 ? comfortableSensitivePhrase(q.rubric[index - 1]?.trigger || '') : '';
    return prior
      ? `Closest match: more complete detail about ${prior}.`
      : 'Closest match: more complete detail.';
  }

  if (/Partial\/limited evidence toward:/i.test(raw)) {
    return `Closest match: some detail about ${phrase}.`;
  }

  if (/\ball\b/i.test(raw)) {
    return 'Closest match: all of these descriptions.';
  }

  return `Closest match: ${phrase}.`;
}

function rubricLabel(q, item, index) {
  if (q.category === 'C' || q.category === 'D') return sensitiveRubricLabel(q, item, index);

  const raw = String(item.trigger || '');
  const phrase = humanRubricPhrase(raw);

  if (/Full-detail increment/i.test(raw)) {
    const prior = index > 0 ? humanRubricPhrase(q.rubric[index - 1]?.trigger || '') : '';
    return prior
      ? `I shared the full details about ${prior.replace(/^that\s+/i, 'whether ')}.`
      : 'I shared the full details.';
  }

  if (/Partial\/limited evidence toward:/i.test(raw)) {
    return `I shared some details about ${phrase.replace(/^that\s+/i, 'whether ')}.`;
  }

  if (/\ball\b/i.test(raw)) {
    return `I shared all of this: ${phrase}.`;
  }

  if (/^Confirms\b/i.test(cleanRubricBase(raw))) {
    return `I mentioned ${phrase === 'that the event' ? 'that the event happened' : phrase}.`;
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

function allowsEventNotApplicable(q) {
  if (!q || q.category !== 'A') return false;
  return /event applies within the observation period/i.test(String(q.applicability || '')) || q.code === 'A13';
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
    els.begin.textContent = 'Start check-in';
    els.startStatus.textContent = '';
    return;
  }

  if (state.completedAt) {
    els.begin.textContent = 'View saved result';
    els.startStatus.textContent = 'A completed result is saved on this device.';
    return;
  }

  const answered = Object.values(state.answers || {}).filter(a => a && a.visited).length;
  els.begin.textContent = answered > 0 ? 'Resume check-in' : 'Continue setup';
  els.startStatus.textContent = answered > 0
    ? `Saved progress · question ${Math.min(state.index + 1, questions.length || 120)} of ${questions.length || 120}`
    : 'Your setup is saved on this device.';
}

function showScreen(name) {
  document.title = name === 'assessment' && questions.length
    ? `${state.index + 1} / ${questions.length} | HISTI-120`
    : 'HISTI-120 | Check In';
  for (const [screen, el] of [['intro', els.intro], ['start', els.recipient], ['handoff', els.handoff], ['boundary', els.boundary], ['assessment', els.assessment], ['results', els.results]]) {
    el.hidden = screen !== name;
  }
  const inAssessment = name === 'assessment';
  const immersive = inAssessment || name === 'handoff' || name === 'boundary';
  els.progress.hidden = !inAssessment;
  els.progressTrack.hidden = !inAssessment;
  els.bottomUtility.hidden = immersive;
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

function privacyProofSnapshot() {
  const metaPolicy = document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.content || '';
  const connectionBlocked = /(?:^|;)\s*connect-src\s+'none'\s*(?:;|$)/i.test(metaPolicy);
  const formsBlocked = /(?:^|;)\s*form-action\s+'none'\s*(?:;|$)/i.test(metaPolicy);

  const resources = performance.getEntriesByType('resource')
    .map(entry => {
      try { return new URL(entry.name, location.href); } catch { return null; }
    })
    .filter(Boolean);

  const externalHosts = [...new Set(resources
    .filter(url => url.origin !== location.origin)
    .map(url => url.host))];

  const histiKeys = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('histi.')) histiKeys.push(key);
    }
  } catch {}

  const appCookieCount = document.cookie ? document.cookie.split(';').filter(Boolean).length : 0;

  return {
    pass: connectionBlocked && formsBlocked && externalHosts.length === 0 && appCookieCount === 0,
    connectionBlocked,
    formsBlocked,
    externalHosts,
    histiKeys: histiKeys.sort(),
    resourceCount: resources.length,
    appCookieCount,
    checkedAt: new Date()
  };
}

function renderPrivacyProof(proof) {
  if (!proof) return;

  if (els.privacyLive) {
    els.privacyLive.dataset.state = proof.pass ? 'pass' : 'fail';
    els.privacyLiveLabel.textContent = proof.pass ? 'LIVE · local-only verified' : 'Privacy check needs attention';
  }

  if (els.proofNetworkValue) {
    els.proofNetworkValue.textContent = proof.connectionBlocked ? 'Blocked' : 'Not blocked';
    els.proofNetworkValue.dataset.state = proof.connectionBlocked ? 'pass' : 'fail';
  }
  if (els.proofCookieValue) {
    els.proofCookieValue.textContent = String(proof.appCookieCount);
    els.proofCookieValue.dataset.state = proof.appCookieCount === 0 ? 'pass' : 'fail';
  }
  if (els.proofExternalValue) {
    els.proofExternalValue.textContent = String(proof.externalHosts.length);
    els.proofExternalValue.dataset.state = proof.externalHosts.length === 0 ? 'pass' : 'fail';
  }
  if (els.proofStorageValue) {
    els.proofStorageValue.textContent = `${proof.histiKeys.length} local key${proof.histiKeys.length === 1 ? '' : 's'}`;
    els.proofStorageValue.dataset.state = 'local';
  }
  if (els.privacyProofUpdated) {
    els.privacyProofUpdated.textContent =
      `Live verification · ${proof.checkedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} · ${proof.resourceCount} same-page resource entr${proof.resourceCount === 1 ? 'y' : 'ies'} observed.`;
  }

  if (!els.privacyProofResult) return;
  if (proof.pass) {
    const keys = proof.histiKeys.length ? proof.histiKeys.join(', ') : 'no HISTI data saved yet';
    els.privacyProofResult.textContent =
      `PASS — connection APIs are blocked by CSP, form submission is blocked, this page loaded no third-party runtime resources, and no cookies are visible to the HISTI page. Local HISTI keys: ${keys}.`;
    els.privacyProofResult.dataset.state = 'pass';
  } else {
    const problems = [];
    if (!proof.connectionBlocked) problems.push("connect-src 'none' is not visible in the page policy");
    if (!proof.formsBlocked) problems.push("form-action 'none' is not visible in the page policy");
    if (proof.externalHosts.length) problems.push(`external resource hosts detected: ${proof.externalHosts.join(', ')}`);
    if (proof.appCookieCount) problems.push(`${proof.appCookieCount} cookie(s) visible to the page`);
    els.privacyProofResult.textContent = `CHECK FAILED — ${problems.join('; ') || 'privacy conditions could not be verified'}.`;
    els.privacyProofResult.dataset.state = 'fail';
  }
}

function refreshPrivacyProof() {
  const proof = privacyProofSnapshot();
  renderPrivacyProof(proof);
  return proof;
}

function runPrivacyProof() {
  return refreshPrivacyProof();
}

function openDisclosure() {
  els.accessibilityPanel.hidden = true;
  els.debugPanel.hidden = true;
  els.disclosurePanel.hidden = true;
  els.sectionSkipDialog.hidden = true;
  els.dataExportDialog.hidden = true;
  els.accessibility.setAttribute('aria-expanded', 'false');
  els.disclosurePanel.hidden = false;
  runPrivacyProof();
}

function closeDisclosure() {
  els.disclosurePanel.hidden = true;
}

function enterFromStart() {
  if (state.completedAt) {
    renderResults();
    return;
  }

  if (state.pendingBoundary?.from && state.pendingBoundary?.to) {
    renderCategoryBoundary();
    showScreen('boundary');
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

function handoffRecipientPhrase() {
  const privateLabel = state.recipientLabel.trim();
  if (privateLabel) return privateLabel;

  return {
    'close-family': 'your close family member',
    partner: 'your spouse or partner',
    friend: 'your friend',
    acquaintance: 'an acquaintance',
    other: 'this person',
    public: 'the general public'
  }[state.recipientType] || 'this person';
}

function answerRecipientPhrase() {
  const privateLabel = state.recipientLabel.trim();
  if (privateLabel) return privateLabel;

  return {
    'close-family': 'your close family member',
    partner: 'your spouse or partner',
    friend: 'your friend',
    acquaintance: 'your acquaintance',
    other: 'this person',
    public: 'the general public'
  }[state.recipientType] || 'this person';
}

function handoffMotionEnabled() {
  return state.accessibility.motion !== false &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function cancelHandoffAnimation() {
  handoffRunId += 1;
  if (handoffAnimationFrame !== null) cancelAnimationFrame(handoffAnimationFrame);
  if (handoffRevealTimer !== null) clearTimeout(handoffRevealTimer);
  handoffAnimationFrame = null;
  handoffRevealTimer = null;
}

function startHandoff() {
  cancelHandoffAnimation();
  const runId = handoffRunId;
  const sentence = `Imagine ${handoffRecipientPhrase()} is asking you these questions…`;

  showScreen('handoff');
  els.handoffMessage.setAttribute('aria-label', sentence);
  els.handoffMessage.classList.remove('is-raised', 'is-typing');
  els.handoffTyped.textContent = '';
  els.handoffNext.hidden = true;

  if (!handoffMotionEnabled()) {
    els.handoffTyped.textContent = sentence;
    els.handoffMessage.classList.add('is-raised');
    els.handoffNext.hidden = false;
    return;
  }

  els.handoffMessage.classList.add('is-typing');
  const typeDuration = 1000;

  handoffAnimationFrame = requestAnimationFrame(startTime => {
    const typeFrame = now => {
      if (runId !== handoffRunId || state.screen !== 'handoff') return;
      const progress = Math.min(1, (now - startTime) / typeDuration);
      const characterCount = Math.min(sentence.length, Math.ceil(sentence.length * progress));
      els.handoffTyped.textContent = sentence.slice(0, characterCount);

      if (progress < 1) {
        handoffAnimationFrame = requestAnimationFrame(typeFrame);
        return;
      }

      handoffAnimationFrame = null;
      els.handoffTyped.textContent = sentence;
      els.handoffMessage.classList.remove('is-typing');
      handoffRevealTimer = window.setTimeout(() => {
        if (runId !== handoffRunId || state.screen !== 'handoff') return;
        handoffRevealTimer = null;
        els.handoffMessage.classList.add('is-raised');
        els.handoffNext.hidden = false;
      }, 400);
    };

    typeFrame(startTime);
  });
}

function finishHandoff() {
  cancelHandoffAnimation();
  state.index = 0;
  showScreen('assessment');
  renderQuestion();
  saveNow();
}

function debugWatermarkActive() {
  return !!state.debugGenerated && state.debugWatermarkEnabled !== false;
}

function syncDebugWatermark() {
  const enabled = state.debugWatermarkEnabled !== false;
  if (els.debugWatermark) els.debugWatermark.hidden = !debugWatermarkActive();
  if (els.debugWatermarkValue) els.debugWatermarkValue.textContent = enabled ? 'On' : 'Off';
  const label = els.debugWatermarkToggle?.querySelector('span');
  if (label) label.textContent = enabled ? 'Disable debug watermark' : 'Enable debug watermark';
}

function toggleDebugWatermark() {
  state.debugWatermarkEnabled = state.debugWatermarkEnabled === false;
  syncDebugWatermark();
  scheduleSave();
}

function debugRandomToLast() {
  if (!state.recipientType) state.recipientType = 'friend';
  state.debugGenerated = true;
  for (const domain of questions.slice(0, -1)) {
    for (const code of domain.items) {
      const q = itemByCode.get(code), a = getAnswer(q);
      Object.assign(a, { status: 'SCORE', selected: q.rubric.map((_, i) => i).filter(() => Math.random() < .48), visited: true, answered: true, explicitNone: false, fullByAll: false, debugFilled: true });
    }
  }
  state.index = questions.length - 1;
  state.completedAt = null;
  showScreen('assessment'); renderQuestion(); syncDebugWatermark(); saveNow();
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
  state.pendingBoundary = null;
  state.index = requested - 1;
  showScreen('assessment');
  renderQuestion();
  saveNow();
  els.debugPanel.hidden = true;
}

function firstIndexForCategory(category) {
  return questions.findIndex(q => q.category === category);
}

function lastIndexForCategory(category) {
  for (let i = questions.length - 1; i >= 0; i -= 1) {
    if (questions[i]?.category === category) return i;
  }
  return -1;
}

function debugJumpToSection(category) {
  const target = firstIndexForCategory(category);
  if (target < 0) return;
  if (!state.recipientType) state.recipientType = 'friend';
  state.completedAt = null;
  state.pendingBoundary = null;
  if (state.categorySkips?.[category]) delete state.categorySkips[category];
  state.index = target;
  showScreen('assessment');
  renderQuestion();
  saveNow();
  els.debugPanel.hidden = true;
}

function debugPreviewBoundary(value) {
  const [from, to] = String(value || '').split('-');
  if (!CATEGORY_BOUNDARIES[`${from}>${to}`]) return;
  if (!state.recipientType) state.recipientType = 'friend';
  state.completedAt = null;
  els.debugPanel.hidden = true;
  openCategoryBoundary(from, to, { force: true });
}


function periodLabel() {
  return ({ 'past-year': 'the past year', 'past-month': 'the past month', 'past-week': 'the past week', relationship: 'this relationship' })[state.observationPeriod] || 'the past year';
}

function condensedButton(text, className, dataset) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  Object.assign(button.dataset, dataset);
  button.setAttribute('aria-pressed', 'false');
  const span = document.createElement('span');
  span.textContent = text;
  button.append(span);
  return button;
}

function syncCondensedItem(q) {
  const panel = [...els.rubricList.querySelectorAll('[data-item-code]')].find(el => el.dataset.itemCode === q.code);
  if (!panel) return;
  const a = getAnswer(q), selected = new Set(a.selected || []);
  for (const button of panel.querySelectorAll('[data-rubric]')) {
    button.setAttribute('aria-pressed', String(a.status === 'SCORE' && selected.has(Number(button.dataset.rubric))));
  }
  panel.querySelector('[data-none]').setAttribute('aria-pressed', String(a.status === 'SCORE' && a.explicitNone));
  panel.querySelector('[data-not-applicable]').setAttribute('aria-pressed', String(a.status === 'NAPP' && a.answered));
  panel.querySelector('[data-item-full]').setAttribute('aria-pressed', String(a.status === 'SCORE' && a.fullByAll && a.answered));
  for (const button of panel.querySelectorAll('[data-status]')) button.setAttribute('aria-pressed', String(a.answered && a.status === button.dataset.status));
  panel.querySelector('[data-item-duplicate]').setAttribute('aria-pressed', String(a.status === 'DUP' && a.answered));
  const status = !a.answered ? 'Not assessed' : a.status === 'NAPP' ? 'Not applicable' : a.status === 'U' ? 'Unsure · excluded' : a.status === 'PNA' ? 'Refused · excluded' : a.status === 'DUP' ? 'Already covered · excluded' : a.explicitNone ? 'Nothing shared' : `${fmt(disclosurePct(q, a))}% of listed details`;
  panel.querySelector('.topic-state').textContent = status;
  panel.dataset.answered = String(a.answered);
  syncCondensedDomain();
}

function syncCondensedDomain() {
  const domain = questions[state.index];
  const answers = domain.items.map(code => getAnswer(itemByCode.get(code)));
  const assessed = answers.filter(a => a.answered).length;
  $('domain-completion').textContent = `${assessed} of ${answers.length} topics assessed`;
  for (const button of els.rubricList.querySelectorAll('[data-domain-action]')) {
    const action = button.dataset.domainAction;
    button.setAttribute('aria-pressed', String(answers.every(a => a.answered && (action === 'none' ? a.status === 'SCORE' && a.explicitNone : a.status === action))));
  }
  for (const button of els.statusList.querySelectorAll('[data-status]')) {
    button.setAttribute('aria-pressed', String(answers.every(a => a.answered && a.status === button.dataset.status)));
  }
}

function setDomainAnswer(action) {
  const domain = questions[state.index];
  const allMatch = domain.items.every(code => {
    const a = getAnswer(itemByCode.get(code));
    return a.answered && (action === 'none' ? a.status === 'SCORE' && a.explicitNone : a.status === action);
  });
  if (state.categorySkips?.[domain.category]) delete state.categorySkips[domain.category];
  for (const code of domain.items) {
    const q = itemByCode.get(code), a = getAnswer(q);
    Object.assign(a, { status: allMatch || action === 'none' ? 'SCORE' : action, selected: [], explicitNone: !allMatch && action === 'none', fullByAll: false, answered: !allMatch, visited: true, debugFilled: false });
    syncCondensedItem(q);
  }
  scheduleSave();
}

function setItemFull(q) {
  const a = getAnswer(q), turningOff = a.status === 'SCORE' && a.fullByAll && a.answered;
  if (state.categorySkips?.[q.category]) delete state.categorySkips[q.category];
  Object.assign(a, { status: 'SCORE', selected: turningOff ? [] : q.rubric.map((_, i) => i), explicitNone: false, fullByAll: !turningOff, answered: !turningOff, debugFilled: false });
  syncCondensedItem(q);
  scheduleSave();
}

function renderQuestion() {
  const domain = questions[state.index];
  if (!domain) return;
  activeItemCode = null;
  document.title = `${state.index + 1} / 120 | HISTI-120`;
  const card = els.assessment.querySelector('.assessment-card');
  const sensitive = ['C', 'D'].includes(domain.category);
  card.dataset.category = domain.category;
  card.classList.toggle('sensitive-question', sensitive);
  card.classList.toggle('very-sensitive-question', domain.category === 'D');
  card.classList.remove('compact', 'ultra-compact');
  els.progress.textContent = `Question ${state.index + 1} of 120`;
  els.progressFill.style.width = `${((state.index + 1) / 120) * 100}%`;
  els.questionCode.textContent = `HISTI-120 · ${domain.category} · ${state.index + 1}/120`;
  els.questionTitle.textContent = domain.prompt;
  els.questionHelp.textContent = `Think only about what you deliberately made known to ${answerRecipientPhrase()} during ${periodLabel()}.`;
  els.answerPrompt.textContent = 'Answer together. Adjust each topic if needed.';
  els.answerHint.textContent = 'Open a topic to choose the details you shared. Unassessed topics are excluded.';
  els.risk.hidden = !sensitive;
  els.risk.classList.toggle('risk-critical', domain.category === 'D');
  els.riskTitle.textContent = domain.category === 'D' ? 'Never enter the actual secret or identifier' : 'Keep the real personal details private';
  els.riskText.textContent = 'Choose descriptions of disclosure only. Do not type, paste, attach, or reproduce the actual value, document, image, password, or key.';
  els.back.disabled = state.index === 0;
  els.next.textContent = state.index === 119 ? 'Finish' : 'Next';
  const fragment = document.createDocumentFragment();
  const batch = document.createElement('div');
  batch.className = 'domain-quick-actions';
  batch.append(condensedButton('I shared nothing in this question', 'none-button', { domainAction: 'none' }), condensedButton('None of these topics apply', 'none-button', { domainAction: 'NAPP' }));
  fragment.append(batch);
  const meta = document.createElement('div');
  meta.className = 'domain-meta';
  const completion = document.createElement('strong');
  completion.id = 'domain-completion';
  completion.setAttribute('aria-live', 'polite');
  const hint = document.createElement('span');
  hint.textContent = 'Tap a topic to expand ↓';
  meta.append(completion, hint);
  fragment.append(meta);
  for (const code of domain.items) {
    const q = itemByCode.get(code), a = getAnswer(q);
    a.visited = true;
    // Repair cumulative full/partial prerequisites without inventing disclosure.
    const selected = new Set(a.selected || []);
    q.rubric.forEach((r, i) => {
      if (selected.has(i) && /Full-detail increment/i.test(r.trigger) && /Partial\/limited evidence/i.test(q.rubric[i - 1]?.trigger || '')) selected.add(i - 1);
    });
    a.selected = [...selected].sort((x, y) => x - y);
    const panel = document.createElement('details');
    panel.className = 'condensed-topic';
    panel.dataset.itemCode = code;
    // A single-topic question needs no extra expansion step.
    panel.open = domain.items.length === 1;
    const summary = document.createElement('summary');
    const title = document.createElement('strong');
    title.textContent = q.title;
    const badge = document.createElement('span');
    badge.className = 'topic-state';
    summary.append(title, badge);
    const body = document.createElement('div');
    body.className = 'topic-body';
    const description = document.createElement('p');
    description.className = 'topic-description';
    description.textContent = q.description;
    const quick = document.createElement('div');
    quick.className = 'topic-quick-actions';
    quick.append(condensedButton('Nothing shared', 'none-button', { none: 'true' }), condensedButton('Not applicable', 'none-button', { notApplicable: 'true' }), condensedButton('I shared every detail listed below', 'none-button', { itemFull: 'true' }));
    const options = document.createElement('div');
    options.className = 'topic-rubrics';
    let row;
    q.rubric.forEach((item, i) => {
      if (i % 2 === 0) {
        row = document.createElement('div');
        row.className = 'answer-choice-row';
        options.append(row);
      }
      row.append(condensedButton(rubricLabel(q, item, i), 'rubric-button', { rubric: String(i) }));
    });
    const exclusions = document.createElement('div');
    exclusions.className = 'topic-exclusions';
    exclusions.append(condensedButton('I don’t know', 'none-button', { status: 'U' }), condensedButton('I’d rather not answer', 'none-button', { status: 'PNA' }), condensedButton('Already covered by a more specific topic', 'none-button', { itemDuplicate: 'true' }));
    const note = document.createElement('p');
    note.className = 'topic-note';
    note.textContent = `${code} · Original v2.8 rubric. Count each detail only once: if a more specific topic already captures it, leave the broader duplicate excluded. Unknown, refused, and not-applicable topics are not zero-sharing scores.`;
    body.append(description, quick, options, exclusions, note);
    panel.append(summary, body);
    fragment.append(panel);
  }
  els.rubricList.classList.remove('has-zero-pair');
  els.rubricList.replaceChildren(fragment);
  els.rubricList.scrollTop = 0;
  card.scrollTop = 0;
  for (const code of domain.items) syncCondensedItem(itemByCode.get(code));
}

function syncStatusButtons(a) {
  for (const btn of els.statusList.querySelectorAll('[data-status]')) {
    btn.setAttribute('aria-pressed', String(a.answered && a.status === btn.dataset.status));
  }
}

function pairedFullIndex(q, partialIndex) {
  const partialRaw = String(q.rubric[partialIndex]?.trigger || '');
  const match = partialRaw.match(/^(\d+)A\.\s*/i);
  if (!match || !/Partial\/limited evidence/i.test(partialRaw)) return -1;

  const pairPrefix = match[1];
  return q.rubric.findIndex((item, itemIndex) => {
    if (itemIndex <= partialIndex) return false;
    const raw = String(item?.trigger || '');
    return new RegExp(`^${pairPrefix}B\\.\\s*`, 'i').test(raw) &&
      /Full-detail increment/i.test(raw);
  });
}

function toggleRubric(index, button) {
  const q = answerItem();
  if (q && state.categorySkips?.[q.category]) delete state.categorySkips[q.category];
  const a = getAnswer(q);
  a.debugFilled = false;
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

      // Partial is the prerequisite for its paired Full condition.
      // Removing Partial must also remove Full so state cannot become contradictory.
      const fullIndex = pairedFullIndex(q, index);
      if (fullIndex >= 0) selected.delete(fullIndex);
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

  for (const btn of answerRoot().querySelectorAll('[data-rubric]')) {
    btn.setAttribute('aria-pressed', String(selected.has(Number(btn.dataset.rubric))));
  }
  const none = answerRoot().querySelector('[data-none]');
  if (none) none.setAttribute('aria-pressed', 'false');
  const notApplicable = answerRoot().querySelector('[data-not-applicable]');
  if (notApplicable) notApplicable.setAttribute('aria-pressed', 'false');
  syncCondensedItem(q);
  scheduleSave();
}

function setNone() {
  const q = answerItem();
  if (q && state.categorySkips?.[q.category]) delete state.categorySkips[q.category];
  const a = getAnswer(q);
  a.debugFilled = false;
  const turningOff = a.status === 'SCORE' && a.explicitNone === true;

  a.status = 'SCORE';
  a.selected = [];
  a.fullByAll = false;
  a.explicitNone = !turningOff;
  a.answered = !turningOff;

  for (const btn of answerRoot().querySelectorAll('[data-rubric]')) btn.setAttribute('aria-pressed', 'false');
  const none = answerRoot().querySelector('[data-none]');
  if (none) none.setAttribute('aria-pressed', String(a.explicitNone));
  const notApplicable = answerRoot().querySelector('[data-not-applicable]');
  if (notApplicable) notApplicable.setAttribute('aria-pressed', 'false');
  syncCondensedItem(q);
  scheduleSave();
}

function setEventNotApplicable() {
  const q = answerItem();
  if (!q) return;
  if (state.categorySkips?.[q.category]) delete state.categorySkips[q.category];

  const a = getAnswer(q);
  a.debugFilled = false;
  const turningOff = a.status === 'NAPP' && a.answered;

  a.selected = [];
  a.explicitNone = false;
  a.fullByAll = false;

  if (turningOff) {
    a.status = 'SCORE';
    a.answered = false;
  } else {
    a.status = 'NAPP';
    a.answered = true;
  }

  for (const btn of answerRoot().querySelectorAll('[data-rubric]')) {
    btn.setAttribute('aria-pressed', 'false');
  }
  const none = answerRoot().querySelector('[data-none]');
  if (none) none.setAttribute('aria-pressed', 'false');
  const notApplicable = answerRoot().querySelector('[data-not-applicable]');
  if (notApplicable) notApplicable.setAttribute('aria-pressed', String(a.status === 'NAPP' && a.answered));
  syncCondensedItem(q);
  scheduleSave();
}

function setStatus(status) {
  const q = answerItem();
  if (q && state.categorySkips?.[q.category]) delete state.categorySkips[q.category];
  const a = getAnswer(q);
  a.debugFilled = false;
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

  for (const btn of answerRoot().querySelectorAll('[data-rubric]')) btn.setAttribute('aria-pressed', 'false');
  const none = answerRoot().querySelector('[data-none]');
  if (none) none.setAttribute('aria-pressed', 'false');
  const notApplicable = answerRoot().querySelector('[data-not-applicable]');
  if (notApplicable) notApplicable.setAttribute('aria-pressed', 'false');
  syncCondensedItem(q);
  scheduleSave();
}

function boundaryKey(from, to) {
  return `${from}>${to}`;
}

function renderCategoryBoundary() {
  const pending = state.pendingBoundary;
  if (!pending) return;
  const config = CATEGORY_BOUNDARIES[pending.key];
  if (!config) return;

  els.boundaryCard.dataset.level = config.level;
  els.boundaryLevel.textContent = config.label;
  els.boundaryRoute.textContent = `${config.from} → ${config.to}`;
  els.boundaryTitle.textContent = config.title;
  els.boundaryCopy.textContent = config.copy;
  els.boundarySkip.hidden = !config.skippable;
  els.boundarySkipRight.hidden = !config.skippable;
}

function openCategoryBoundary(from, to, { force = false } = {}) {
  const key = boundaryKey(from, to);
  const config = CATEGORY_BOUNDARIES[key];
  if (!config) return false;
  if (!force && state.boundarySeen?.[key]) return false;

  const targetIndex = firstIndexForCategory(to);
  if (targetIndex < 0) return false;

  state.pendingBoundary = { key, from, to, targetIndex };
  renderCategoryBoundary();
  showScreen('boundary');
  saveNow();
  return true;
}

function continueCategoryBoundary() {
  const pending = state.pendingBoundary;
  if (!pending) return;

  state.boundarySeen[pending.key] = true;
  if (pending.to === 'C' || pending.to === 'D') delete state.categorySkips[pending.to];
  const target = Number(pending.targetIndex);
  state.pendingBoundary = null;
  state.index = Number.isFinite(target) ? target : firstIndexForCategory(pending.to);
  showScreen('assessment');
  renderQuestion();
  saveNow();
}

function openSectionSkipDialog() {
  const pending = state.pendingBoundary;
  const config = pending ? CATEGORY_BOUNDARIES[pending.key] : null;
  if (!pending || !config?.skippable || !['C', 'D'].includes(pending.to)) return;

  els.sectionSkipCategory.textContent = pending.to;
  for (const input of els.sectionSkipReasons.querySelectorAll('input[name="section-skip-reason"]')) input.checked = false;
  els.sectionSkipConfirm.disabled = true;
  els.sectionSkipDialog.hidden = false;
}

function closeSectionSkipDialog() {
  els.sectionSkipDialog.hidden = true;
}

function clearCategoryAnswers(category) {
  for (const q of scoreItems) {
    if (q.category === category) delete state.answers[q.code];
  }
}

function confirmSectionSkip() {
  const pending = state.pendingBoundary;
  if (!pending || !['C', 'D'].includes(pending.to)) return;
  const reason = els.sectionSkipReasons.querySelector('input[name="section-skip-reason"]:checked')?.value;
  if (!['exclude', 'private'].includes(reason)) return;

  const category = pending.to;
  state.categorySkips[category] = 'exclude';
  state.boundarySeen[pending.key] = true;
  clearCategoryAnswers(category);
  state.pendingBoundary = null;
  closeSectionSkipDialog();

  if (category === 'C') {
    openCategoryBoundary('C', 'D', { force: true });
    return;
  }

  const lastD = lastIndexForCategory('D');
  if (lastD >= 0) state.index = lastD;
  saveNow();
  finishAssessment();
}

let questionTransitioning = false;

function go(delta) {
  saveNow();
  const next = state.index + delta;
  if (next < 0 || next >= questions.length || questionTransitioning) return;

  const currentQuestion = questions[state.index];
  const nextQuestion = questions[next];
  if (delta > 0 && currentQuestion && nextQuestion && currentQuestion.category !== nextQuestion.category) {
    if (openCategoryBoundary(currentQuestion.category, nextQuestion.category)) return;
  }

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

function directionalValue(score) {
  return Math.max(-100, Math.min(100, (Number(score) - 50) * 2));
}

function directionalScore(score) {
  if (score === null || !Number.isFinite(Number(score))) return 'N/C';
  const value = directionalValue(score);
  if (Math.abs(value) < 0.005) return '0';
  return `${value < 0 ? 'P' : 'O'}${fmt(Math.abs(value))}`;
}

function resultPreference(score) {
  if (score === null || !Number.isFinite(Number(score))) return 'There is not enough information for a result.';
  const value = directionalValue(score);
  const magnitude = Math.abs(value);
  const direction = value < 0 ? 'private' : 'open';
  let degree = 'slightly';
  if (magnitude >= 75) degree = 'strongly';
  else if (magnitude >= 40) degree = 'moderately';
  else if (magnitude >= 12) degree = 'somewhat';
  if (magnitude < 12) return `Your answers sit near the middle for ${answerRecipientPhrase()}.`;
  return `Your answers lean ${degree} ${direction} with ${answerRecipientPhrase()}.`;
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
    observationPeriod: state.observationPeriod,
      overall: result.overall,
      lowerBound: result.lowerBound,
      debugGenerated: !!state.debugGenerated,
      debugWatermarkApplied: debugWatermarkActive(),
      categories: Object.fromEntries(Object.entries(result.cats).map(([k, c]) => [k, { points: c.points, cap: c.cap, pnaCount: c.pnaCount, skipMode: c.skipMode || null }]))
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
    els.warningLevel.textContent = 'Privacy reminder';
    els.warningScore.textContent = 'D · N/C';
    els.warningTitle.textContent = 'No Category D comparison';
    els.warningText.textContent = 'You skipped or did not calculate Category D, so HISTI is not showing an extra very-sensitive-information reminder.';
    return;
  }

  const dPoints = Number(d.points);
  const scorePrefix = d.pnaCount ? '≥' : '';
  els.warningScore.textContent = `D · ${scorePrefix}${fmt(dPoints)}/10`;

  if (!threshold) {
    els.warningCard.classList.add('warning-safe');
    els.warningLevel.textContent = 'Privacy reminder';
    els.warningTitle.textContent = 'Review Category D in context';
    els.warningText.textContent = 'HISTI does not have a comparison rule for this audience. Use your own judgment, keep real sensitive values private, and review any item that matters to you.';
    return;
  }

  let level = 'safe';
  if (dPoints > threshold.warning) level = 'warning';
  else if (dPoints > threshold.caution) level = 'caution';

  const lowerBoundNote = d.pnaCount
    ? ' Because you chose “I’d rather not answer” at least once, your Category D number may be lower than the full picture.'
    : '';

  if (level === 'warning') {
    els.warningCard.classList.add('warning-warning');
    els.warningLevel.textContent = 'Privacy warning';
    els.warningTitle.textContent = `Consider reviewing what you shared with ${threshold.label}`;
    els.warningText.textContent =
      'Your answers suggest that more very sensitive information may have been shared. HISTI cannot tell whether any specific disclosure was necessary, safe, unsafe, helpful, or harmful. If you want, review Category D and keep every real value private.' +
      lowerBoundNote;
    return;
  }

  if (level === 'caution') {
    els.warningCard.classList.add('warning-caution');
    els.warningLevel.textContent = 'Privacy caution';
    els.warningTitle.textContent = 'This may be worth another look';
    els.warningText.textContent =
      `Your answers suggest some very sensitive information may have been shared with ${threshold.label}. This is only a prompt to reflect — not a safety judgment. Review Category D if that would help.` +
      lowerBoundNote;
    return;
  }

  els.warningCard.classList.add('warning-safe');
  els.warningLevel.textContent = 'Privacy note';
  els.warningTitle.textContent = 'No extra Category D alert';
  els.warningText.textContent =
    `Your answers do not trigger HISTI’s extra Category D reminder for ${threshold.label}. That does not certify that any specific disclosure was safe; context still matters.` +
    lowerBoundNote;
}

function populateResults(result) {
  els.resultTitle.textContent = resultPreference(result.overall);
  els.resultScore.textContent = result.overall === null ? 'Not calculated' : directionalScore(result.overall);
  els.resultMarker.hidden = result.overall === null;
  els.resultMarker.style.setProperty('--score-position', `${result.overall === null ? 50 : Math.max(0, Math.min(100, Number(result.overall)))}%`);
  els.resultNote.textContent = result.overall === null
    ? 'No scored items were included.'
    : result.lowerBound
      ? 'This is a lower bound because one or more items were marked “I’d rather not answer.”'
      : 'This reflection is calculated locally in this browser.';

  const frag = document.createDocumentFragment();
  for (const cat of Object.keys(CATEGORY_CAPS)) {
    const catResult = result.cats[cat];
    const card = document.createElement('div');
    card.className = 'category-card';
    if (catResult.ratio === null) card.classList.add('is-not-calculated');
    if (catResult.ratio !== null) card.style.setProperty('--score-position', `${Math.max(0, Math.min(100, catResult.ratio * 100))}%`);
    const top = document.createElement('div');
    top.className = 'category-card-top';
    const badge = document.createElement('span');
    badge.className = 'category-letter';
    badge.textContent = cat;
    const label = document.createElement('span');
    label.className = 'category-name';
    label.textContent = CATEGORY_NAMES[cat] + (catResult.skipMode ? ' · skipped' : '');
    const value = document.createElement('strong');
    value.textContent = catResult.ratio === null ? 'N/C' : directionalScore(catResult.ratio * 100);
    top.append(badge, label, value);
    const miniTrack = document.createElement('div');
    miniTrack.className = 'category-track';
    miniTrack.setAttribute('aria-hidden', 'true');
    const miniMarker = document.createElement('span');
    miniTrack.append(miniMarker);
    card.append(top, miniTrack);
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
  els.handoff.hidden = true;
  els.boundary.hidden = true;
  els.sectionSkipDialog.hidden = true;
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
    const signedTarget = directionalValue(exactScore);
    const wholeScore = Math.floor(Math.abs(signedTarget));
    const direction = signedTarget < 0 ? 'P' : 'O';

    els.resultScore.textContent = '0';
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
      els.resultScore.textContent = `${direction}${value}`;
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

function roundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function canvasLines(ctx, text, maxWidth) {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(candidate).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function loadCanvasImage(src) {
  const loaded = document.querySelector('.brand-logo');
  if (loaded?.complete && loaded.naturalWidth > 0) return Promise.resolve(loaded);
  return new Promise((resolve, reject) => {
    const image = new Image();
    const timeout = window.setTimeout(() => { image.onload = image.onerror = null; reject(new Error('Logo load timed out.')); }, 4000);
    image.onload = () => { clearTimeout(timeout); resolve(image); };
    image.onerror = err => { clearTimeout(timeout); reject(err); };
    image.src = src;
  });
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => reject(new Error('Image encoding timed out.')), 5000);
    canvas.toBlob(blob => { clearTimeout(timeout); blob ? resolve(blob) : reject(new Error('Could not create the result image.')); }, 'image/png');
  });
}

async function createResultImage(result) {
  await Promise.race([document.fonts?.ready, wait(2000)]);
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 1500;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is unavailable.');

  ctx.fillStyle = '#070706';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const glow = ctx.createRadialGradient(1050, 100, 20, 1050, 100, 650);
  glow.addColorStop(0, 'rgba(48,141,239,.22)');
  glow.addColorStop(1, 'rgba(48,141,239,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, canvas.width, 760);

  roundedRect(ctx, 48, 48, 1104, 1080, 34);
  ctx.fillStyle = '#0d0d0b';
  ctx.fill();
  ctx.strokeStyle = 'rgba(48,141,239,.35)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#2f8ae9';
  ctx.font = '800 21px "Public Sans", sans-serif';
  ctx.fillText('YOUR DISCLOSURE PREFERENCE', 92, 116);

  ctx.fillStyle = '#f8f4e9';
  ctx.font = '800 58px "Public Sans", sans-serif';
  const titleLines = canvasLines(ctx, resultPreference(result.overall), 1010).slice(0, 3);
  titleLines.forEach((line, index) => ctx.fillText(line, 92, 190 + index * 68));

  const spectrumY = 230 + titleLines.length * 68;
  ctx.fillStyle = '#d9d2c2';
  ctx.font = '700 23px "Public Sans", sans-serif';
  ctx.fillText('Private', 92, spectrumY);
  ctx.textAlign = 'right';
  ctx.fillText('Open', 1108, spectrumY);
  ctx.textAlign = 'left';

  const trackX = 92;
  const trackY = spectrumY + 28;
  const trackWidth = 1016;
  const trackHeight = 42;
  roundedRect(ctx, trackX, trackY, trackWidth, trackHeight, 21);
  const trackGradient = ctx.createLinearGradient(trackX, 0, trackX + trackWidth, 0);
  trackGradient.addColorStop(0, '#5d5e5e');
  trackGradient.addColorStop(.5, '#55789c');
  trackGradient.addColorStop(1, '#308ff2');
  ctx.fillStyle = trackGradient;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.25)';
  ctx.stroke();

  ctx.fillStyle = 'rgba(255,255,255,.38)';
  ctx.fillRect(trackX + trackWidth / 2, trackY - 7, 2, trackHeight + 14);
  if (result.overall !== null) {
    const position = Math.max(0, Math.min(100, Number(result.overall))) / 100;
    const markerX = trackX + position * trackWidth;
    roundedRect(ctx, markerX - 14, trackY - 8, 28, trackHeight + 16, 14);
    ctx.fillStyle = '#fffdf8';
    ctx.fill();
  }

  ctx.fillStyle = '#8f897d';
  ctx.font = '700 17px "Public Sans", sans-serif';
  ctx.fillText('P100', trackX, trackY + 72);
  ctx.textAlign = 'center';
  ctx.fillText('0', trackX + trackWidth / 2, trackY + 72);
  ctx.textAlign = 'right';
  ctx.fillText('O100', trackX + trackWidth, trackY + 72);
  ctx.textAlign = 'left';

  const scoreY = trackY + 174;
  ctx.fillStyle = '#8f897d';
  ctx.font = '800 21px "Public Sans", sans-serif';
  ctx.fillText('HISTI-120', 92, scoreY);
  ctx.fillStyle = '#308ff2';
  ctx.font = '800 92px "Public Sans", sans-serif';
  ctx.fillText(result.overall === null ? 'Not calculated' : directionalScore(result.overall), 270, scoreY + 10);

  const subscoreY = scoreY + 104;
  ctx.fillStyle = '#f6f1e5';
  ctx.font = '750 25px "Public Sans", sans-serif';
  ctx.fillText('Category subscores', 92, subscoreY);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#827c71';
  ctx.font = '600 16px "Public Sans", sans-serif';
  ctx.fillText('P = private · O = open', 1108, subscoreY);
  ctx.textAlign = 'left';

  Object.keys(CATEGORY_CAPS).forEach((cat, index) => {
    const resultCat = result.cats[cat];
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = 92 + col * 516;
    const y = subscoreY + 30 + row * 142;
    roundedRect(ctx, x, y, 500, 124, 19);
    ctx.fillStyle = '#181816';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.11)';
    ctx.stroke();

    roundedRect(ctx, x + 18, y + 18, 48, 48, 12);
    ctx.fillStyle = '#308dee';
    ctx.fill();
    ctx.fillStyle = '#0b1016';
    ctx.font = '850 24px "Public Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(cat, x + 42, y + 51);
    ctx.textAlign = 'left';

    ctx.fillStyle = '#8f8a80';
    ctx.font = '600 15px "Public Sans", sans-serif';
    ctx.fillText(CATEGORY_NAMES[cat], x + 82, y + 34);
    ctx.fillStyle = '#f5f1e8';
    ctx.font = '800 31px "Public Sans", sans-serif';
    ctx.fillText(resultCat.ratio === null ? 'N/C' : directionalScore(resultCat.ratio * 100), x + 82, y + 67);

    const miniX = x + 18;
    const miniY = y + 94;
    const miniWidth = 464;
    const miniGradient = ctx.createLinearGradient(miniX, 0, miniX + miniWidth, 0);
    miniGradient.addColorStop(0, '#5d5e5e');
    miniGradient.addColorStop(.5, '#55789c');
    miniGradient.addColorStop(1, '#308dee');
    ctx.fillStyle = miniGradient;
    roundedRect(ctx, miniX, miniY, miniWidth, 6, 3);
    ctx.fill();
    if (resultCat.ratio !== null) {
      ctx.beginPath();
      ctx.arc(miniX + Math.max(0, Math.min(1, resultCat.ratio)) * miniWidth, miniY + 3, 7, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
    }
  });

  ctx.strokeStyle = 'rgba(48,141,239,.28)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(48, 1196);
  ctx.lineTo(1152, 1196);
  ctx.stroke();

  let logo = null;
  try { logo = await loadCanvasImage('/histi-logo.webp?v=facelift-1'); } catch {}
  if (logo) {
    const logoWidth = 190;
    const logoHeight = logoWidth * (logo.naturalHeight / logo.naturalWidth);
    ctx.drawImage(logo, 92, 1244, logoWidth, logoHeight);
  }
  ctx.fillStyle = '#f7f2e5';
  ctx.font = '800 30px "Public Sans", sans-serif';
  ctx.fillText('HISTI-120', 92, 1366);
  ctx.fillStyle = '#d3cab5';
  ctx.font = '650 24px "Public Sans", sans-serif';
  const disclaimerLines = canvasLines(ctx, RESULT_DISCLAIMER, 720);
  disclaimerLines.forEach((line, index) => ctx.fillText(line, 360, 1278 + index * 34));
  ctx.fillStyle = '#7e786d';
  ctx.font = '600 18px "Public Sans", sans-serif';
  ctx.fillText('www.histi.org', 360, 1377);

  if (debugWatermarkActive()) {
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(-Math.PI / 7);
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(48,143,242,.13)';
    ctx.font = '900 76px "Public Sans", sans-serif';
    for (let y = -520; y <= 520; y += 210) {
      ctx.fillText('DEBUG · GENERATED TEST DATA', 0, y);
    }
    ctx.restore();

    ctx.fillStyle = '#308dee';
    ctx.fillRect(0, 0, canvas.width, 58);
    ctx.fillStyle = '#090d11';
    ctx.textAlign = 'center';
    ctx.font = '900 22px "Public Sans", sans-serif';
    ctx.fillText('DEBUG · GENERATED TEST DATA · NOT A REAL RESULT', canvas.width / 2, 38);
    ctx.textAlign = 'left';
  }

  return canvasToBlob(canvas);
}

function downloadResultImage(blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = debugWatermarkActive() ? 'histi120-debug-result.png' : 'histi120-result.png';
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function resultSummaryText(result = compute()) {
  const categoryText = Object.keys(CATEGORY_CAPS)
    .map(cat => `${cat}: ${result.cats[cat].ratio === null ? 'N/C' : directionalScore(result.cats[cat].ratio * 100)}`)
    .join(' · ');
  const debugLine = debugWatermarkActive() ? 'DEBUG · GENERATED TEST DATA · NOT A REAL RESULT\n' : '';
  return `${debugLine}HISTI-120 — ${recipientName()}\nOverall: ${result.overall === null ? 'Not calculated' : directionalScore(result.overall)}\n${categoryText}\n${RESULT_DISCLAIMER}\nCalculated on-device at www.histi.org.`;
}

async function copyResultSummary() {
  const text = resultSummaryText();
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(text);
    els.shareStatus.textContent = 'Result summary copied.';
  } catch {
    const field = document.createElement('textarea');
    field.value = text;
    field.setAttribute('readonly', '');
    field.style.position = 'fixed';
    field.style.opacity = '0';
    document.body.append(field);
    field.select();
    try {
      document.execCommand('copy');
      els.shareStatus.textContent = 'Result summary copied.';
    } catch {
      els.shareStatus.textContent = 'Copy is unavailable in this browser.';
    }
    field.remove();
  }
}

async function shareResult() {
  const result = compute();
  const text = resultSummaryText(result);
  const originalLabel = els.share.textContent;
  els.share.disabled = true;
  els.share.textContent = 'Preparing image…';
  els.shareStatus.textContent = 'Creating your result image…';
  try {
    const blob = await createResultImage(result);
    const file = new File([blob], debugWatermarkActive() ? 'histi120-debug-result.png' : 'histi120-result.png', { type: 'image/png' });
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        els.shareStatus.textContent = 'Choose a destination or cancel the share sheet.';
        await navigator.share({ title: 'My HISTI-120 result', text, files: [file] });
        els.shareStatus.textContent = 'Result image shared.';
        return;
      } catch (err) {
        if (err?.name === 'AbortError') {
          els.shareStatus.textContent = 'Sharing canceled.';
          return;
        }
      }
    }
    downloadResultImage(blob);
    els.shareStatus.textContent = 'Result image downloaded.';
  } catch (err) {
    els.shareStatus.textContent = 'Could not create the result image.';
  } finally {
    els.share.disabled = false;
    els.share.textContent = originalLabel;
  }
}

function localDataExportObject() {
  let progress = null;
  let results = null;
  try { progress = JSON.parse(localStorage.getItem(STORAGE_PROGRESS) || 'null'); } catch {}
  try { results = JSON.parse(localStorage.getItem(STORAGE_RESULTS) || 'null'); } catch {}

  const notes = [
    'Created locally in this browser.',
    'HISTI does not upload this export to create it.',
    'The optional recipient label, if present, is included because it is part of your local HISTI progress.'
  ];
  if (debugWatermarkActive()) notes.unshift('DEBUG · GENERATED TEST DATA · NOT A REAL RESPONSE SET.');

  return {
    format: 'HISTI-120-local-export-v1',
    exportedAt: new Date().toISOString(),
    origin: location.origin,
    debug: {
      generated: !!state.debugGenerated,
      watermarkApplied: debugWatermarkActive()
    },
    storage: {
      [STORAGE_PROGRESS]: progress,
      [STORAGE_RESULTS]: results
    },
    notes
  };
}

function localDataExportText() {
  return JSON.stringify(localDataExportObject(), null, 2);
}

function openDataExport() {
  els.accessibilityPanel.hidden = true;
  els.debugPanel.hidden = true;
  els.disclosurePanel.hidden = true;
  els.sectionSkipDialog.hidden = true;
  els.dataExportRawWrap.hidden = true;
  els.dataExportStatus.textContent = '';
  els.dataExportDialog.hidden = false;
}

function closeDataExport() {
  els.dataExportDialog.hidden = true;
}

function downloadDataExport() {
  const blob = new Blob([localDataExportText()], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${debugWatermarkActive() ? 'histi120-debug-local-data' : 'histi120-local-data'}-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
  els.dataExportStatus.textContent = 'Local JSON export downloaded.';
}

async function copyDataExport() {
  const text = localDataExportText();
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable');
    await navigator.clipboard.writeText(text);
    els.dataExportStatus.textContent = 'Local JSON export copied to clipboard.';
  } catch {
    els.dataExportRaw.value = text;
    els.dataExportRawWrap.hidden = false;
    els.dataExportRaw.focus();
    els.dataExportRaw.select();
    els.dataExportStatus.textContent = 'Clipboard access is unavailable. The raw export is selected below so you can copy it manually.';
  }
}

function viewDataExport() {
  els.dataExportRaw.value = localDataExportText();
  els.dataExportRawWrap.hidden = false;
  els.dataExportStatus.textContent = 'Raw local export shown below.';
}

function resetAll(confirmFirst = true) {
  if (confirmFirst && !window.confirm('Reset HISTI-120? Its answers, progress, and saved results will be cleared on this device. Regular HISTI data will not be changed.')) return;
  if (saveTimer !== null) clearTimeout(saveTimer);
  saveTimer = null;
  saveDirty = false;
  finishSequenceRunning = false;
  cancelHandoffAnimation();
  els.finishSequence.hidden = true;
  els.finishBlackout.hidden = true;
  try {
    localStorage.removeItem(STORAGE_PROGRESS);
    localStorage.removeItem(STORAGE_RESULTS);
  } catch {}
  state = freshState();
  $('observation-period').value = state.observationPeriod;
  syncDebugWatermark();
  els.accessibilityPanel.hidden = true;
  els.debugPanel.hidden = true;
  els.disclosurePanel.hidden = true;
  els.sectionSkipDialog.hidden = true;
  els.accessibility.setAttribute('aria-expanded', 'false');
  applyAccessibility();
  renderRecipientChoices();
  showScreen('intro');
  updateStartScreen();
}

els.app.addEventListener('click', event => {
  const itemPanel = event.target.closest('[data-item-code]');
  activeItemCode = itemPanel?.dataset.itemCode || null;
  const domainAction = event.target.closest('[data-domain-action]');
  if (domainAction) { setDomainAnswer(domainAction.dataset.domainAction); return; }
  const full = event.target.closest('[data-item-full]');
  if (full) { setItemFull(answerItem()); return; }
  const duplicate = event.target.closest('[data-item-duplicate]');
  if (duplicate) { setStatus('DUP'); return; }
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

  const debugOpen = event.target.closest('[data-debug-open]');
  if (debugOpen) {
    els.accessibilityPanel.hidden = true;
    els.accessibility.setAttribute('aria-expanded', 'false');
    els.debugPanel.hidden = false;
    return;
  }

  const debugSection = event.target.closest('[data-debug-section]');
  if (debugSection) {
    debugJumpToSection(debugSection.dataset.debugSection);
    return;
  }

  const debugBoundary = event.target.closest('[data-debug-boundary]');
  if (debugBoundary) {
    debugPreviewBoundary(debugBoundary.dataset.debugBoundary);
    return;
  }

  const recipient = event.target.closest('[data-recipient]');
  if (recipient) { setRecipient(recipient.dataset.recipient); return; }

  const none = event.target.closest('[data-none]');
  if (none) { setNone(); return; }

  const notApplicable = event.target.closest('[data-not-applicable]');
  if (notApplicable) { setEventNotApplicable(); return; }

  const rubric = event.target.closest('[data-rubric]');
  if (rubric && !rubric.disabled) { toggleRubric(Number(rubric.dataset.rubric), rubric); return; }

  const status = event.target.closest('[data-status]');
  if (status) { if (itemPanel) setStatus(status.dataset.status); else setDomainAnswer(status.dataset.status); return; }

  const id = event.target.closest('button')?.id;
  if (!id) return;
  if (id === 'accessibility-btn') {
    const willOpen = els.accessibilityPanel.hidden;
    els.accessibilityPanel.hidden = !willOpen;
    els.accessibility.setAttribute('aria-expanded', String(willOpen));
    els.debugPanel.hidden = true;
  }
  else if (id === 'debug-random-last') debugRandomToLast();
  else if (id === 'debug-watermark-toggle') toggleDebugWatermark();
  else if (id === 'debug-jump') debugJumpToQuestion();
  else if (id === 'boundary-continue') continueCategoryBoundary();
  else if (id === 'boundary-skip') openSectionSkipDialog();
  else if (id === 'section-skip-back') closeSectionSkipDialog();
  else if (id === 'section-skip-confirm') confirmSectionSkip();
  else if (id === 'start-disclosure-btn' || id === 'footer-disclosure-btn' || id === 'privacy-live-btn') openDisclosure();
  else if (id === 'disclosure-close' || id === 'disclosure-done') closeDisclosure();
  else if (id === 'footer-export-btn') openDataExport();
  else if (id === 'data-export-close') closeDataExport();
  else if (id === 'data-export-download') downloadDataExport();
  else if (id === 'data-export-copy') copyDataExport();
  else if (id === 'data-export-view') viewDataExport();
  else if (id === 'footer-reset-btn') resetAll(true);
  else if (id === 'begin-btn') enterFromStart();
  else if (id === 'recipient-back') showScreen('intro');
  else if (id === 'start-btn' && state.recipientType) { state.index = 0; startHandoff(); saveNow(); }
  else if (id === 'handoff-next') finishHandoff();
  else if (id === 'back-btn') go(-1);
  else if (id === 'next-btn') { if (state.index >= questions.length - 1) finishAssessment(); else go(1); }
  else if (id === 'review-btn') { showScreen('assessment'); renderQuestion(); }
  else if (id === 'restart-btn') resetAll(true);
  else if (id === 'reset-btn') resetAll(true);
  else if (id === 'share-btn') shareResult();
  else if (id === 'copy-result-btn') copyResultSummary();
});

els.privacyProofRun?.addEventListener('click', runPrivacyProof);

els.sectionSkipReasons?.addEventListener('change', () => {
  const selected = els.sectionSkipReasons.querySelector('input[name="section-skip-reason"]:checked');
  els.sectionSkipConfirm.disabled = !selected;
});

els.recipientLabel.addEventListener('input', event => {
  state.recipientLabel = event.target.value;
  scheduleSave();
});

els.debugQuestion?.addEventListener('keydown', event => {
  if (event.key === 'Enter') debugJumpToQuestion();
});

window.addEventListener('pagehide', () => { if (saveDirty) saveNow(); });
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden' && saveDirty) saveNow();
  if (document.visibilityState === 'visible') refreshPrivacyProof();
});
window.addEventListener('focus', refreshPrivacyProof);

async function boot() {
  const data = condensedData;
  questions = Array.isArray(data.questions) ? data.questions : [];
  if (!questions.length) throw new Error('Question catalogue is empty');
  state.index = Math.min(Math.max(0, Number(state.index) || 0), questions.length - 1);
  renderRecipientChoices();
  $('observation-period').value = state.observationPeriod;
  applyAccessibility();
  syncDebugWatermark();

  // Always return to the calm start screen on load. Saved progress remains available to resume.
  showScreen('intro');
  updateStartScreen();
  refreshPrivacyProof();
  if (location.hash === '#privacy-proof') openDisclosure();

  window.__HISTI_PRIVACY_PROOF__ = runPrivacyProof;
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
  if (!els.dataExportDialog.hidden) {
    closeDataExport();
    return;
  }
  if (!els.sectionSkipDialog.hidden) {
    closeSectionSkipDialog();
    return;
  }
  els.accessibilityPanel.hidden = true;
  els.debugPanel.hidden = true;
  els.disclosurePanel.hidden = true;
  els.accessibility.setAttribute('aria-expanded', 'false');
});

$('observation-period').addEventListener('change', event => { state.observationPeriod = event.target.value; scheduleSave(); });

export { createResultImage, compute };
