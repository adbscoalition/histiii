import questionData from './questions-data-private-v1.js';

const STORAGE_PROGRESS = 'histi.progress.v3';
const STORAGE_SPECTRUM = 'histi.spectrum.v1';

export const MAIN_SPECTRUM = {
  id: 'overall',
  label: 'Overall HISTI',
  leftCode: 'P',
  leftLabel: 'Private',
  rightCode: 'O',
  rightLabel: 'Open'
};

export const TOPIC_SPECTRA = [
  { id: 'identity', label: 'Identity', leftCode: 'A', leftLabel: 'Anonymous', rightCode: 'I', rightLabel: 'Identifiable' },
  { id: 'location', label: 'Location', leftCode: 'C', leftLabel: 'Coarse', rightCode: 'T', rightLabel: 'Traceable' },
  { id: 'routine', label: 'Routine', leftCode: 'U', leftLabel: 'Unpredictable', rightCode: 'P', rightLabel: 'Predictable' },
  { id: 'relationships', label: 'Relationships', leftCode: 'G', leftLabel: 'General', rightCode: 'S', rightLabel: 'Specific' },
  { id: 'health', label: 'Health', leftCode: 'G', leftLabel: 'General', rightCode: 'D', rightLabel: 'Detailed' },
  { id: 'financial', label: 'Financial', leftCode: 'B', leftLabel: 'Broad', rightCode: 'E', rightLabel: 'Exact' },
  { id: 'files', label: 'Files & communications', leftCode: 'R', leftLabel: 'Restricted', rightCode: 'X', rightLabel: 'Extensive' },
  { id: 'credentials', label: 'Credentials', leftCode: 'S', leftLabel: 'Sealed', rightCode: 'A', rightLabel: 'Actionable' },
  { id: 'events', label: 'Life events', leftCode: 'M', leftLabel: 'Mentioned', rightCode: 'D', rightLabel: 'Documented' }
];

const TOPIC_RULES = {
  identity: [
    /^B(?:0[1-5]|1[2-3]|1[8-9]|2[1-5]|4[1-5])$/,
    /^C(?:03|21|39|43)$/,
    /^D(?:0[1-4]|10|11|17|24|27|28|29|30|33)$/
  ],
  location: [
    /^B(?:11|26|27)$/,
    /^C(?:0[4-8]|25|26|27|32|33|46|63)$/
  ],
  routine: [
    /^A(?:7[9]|8[0-9]|9[0-9]|10[0-9]|11[0-4])$/,
    /^B(?:20|27|38)$/,
    /^C(?:07|25|26|32|46)$/
  ],
  relationships: [
    /^A(?:0[1-5]|18|19|23|24|32|33|34|35|47|48|49|50|51|52|53|69|70)$/,
    /^B(?:14|15|34|35|36)$/,
    /^C(?:10|11|12|24|42|47|52|61|62)$/
  ],
  health: [
    /^A(?:16|17|18|37|38|64|65|66|67|68|69|70)$/,
    /^B37$/,
    /^C(?:13|14|20|39|40|41|49|50|51|52|53)$/,
    /^D(?:11|33)$/
  ],
  financial: [
    /^A(?:11|21|39|49|57|72)$/,
    /^B51$/,
    /^C(?:15|16|35|36|37|38|58|59|60|61|62)$/,
    /^D(?:05|06|19|22|31|32)$/
  ],
  files: [
    /^B(?:16|52)$/,
    /^C(?:01|02|09|22|23|30|31|42|44|45|54|55|56|57)$/
  ],
  credentials: [
    /^C(?:29|64)$/,
    /^D\d+$/
  ],
  events: [
    /^A(?:0[1-9]|[1-6][0-9]|7[0-8])$/
  ]
};

const questions = Array.isArray(questionData?.questions) ? questionData.questions : [];

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function finiteWeight(value) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function pairedFullIndex(question, partialIndex) {
  const raw = String(question?.rubric?.[partialIndex]?.trigger || '');
  const match = raw.match(/^(\d+)A\.\s*/i);
  if (!match || !/Partial\/limited evidence/i.test(raw)) return -1;
  const prefix = match[1];
  return question.rubric.findIndex((item, index) => {
    if (index <= partialIndex) return false;
    const candidate = String(item?.trigger || '');
    return new RegExp(`^${prefix}B\\.\\s*`, 'i').test(candidate) && /Full-detail increment/i.test(candidate);
  });
}

export function legacyAnswerExposure(question, answer) {
  if (!question || !answer || answer.status !== 'SCORE' || !answer.answered) return null;
  if (answer.explicitNone === true) return 0;

  const selected = new Set(Array.isArray(answer.selected) ? answer.selected : []);
  if (answer.fullByAll) return 1;
  if (selected.size === 0) return 0;

  const rubric = Array.isArray(question.rubric) ? question.rubric : [];
  if (rubric.length && rubric.every((_, index) => selected.has(index))) return 1;
  if ([...selected].some(index => /\ball\b/i.test(String(rubric[index]?.trigger || '')))) return 1;

  const percent = rubric.reduce((sum, item, index) => {
    if (!selected.has(index)) return sum;
    const fullIndex = pairedFullIndex(question, index);
    if (fullIndex >= 0 && selected.has(fullIndex)) return sum;
    return sum + Number(item?.share || 0);
  }, 0);

  return clamp(percent / 100, 0, 1);
}

export function exposureToSignedScore(exposure) {
  if (exposure === null || !Number.isFinite(Number(exposure))) return null;
  return Math.round(clamp(Number(exposure), 0, 1) * 200 - 100);
}

export function formatSpectrumScore(score, spectrum = MAIN_SPECTRUM) {
  if (score === null || !Number.isFinite(Number(score))) return 'N/C';
  const rounded = Math.round(clamp(Number(score), -100, 100));
  if (rounded === 0) return 'N0';
  return `${rounded < 0 ? spectrum.leftCode : spectrum.rightCode}${Math.abs(rounded)}`;
}

function questionTopics(question) {
  const code = String(question?.code || '');
  return TOPIC_SPECTRA
    .filter(topic => (TOPIC_RULES[topic.id] || []).some(rule => rule.test(code)))
    .map(topic => topic.id);
}

function loadProgress() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_PROGRESS) || 'null');
    return parsed?.state ? parsed.state : null;
  } catch {
    return null;
  }
}

function accumulator() {
  return { includedWeight: 0, achievedWeight: 0, answeredCount: 0 };
}

function addToAccumulator(target, weight, exposure) {
  target.includedWeight += weight;
  target.achievedWeight += weight * exposure;
  target.answeredCount += 1;
}

function finishAccumulator(target) {
  const exposure = target.includedWeight > 0 ? target.achievedWeight / target.includedWeight : null;
  return {
    ...target,
    exposure,
    score: exposureToSignedScore(exposure)
  };
}

export function computeSpectrumResult(progressState = loadProgress()) {
  const state = progressState || {};
  const answers = state.answers || {};
  const skips = state.categorySkips || {};
  const overall = accumulator();
  const topics = Object.fromEntries(TOPIC_SPECTRA.map(topic => [topic.id, accumulator()]));

  let eligibleWeight = 0;
  let answeredWeight = 0;
  let excludedWeight = 0;

  for (const question of questions) {
    const weight = finiteWeight(answers[question.code]?.weight ?? question.suggestedWeight);
    if (weight === null || weight === 0) continue;

    const skipMode = skips[question.category] || null;
    if (skipMode === 'exclude') {
      excludedWeight += weight;
      continue;
    }

    eligibleWeight += weight;

    if (skipMode === 'private') {
      answeredWeight += weight;
      addToAccumulator(overall, weight, 0);
      for (const topicId of questionTopics(question)) addToAccumulator(topics[topicId], weight, 0);
      continue;
    }

    const answer = answers[question.code];
    if (!answer?.answered) continue;
    if (answer.status === 'NAPP' || answer.status === 'NA' || answer.status === 'U' || answer.status === 'PNA') continue;

    const exposure = legacyAnswerExposure(question, answer);
    if (exposure === null) continue;

    answeredWeight += weight;
    addToAccumulator(overall, weight, exposure);
    for (const topicId of questionTopics(question)) addToAccumulator(topics[topicId], weight, exposure);
  }

  const finishedOverall = finishAccumulator(overall);
  const finishedTopics = Object.fromEntries(
    TOPIC_SPECTRA.map(topic => [topic.id, { ...topic, ...finishAccumulator(topics[topic.id]) }])
  );

  return {
    version: 1,
    calculatedAt: new Date().toISOString(),
    overall: { ...MAIN_SPECTRUM, ...finishedOverall },
    topics: finishedTopics,
    coverage: eligibleWeight > 0 ? clamp(answeredWeight / eligibleWeight, 0, 1) : 0,
    answeredWeight,
    eligibleWeight,
    excludedWeight
  };
}

function resultPreference(score, recipientLabel = 'this person') {
  if (score === null) return 'There is not enough information for a result.';
  const magnitude = Math.abs(score);
  if (magnitude < 12) return `Your answers sit near the middle for ${recipientLabel}.`;
  const direction = score < 0 ? 'private' : 'open';
  let degree = 'slightly';
  if (magnitude >= 75) degree = 'strongly';
  else if (magnitude >= 40) degree = 'moderately';
  else if (magnitude >= 12) degree = 'somewhat';
  return `Your answers lean ${degree} ${direction} with ${recipientLabel}.`;
}

function recipientName(state) {
  if (String(state?.recipientLabel || '').trim()) return String(state.recipientLabel).trim();
  return {
    'close-family': 'your close family member',
    partner: 'your spouse or partner',
    friend: 'your friend',
    acquaintance: 'your acquaintance',
    other: 'this person',
    public: 'the general public'
  }[state?.recipientType] || 'this person';
}

function scorePosition(score) {
  if (score === null) return 50;
  return clamp((score + 100) / 2, 0, 100);
}

function createTopicCard(topic) {
  const card = document.createElement('div');
  card.className = 'category-card histi-topic-card';
  if (topic.score === null) card.classList.add('is-not-calculated');
  card.style.setProperty('--score-position', `${scorePosition(topic.score)}%`);

  const top = document.createElement('div');
  top.className = 'category-card-top';

  const badge = document.createElement('span');
  badge.className = 'category-letter';
  badge.textContent = topic.label.slice(0, 1).toUpperCase();

  const label = document.createElement('span');
  label.className = 'category-name';
  label.textContent = topic.label;

  const value = document.createElement('strong');
  value.textContent = formatSpectrumScore(topic.score, topic);

  top.append(badge, label, value);

  const track = document.createElement('div');
  track.className = 'category-track';
  track.setAttribute('aria-hidden', 'true');
  track.append(document.createElement('span'));

  const endpoints = document.createElement('div');
  endpoints.className = 'histi-topic-endpoints';
  endpoints.innerHTML = `<span>${topic.leftLabel}</span><span>N0</span><span>${topic.rightLabel}</span>`;

  card.append(top, track, endpoints);
  return card;
}

function ensureStyles() {
  if (document.getElementById('histi-spectrum-v3-styles')) return;
  const style = document.createElement('style');
  style.id = 'histi-spectrum-v3-styles';
  style.textContent = `
    .histi-topic-card { min-height: 118px; }
    .histi-topic-endpoints { display:grid;grid-template-columns:1fr auto 1fr;gap:10px;margin-top:9px;color:#8f897d;font-size:.72rem;font-weight:650;line-height:1.2; }
    .histi-topic-endpoints span:nth-child(2){text-align:center;color:#b5aa92}
    .histi-topic-endpoints span:last-child{text-align:right}
    .histi-coverage-note{display:flex;justify-content:space-between;gap:16px;align-items:center;margin:12px 0 0;padding:11px 13px;border:1px solid rgba(255,255,255,.1);border-radius:12px;background:rgba(255,255,255,.025);color:#a8a093;font-size:.82rem}
    .histi-coverage-note strong{color:#f1eadb}
  `;
  document.head.append(style);
}

function saveSpectrumSnapshot(result) {
  try {
    localStorage.setItem(STORAGE_SPECTRUM, JSON.stringify(result));
  } catch {}
}

let applying = false;
let queued = false;

export function applySpectrumResultsToPage() {
  if (applying) return;
  const screen = document.getElementById('results-screen');
  if (!screen || screen.hidden) return;

  applying = true;
  try {
    ensureStyles();
    const state = loadProgress() || {};
    const result = computeSpectrumResult(state);
    saveSpectrumSnapshot(result);

    const score = document.getElementById('result-score');
    const marker = document.getElementById('result-marker');
    const title = document.getElementById('result-title');
    const note = document.getElementById('result-note');
    const values = screen.querySelector('.spectrum-values');
    const spectrum = screen.querySelector('.result-spectrum');
    const heading = screen.querySelector('.subscore-heading h2');
    const headingNote = screen.querySelector('.subscore-heading span');
    const grid = document.getElementById('category-results');

    if (score) score.textContent = result.overall.score === null ? 'Not calculated' : formatSpectrumScore(result.overall.score, MAIN_SPECTRUM);
    if (marker) {
      marker.hidden = result.overall.score === null;
      marker.style.setProperty('--score-position', `${scorePosition(result.overall.score)}%`);
    }
    if (title) title.textContent = resultPreference(result.overall.score, recipientName(state));
    if (note) note.textContent = result.overall.score === null
      ? 'No scored items were included.'
      : `Coverage: ${Math.round(result.coverage * 100)}% of currently eligible weighted questions. Unanswered, unknown, rather-not-answer, and not-applicable items are not silently scored as disclosure.`;
    if (values) values.innerHTML = '<span>P100</span><span>N0</span><span>O100</span>';
    if (spectrum) spectrum.setAttribute('aria-label', 'Disclosure preference scale from P100 private through N0 neutral to O100 open');
    if (heading) heading.textContent = 'Topic spectra';
    if (headingNote) headingNote.textContent = 'Each topic uses its own descriptive endpoints';

    if (grid) {
      const frag = document.createDocumentFragment();
      for (const topic of TOPIC_SPECTRA) frag.append(createTopicCard(result.topics[topic.id]));
      grid.replaceChildren(frag);

      const priorCoverage = grid.parentElement?.querySelector('.histi-coverage-note');
      if (priorCoverage) priorCoverage.remove();
      const coverage = document.createElement('div');
      coverage.className = 'histi-coverage-note';
      coverage.innerHTML = `<span>Assessment coverage</span><strong>${Math.round(result.coverage * 100)}%</strong>`;
      grid.after(coverage);
    }

    const share = document.getElementById('share-btn');
    if (share) share.textContent = 'Share result summary';
  } finally {
    applying = false;
  }
}

function summaryText() {
  const state = loadProgress() || {};
  const result = computeSpectrumResult(state);
  const topicLines = TOPIC_SPECTRA
    .map(topic => `${topic.label}: ${formatSpectrumScore(result.topics[topic.id].score, topic)}`)
    .join(' · ');
  return `HISTI — ${recipientName(state)}\nOverall: ${formatSpectrumScore(result.overall.score, MAIN_SPECTRUM)}\nCoverage: ${Math.round(result.coverage * 100)}%\n${topicLines}\nHISTI is a reflection tool, not a diagnosis, legal judgment, safety verdict, or measure of character. Calculated on-device at www.histi.org.`;
}

async function copySummary() {
  const text = summaryText();
  const status = document.getElementById('share-status');
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(text);
    if (status) status.textContent = 'Result summary copied.';
  } catch {
    const field = document.createElement('textarea');
    field.value = text;
    field.style.position = 'fixed';
    field.style.opacity = '0';
    document.body.append(field);
    field.select();
    try { document.execCommand('copy'); } catch {}
    field.remove();
    if (status) status.textContent = 'Result summary ready to copy.';
  }
}

async function shareSummary() {
  const text = summaryText();
  const status = document.getElementById('share-status');
  if (navigator.share) {
    try {
      await navigator.share({ title: 'My HISTI result', text });
      if (status) status.textContent = 'Result summary shared.';
      return;
    } catch (error) {
      if (error?.name === 'AbortError') {
        if (status) status.textContent = 'Sharing canceled.';
        return;
      }
    }
  }
  await copySummary();
}

function scheduleApply() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => {
    queued = false;
    applySpectrumResultsToPage();
  });
}

const resultsScreen = document.getElementById('results-screen');
if (resultsScreen) {
  new MutationObserver(scheduleApply).observe(resultsScreen, { attributes: true, attributeFilter: ['hidden', 'class'] });
}

document.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button) return;
  if (button.id === 'copy-result-btn') {
    event.preventDefault();
    event.stopImmediatePropagation();
    copySummary();
  } else if (button.id === 'share-btn') {
    event.preventDefault();
    event.stopImmediatePropagation();
    shareSummary();
  }
}, true);

window.addEventListener('storage', event => {
  if (event.key === STORAGE_PROGRESS) scheduleApply();
});

window.__HISTI_SPECTRUM__ = {
  compute: () => computeSpectrumResult(),
  formatSpectrumScore,
  topicSpectra: TOPIC_SPECTRA,
  mainSpectrum: MAIN_SPECTRUM
};

scheduleApply();
