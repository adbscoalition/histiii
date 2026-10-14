// Visitor-only guidance. No assessment answers, scoring, storage, requests, or loops.
const PACES = Object.freeze({
  '60': { name:'HISTI-60', route:'/checkin-60', note:'60 questions · about 10–15 minutes. You can still take breaks.' },
  '120': { name:'HISTI-120', route:'/checkin-120', note:'120 questions · about 20–25 minutes. There’s no need to rush.' },
  'full': { name:'HISTI Full', route:'/checkin-4', note:'245 questions · about 40–50 minutes. You don’t have to finish in one sitting.' }
});

export function paceRecommendation(value) {
  return Object.hasOwn(PACES, value) ? PACES[value] : null;
}

export function initVisitorCalm(root, { motion = typeof window === 'undefined' ? null : window.matchMedia('(prefers-reduced-motion: reduce)'), Observer = typeof IntersectionObserver === 'undefined' ? null : IntersectionObserver, viewportHeight = typeof window === 'undefined' ? 0 : window.innerHeight } = {}) {
  if (!['home','formats'].includes(root.body?.dataset.page) || root.documentElement.dataset.visitorCalmReady === 'true') return;
  const guides = [...root.querySelectorAll('[data-pace-guide]')];
  if (!guides.length) return;
  root.documentElement.dataset.visitorCalmReady = 'true';

  const active = new Set();
  const pending = new Set();
  const toggles = [...root.querySelectorAll('[data-visitor-motion]')];
  let paused = false;
  let observer = null;
  const isQuiet = () => paused || motion?.matches || root.documentElement?.dataset?.performance === 'on';
  const cancelMotion = () => { for (const animation of [...active]) animation.cancel(); active.clear(); };
  const showAll = () => {
    for (const target of pending) target.classList.remove('visitor-awaiting');
    pending.clear();
    observer?.disconnect();
  };
  const syncMotion = () => {
    root.body.classList.toggle('visitor-motion-paused', Boolean(isQuiet()));
    for (const button of toggles) {
      button.setAttribute('aria-pressed', String(paused));
      const performance = root.documentElement?.dataset?.performance === 'on';
      button.disabled = Boolean(motion?.matches || performance);
      button.querySelector('[data-motion-label]').textContent = performance ? 'Performance mode' : motion?.matches ? 'Reduced motion' : paused ? 'Motion paused' : 'Pause motion';
    }
    if (isQuiet()) { cancelMotion(); showAll(); }
  };
  const settle = (element, frames, duration) => {
    if (isQuiet() || typeof element?.animate !== 'function') return;
    const animation = element.animate(frames, { duration, easing:'cubic-bezier(.22,.75,.25,1)', fill:'none' });
    active.add(animation);
    const release = () => active.delete(animation);
    animation.onfinish = release;
    animation.oncancel = release;
  };

  for (const guide of guides) {
    const choices = [...guide.querySelectorAll('[data-pace-choice]')];
    const output = guide.querySelector('[data-pace-output]');
    const link = guide.querySelector('[data-pace-link]');
    guide.addEventListener('click', event => {
      const toggle = event.target.closest('[data-visitor-motion]');
      if (toggles.includes(toggle)) { paused = !paused; syncMotion(); return; }
      const button = event.target.closest('[data-pace-choice]');
      if (!choices.includes(button)) return;
      const recommendation = paceRecommendation(button.dataset.paceChoice);
      if (!recommendation || guide.dataset.pace === button.dataset.paceChoice) return;
      guide.dataset.pace = button.dataset.paceChoice;
      choices.forEach(choice => choice.setAttribute('aria-pressed', String(choice === button)));
      output.textContent = `${recommendation.name}: ${recommendation.note}`;
      link.setAttribute('href', recommendation.route);
      link.querySelector('[data-pace-link-label]').textContent = `Explore ${recommendation.name}`;
      root.querySelectorAll('.home-format,.app-card.available').forEach(card => {
        card.dataset.paceRecommended = String(card.getAttribute('href') === recommendation.route);
      });
      cancelMotion();
      settle(output, [{opacity:.35,transform:'translateY(4px)'},{opacity:1,transform:'translateY(0)'}], 340);
      settle(button.querySelector('.visitor-icon'), [{transform:'rotate(-8deg)'},{transform:'rotate(3deg)',offset:.65},{transform:'rotate(0deg)'}], 440);
    });
  }

  if (!isQuiet() && Observer) {
    observer = new Observer(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.remove('visitor-awaiting');
        pending.delete(entry.target);
        observer.unobserve(entry.target);
      }
      if (!pending.size) observer.disconnect();
    }, { threshold:.04, rootMargin:'0px 0px -24px 0px' });
    for (const target of root.querySelectorAll('[data-calm-reveal],body[data-page="formats"] .app-card')) {
      if (target.getBoundingClientRect().top <= viewportHeight - 24) continue;
      target.classList.add('visitor-soft-reveal', 'visitor-awaiting');
      pending.add(target);
      observer.observe(target);
    }
  }
  root.addEventListener('focusin', event => {
    const target = event.target.closest('.visitor-awaiting');
    if (!target) return;
    target.classList.remove('visitor-awaiting');
    pending.delete(target);
    observer?.unobserve(target);
  });
  root.addEventListener('visibilitychange', () => { if (root.hidden) cancelMotion(); });
  root.defaultView?.addEventListener('pagehide', () => { cancelMotion(); showAll(); });
  motion?.addEventListener('change', syncMotion);
  root.addEventListener('histi:preferences', syncMotion);
  syncMotion();
}

if (typeof document !== 'undefined') initVisitorCalm(document);
