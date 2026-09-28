import { FAMILIES, CATEGORY_META, RECIPIENTS } from './histi4-data.js';
import { makeSlides, calculate, rubricPoints, displayScore } from './histi4-core.js';

const group = document.body.dataset.recipient;
const recipient = RECIPIENTS[group];
if (!recipient) throw new Error('Unknown HISTI recipient group');
const slides = makeSlides();
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
    return { ...freshState(), ...stored, answers: stored.answers && typeof stored.answers === 'object' ? stored.answers : {} };
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
  renderSlide(false);
}
function questionCard(row, slideNumber) {
  const [code, topic, prompt, type, max, anchors] = row;
  const answer = state.answers[code];
  const card = el('article', 'h4-question');
  const top = el('div', 'h4-question-top');
  top.append(el('span', 'h4-question-code', code), el('h2', '', prompt));
  card.append(top, el('p', 'h4-topic', topic));
  const control = el('div', 'h4-control');
  if (type === 'slider') {
    const numericAnchors = anchors.map((anchor, index) => anchor[0] ?? index);
    const stored = answer?.status === 'score' ? Number(answer.value) : null;
    const min = numericAnchors[0], maxValue = numericAnchors.at(-1);
    const slider = el('input', 'h4-slider');
    slider.type = 'range'; slider.min = String(min); slider.max = String(maxValue);
    slider.step = anchors[0][0] === null ? '1' : '1';
    slider.value = String(stored === null || !Number.isFinite(stored) ? Math.round((min + maxValue) / 2) : stored);
    slider.setAttribute('aria-label', `Question ${slideNumber}: ${prompt}`);
    const readout = el('div', 'h4-slider-readout');
    const description = el('strong');
    const percentage = el('span');
    readout.append(description, percentage);
    const update = active => {
      if (!active) { description.textContent = 'Move the slider to answer'; percentage.textContent = 'Not selected'; return; }
      const value = Number(slider.value);
      const nearest = numericAnchors.reduce((best, candidate, index) => Math.abs(candidate - value) < Math.abs(numericAnchors[best] - value) ? index : best, 0);
      description.textContent = anchors[nearest][1];
      percentage.textContent = anchors[0][0] === null ? `Level ${value + 1} of ${anchors.length}` : `${value} / 100`;
      slider.setAttribute('aria-valuetext', `${description.textContent}, ${percentage.textContent}`);
    };
    update(stored !== null && Number.isFinite(stored));
    slider.addEventListener('input', () => update(true));
    slider.addEventListener('change', () => setAnswer(code, 'score', Number(slider.value)));
    slider.addEventListener('click', () => setAnswer(code, 'score', Number(slider.value)));
    const ends = el('div', 'h4-endpoints');
    ends.append(el('span', '', anchors[0][1]), el('span', '', anchors.at(-1)[1]));
    control.append(readout, slider, ends);
  } else if (type === 'yn') {
    const choices = el('div', 'h4-yn');
    ['No', 'Yes'].forEach((label, index) => {
      const button = el('button', '', label); button.type = 'button';
      button.setAttribute('aria-pressed', String(answer?.status === 'score' && Number(answer.value) === index));
      button.addEventListener('click', () => setAnswer(code, 'score', index));
      choices.append(button);
    });
    control.append(choices);
  } else if (type === 'multi') {
    const choices = el('div', 'h4-multi');
    anchors.forEach((option, index) => {
      const button = el('button', '', option[1]); button.type = 'button';
      button.setAttribute('aria-pressed', String(answer?.status === 'score' && answer.value?.includes(index)));
      button.addEventListener('click', () => {
        const values = answer?.status === 'score' && Array.isArray(answer.value) ? [...answer.value] : [];
        const selected = values.includes(index) ? values.filter(item => item !== index) : [...values, index];
        setAnswer(code, 'score', selected);
      });
      choices.append(button);
    });
    control.append(choices);
  }
  card.append(control);
  const statuses = el('div', 'h4-status');
  for (const [status, label] of [['unknown', "I don't know"], ['pna', 'Prefer not to answer'], ['na', 'Not applicable']]) {
    const button = el('button', '', label); button.type = 'button';
    button.setAttribute('aria-pressed', String(answer?.status === status));
    button.addEventListener('click', () => setAnswer(code, status));
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
  document.querySelector('.h4-progress').setAttribute('aria-valuenow', String(pct));
  $('category-label').textContent = `${slide.category} · ${meta.label} · ${recipient.label}`;
  $('slide-title').textContent = slide.type === 'yn' ? 'A few quick choices.' : slide.type === 'multi' ? 'Select all that apply.' : 'Choose the closest levels.';
  $('slide-help').textContent = `Answering for ${recipient.label.toLowerCase()}. You can leave any question unanswered or use the options below it.`;
  const warning = slide.category === 'C' || slide.category === 'D';
  $('caution').hidden = !warning;
  if (warning) $('caution').textContent = slide.category === 'D' ? 'Very sensitive: never enter a real password, PIN, ID number, account number, code, key, or document content. Choose a level only.' : 'Sensitive information: choose a level only. Do not enter real location, financial, medical, or other private details.';
  const fragment = document.createDocumentFragment();
  slide.questions.forEach((row, index) => fragment.append(questionCard(row, index + 1)));
  $('question-list').replaceChildren(fragment);
  $('back-btn').disabled = state.index === 0;
  $('next-btn').textContent = state.index === slides.length - 1 ? 'See result →' : 'Next →';
  document.title = `${state.index + 1} / ${slides.length} · ${recipient.label} | HISTI`;
}
function resultCategory(key, result) {
  const meta = CATEGORY_META[key];
  const bucket = result.categories[key];
  const card = el('div', 'h4-category');
  const top = el('div'); top.append(el('span', '', `${key} · ${meta.label}`), el('strong', '', displayScore(bucket.score)));
  card.append(top, el('small', '', `${bucket.answered} of ${bucket.total} questions scored · ${bucket.earned} / ${bucket.available} available points`));
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
  document.title = `Result · ${recipient.label} | HISTI`;
}
function reset() {
  if (!window.confirm(`Reset the ${recipient.label} check-in? This removes its saved answers and result from this device.`)) return;
  state = freshState();
  try { localStorage.removeItem(storageKey); } catch {}
  show('intro');
}

$('intro-recipient').textContent = recipient.label.toLowerCase();
$('intro-description').textContent = recipient.description;
$('slide-count').textContent = `${slides.length} slides · three sliders or yes/no questions per slide`;
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
