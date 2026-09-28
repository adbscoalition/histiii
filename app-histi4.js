import { FAMILIES, CATEGORY_META, RECIPIENTS } from './histi4-data.js';
import { makeSlides, calculate, rubricPoints, displayScore } from './histi4-core.js';

const group = document.body.dataset.recipient;
const recipient = RECIPIENTS[group];
if (!recipient) throw new Error('Unknown HISTI recipient group');
const slides = makeSlides();
const familyByCode = new Map(FAMILIES.map(row => [row[0], row]));
const storageKey = `histi.four-groups.${group}.v1`;
const $ = id => document.getElementById(id);
const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

function freshState() { return { index: 0, answers: {}, started: false, completed: false, screen: 'intro' }; }
function loadState() {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) || 'null');
    if (!stored || typeof stored !== 'object') return freshState();
    const state = { ...freshState(), ...stored, answers: stored.answers && typeof stored.answers === 'object' ? stored.answers : {} };
    // Existing freeform answers are snapped to the nearest documented rubric stop.
    for (const [code, answer] of Object.entries(state.answers)) {
      const row = familyByCode.get(code);
      if (answer?.status !== 'score' || row?.[3] !== 'slider') continue;
      const positions = row[5].map((anchor, index) => anchor[0] ?? index);
      const value = Number(answer.value);
      if (!Number.isFinite(value)) continue;
      const nearest = positions.reduce((best, position, index) => Math.abs(position - value) < Math.abs(positions[best] - value) ? index : best, 0);
      answer.value = positions[nearest];
    }
    return state;
  } catch { return freshState(); }
}
let state = loadState();
state.index = Math.max(0, Math.min(slides.length - 1, Number(state.index) || 0));
function save() { try { localStorage.setItem(storageKey, JSON.stringify(state)); } catch {} }
function show(screen, scroll = true) {
  state.screen = screen;
  $('intro-screen').hidden = screen !== 'intro';
  $('assessment-screen').hidden = screen !== 'assessment';
  $('results-screen').hidden = screen !== 'results';
  if (scroll) window.scrollTo(0, 0);
  save();
}
function setAnswer(code, status, value = null) {
  const previous = state.answers[code];
  if (previous?.status === status && JSON.stringify(previous.value) === JSON.stringify(value)) return;
  state.answers[code] = { status, value };
  save();
  const result = calculate(state.answers);
  $('answered-label').textContent = `${result.answered} of ${FAMILIES.length} scored`;
  $('partial-btn').hidden = result.answered === 0;
}
function questionCard(row, slideNumber, animate = false) {
  const [code, topic, prompt, type, max, anchors] = row;
  const answer = state.answers[code];
  const card = el('article', 'h4-question');
  if (animate) card.classList.add('h4-reveal');
  card.classList.toggle('is-answered', answer?.status === 'score');
  const top = el('div', 'h4-question-top');
  top.append(el('span', 'h4-question-code', code), el('h2', '', prompt));
  card.append(top, el('p', 'h4-topic', topic));
  const control = el('div', 'h4-control');
  let clearChoice = () => {};
  const clearStatus = () => card.querySelectorAll('.h4-status button').forEach(button => button.setAttribute('aria-pressed', 'false'));
  if (type === 'slider') {
    const numericAnchors = anchors.map((anchor, index) => anchor[0] ?? index);
    const stored = answer?.status === 'score' ? Number(answer.value) : null;
    const selectedIndex = stored === null || !Number.isFinite(stored) ? null : numericAnchors.indexOf(stored);
    const readout = el('div', 'h4-level-value');
    const caption = el('span');
    const description = el('strong');
    readout.append(caption, description);
    const track = el('div', 'h4-segment-control');
    track.style.setProperty('--segments', String(anchors.length));
    track.setAttribute('role', 'group');
    track.setAttribute('aria-label', `Question ${slideNumber}: ${prompt} Choose one discrete level.`);
    const segments = anchors.map((anchor, index) => {
      const button = el('button', 'h4-segment', String(index + 1));
      button.type = 'button';
      button.setAttribute('aria-label', `Level ${index + 1}: ${anchor[1]}`);
      button.addEventListener('click', () => {
        update(index);
        setAnswer(code, 'score', numericAnchors[index]);
        clearStatus();
      });
      track.append(button);
      return button;
    });
    const update = index => {
      const active = index !== null && index >= 0;
      caption.textContent = active ? `Level ${index + 1} of ${anchors.length}` : 'Choose a level';
      description.textContent = active ? anchors[index][1] : 'Select a numbered segment';
      readout.classList.toggle('is-unanswered', !active);
      card.classList.toggle('is-answered', active);
      segments.forEach((segment, n) => {
        segment.classList.toggle('is-active', active && n <= index);
        segment.classList.toggle('is-current', active && n === index);
        segment.setAttribute('aria-pressed', String(active && n === index));
      });
    };
    update(selectedIndex !== null && selectedIndex >= 0 ? selectedIndex : null);
    clearChoice = () => update(null);
    const ends = el('div', 'h4-endpoints');
    ends.append(el('span', '', anchors[0][1]), el('span', '', anchors.at(-1)[1]));
    control.append(readout, track, ends);
  } else if (type === 'yn') {
    const choices = el('div', 'h4-yn');
    const buttons = [];
    const update = selected => {
      buttons.forEach((button, index) => button.setAttribute('aria-pressed', String(selected === index)));
      card.classList.toggle('is-answered', selected !== null);
    };
    ['No', 'Yes'].forEach((label, index) => {
      const button = el('button', '', label); button.type = 'button';
      button.setAttribute('aria-pressed', String(answer?.status === 'score' && Number(answer.value) === index));
      button.addEventListener('click', () => { update(index); setAnswer(code, 'score', index); clearStatus(); });
      buttons.push(button);
      choices.append(button);
    });
    clearChoice = () => update(null);
    control.append(choices);
  } else if (type === 'multi') {
    const choices = el('div', 'h4-multi');
    const buttons = [];
    const update = (values, scored = true) => {
      buttons.forEach((button, index) => button.setAttribute('aria-pressed', String(values.includes(index))));
      card.classList.toggle('is-answered', scored);
    };
    anchors.forEach((option, index) => {
      const button = el('button', '', option[1]); button.type = 'button';
      button.setAttribute('aria-pressed', String(answer?.status === 'score' && answer.value?.includes(index)));
      button.addEventListener('click', () => {
        const current = state.answers[code];
        const values = current?.status === 'score' && Array.isArray(current.value) ? [...current.value] : [];
        const selected = values.includes(index) ? values.filter(item => item !== index) : [...values, index];
        update(selected);
        setAnswer(code, 'score', selected);
        clearStatus();
      });
      buttons.push(button);
      choices.append(button);
    });
    clearChoice = () => update([], false);
    control.append(choices);
  }
  card.append(control);
  const statuses = el('div', 'h4-status');
  for (const [status, label] of [['unknown', "I don't know"], ['pna', 'Prefer not to answer'], ['na', 'Not applicable']]) {
    const button = el('button', '', label); button.type = 'button';
    button.setAttribute('aria-pressed', String(answer?.status === status));
    button.addEventListener('click', () => {
      clearChoice();
      setAnswer(code, status);
      statuses.querySelectorAll('button').forEach(option => option.setAttribute('aria-pressed', String(option === button)));
    });
    statuses.append(button);
  }
  card.append(statuses);
  return card;
}
function renderSlide(scroll = true) {
  const slide = slides[state.index];
  if (!slide) return;
  show('assessment', scroll);
  const meta = CATEGORY_META[slide.category];
  const result = calculate(state.answers);
  $('progress-label').textContent = `Slide ${state.index + 1} of ${slides.length}`;
  $('answered-label').textContent = `${result.answered} of ${FAMILIES.length} scored`;
  const pct = Math.round(((state.index + 1) / slides.length) * 100);
  $('progress-fill').style.width = `${pct}%`;
  $('category-label').textContent = `${slide.category} · ${meta.label} · ${recipient.label}`;
  $('slide-title').textContent = slide.type === 'yn' ? 'A few quick choices.' : slide.type === 'multi' ? 'Select all that apply.' : 'Choose the closest levels.';
  $('slide-help').textContent = `Answering for ${recipient.label.toLowerCase()}. You can leave any question unanswered or use the options below it.`;
  const header = document.querySelector('.question-top');
  header.classList.remove('h4-header-reveal');
  if (scroll) { void header.offsetWidth; header.classList.add('h4-header-reveal'); }
  const warning = slide.category === 'C' || slide.category === 'D';
  $('caution').hidden = !warning;
  if (warning) $('caution').textContent = slide.category === 'D' ? 'Very sensitive: never enter a real password, PIN, ID number, account number, code, key, or document content. Choose a level only.' : 'Sensitive information: choose a level only. Do not enter real location, financial, medical, or other private details.';
  const fragment = document.createDocumentFragment();
  slide.questions.forEach((row, index) => fragment.append(questionCard(row, index + 1, scroll)));
  $('question-list').replaceChildren(fragment);
  $('back-btn').disabled = state.index === 0;
  $('next-btn').textContent = state.index === slides.length - 1 ? 'See result' : 'Next';
  $('partial-btn').hidden = result.answered === 0;
  document.title = `${state.index + 1} / ${slides.length} · ${recipient.label} | HISTI Full`;
}
function resultCategory(key, result) {
  const meta = CATEGORY_META[key];
  const bucket = result.categories[key];
  const card = el('div', 'category-card');
  card.style.setProperty('--score-position', `${bucket.score === null ? 50 : (bucket.score + 100) / 2}%`);
  const top = el('div', 'category-card-top');
  top.append(el('span', 'category-letter h4-category-letter', key), el('span', 'category-name', meta.label), el('strong', '', displayScore(bucket.score)));
  const track = el('div', 'category-track'); track.setAttribute('aria-hidden', 'true'); track.append(el('span'));
  const labels = el('div', 'v3-topic-labels'); labels.append(el('span', '', 'P100'), el('span', '', 'N0'), el('span', '', 'O100'));
  card.append(top, track, labels, el('small', 'h4-category-summary', `${bucket.answered} of ${bucket.total} questions scored`));
  return card;
}
function renderResults(completed = false) {
  if (completed) state.completed = true;
  const result = calculate(state.answers);
  show('results');
  $('result-heading').textContent = `Your result for ${recipient.label.toLowerCase()}.`;
  $('result-score').textContent = displayScore(result.score);
  $('result-marker').hidden = result.score === null;
  $('result-marker').parentElement.style.setProperty('--score-position', `${result.score === null ? 50 : (result.score + 100) / 2}%`);
  $('result-coverage').textContent = `${completed ? 'Completed' : 'Partial'} result · ${result.answered} of ${result.total} questions scored. Unanswered, unknown, prefer-not-to-answer, and not-applicable responses are excluded from the score. Partial scores can change as you answer more.`;
  const fragment = document.createDocumentFragment();
  Object.keys(CATEGORY_META).forEach(key => fragment.append(resultCategory(key, result)));
  $('category-results').replaceChildren(fragment);
  $('resume-btn').textContent = completed ? 'Review questions' : 'Resume questions';
  document.title = `Result · ${recipient.label} | HISTI Full`;
}
function reset() {
  if (!window.confirm(`Reset the ${recipient.label} check-in? This removes its saved answers and result from this device.`)) return;
  state = freshState();
  try { localStorage.removeItem(storageKey); } catch {}
  show('intro');
}

$('intro-recipient').textContent = recipient.label.toLowerCase();
$('intro-description').textContent = recipient.description;
$('slide-count').textContent = `${slides.length} short cards.`;
const groupLinks = document.createDocumentFragment();
for (const [key, info] of Object.entries(RECIPIENTS)) {
  if (key === group) continue;
  const link = el('a', '', info.label); link.href = `/checkin-4-${key.toLowerCase()}`; groupLinks.append(link);
}
$('intro-group-links').append(groupLinks);
$('start-btn').addEventListener('click', () => { state.started = true; renderSlide(); });
$('back-btn').addEventListener('click', () => { if (state.index > 0) { state.index--; renderSlide(); } });
$('next-btn').addEventListener('click', () => { if (state.index === slides.length - 1) renderResults(true); else { state.index++; renderSlide(); } });
$('partial-btn').addEventListener('click', () => renderResults(false));
$('resume-btn').addEventListener('click', () => { state.completed = false; renderSlide(); });
$('reset-btn').addEventListener('click', reset);
$('result-reset-btn').addEventListener('click', reset);
if (state.completed) renderResults(true);
else if (state.started && state.screen !== 'intro') renderSlide();
else show('intro');
window.__HISTI4__ = { group, slides, calculate, rubricPoints, getState: () => state };
