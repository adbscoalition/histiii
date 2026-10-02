// Cosmetic illustrations only: no assessment imports, storage, requests, or timers.
export function previewAt(rawValue) {
  const number = Number(rawValue);
  const value = Number.isFinite(number) ? Math.round(Math.min(100, Math.max(0, number)) / 10) * 10 : 30;
  const code = score => {
    const signed = Math.round((score - 50) * 2);
    return signed === 0 ? 'N0' : `${signed < 0 ? 'P' : 'O'}${Math.abs(signed)}`;
  };
  const wording = value < 20 ? ['Very', 'private.'] : value < 40 ? ['Moderately', 'private.'] :
    value <= 60 ? ['Somewhere', 'in the middle.'] : value < 90 ? ['Moderately', 'open.'] : ['Very', 'open.'];
  // These illustrative topic positions interpolate between the example and the endpoints.
  // They are deliberately separate from HISTI's real scoring rules.
  const topics = [55, 40, 20, 15, 0].map(base => code(value <= 30 ? base * value / 30 : base + (100 - base) * (value - 30) / 70));
  return { value, code: code(value), wording, topics, accessible: `${code(value)} · ${wording.join(' ')}` };
}

export function initVisitorPlay(root) {
  const demo = root.querySelector('[data-cosmetic-demo]');
  const levels = root.querySelector('[data-cosmetic-levels]');
  if (!demo || !levels || demo.dataset.playReady === 'true') return;
  demo.dataset.playReady = 'true';
  const range = demo.querySelector('input[type="range"]');
  const score = demo.querySelector('[data-demo-score]');
  const adverb = demo.querySelector('[data-demo-adverb]');
  const preference = demo.querySelector('[data-demo-preference]');
  const topics = [...demo.querySelectorAll('[data-demo-topic]')];
  const colors = [...demo.querySelectorAll('button[data-demo-color]')];
  const levelButtons = [...levels.querySelectorAll('button[data-demo-level]')];
  const levelOutput = root.querySelector('#sample-level-description');
  const labels = ['Keep completely private', 'Share narrowly', 'Context-dependent', 'Share openly', 'Share completely openly'];
  const write = (element, value) => { if (element.textContent !== value) element.textContent = value; };
  const render = () => {
    const result = previewAt(range.value);
    range.setAttribute('aria-valuetext', result.accessible);
    write(score, result.code);
    write(adverb, result.wording[0]);
    write(preference, result.wording[1]);
    topics.forEach((element, index) => write(element, result.topics[index]));
  };
  range.addEventListener('input', render);
  demo.addEventListener('click', event => {
    const button = event.target.closest('button[data-demo-color]');
    if (!colors.includes(button)) return;
    demo.dataset.demoColor = button.dataset.demoColor;
    colors.forEach(element => element.setAttribute('aria-pressed', String(element === button)));
  });
  levels.addEventListener('click', event => {
    const button = event.target.closest('button[data-demo-level]');
    if (!levelButtons.includes(button)) return;
    levelButtons.forEach(element => element.setAttribute('aria-pressed', String(element === button)));
    write(levelOutput, labels[Number(button.dataset.demoLevel) - 1]);
  });
  render();
}

if (typeof document !== 'undefined') initVisitorPlay(document);
