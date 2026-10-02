// One delegated listener; at most one short animation per FAQ. Native details
// remain usable without JavaScript. Rapid clicks reverse from the current height.
export function initFaq(root, { reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches } = {}) {
  const list = root.querySelector('.home-before');
  if (!list || list.dataset.faqReady === 'true') return;
  list.dataset.faqReady = 'true';
  const states = new Map([...list.querySelectorAll('details')].map(details => [details, { expanded: details.open, animation: null }]));
  list.addEventListener('click', event => {
    const summary = event.target.closest('summary');
    const details = summary?.parentElement;
    const state = states.get(details);
    if (!state) return;
    event.preventDefault();
    const start = details.getBoundingClientRect().height;
    if (state.animation) {
      state.animation.onfinish = null;
      state.animation.cancel();
      state.animation = null;
    }
    state.expanded = !state.expanded;
    details.dataset.faqExpanded = String(state.expanded);
    details.style.height = '';
    details.style.overflow = '';
    details.open = state.expanded;
    if (reducedMotion() || typeof details.animate !== 'function') return;
    const end = details.getBoundingClientRect().height;
    details.open = true; // Keep the answer visible while the closing height shrinks.
    details.style.overflow = 'hidden';
    details.style.height = `${end}px`;
    const animation = details.animate([{ height: `${start}px` }, { height: `${end}px` }], { duration: 320, easing: 'cubic-bezier(.22,1,.36,1)' });
    state.animation = animation;
    animation.onfinish = () => {
      if (state.animation !== animation) return;
      details.open = state.expanded;
      details.style.height = '';
      details.style.overflow = '';
      state.animation = null;
      animation.onfinish = null;
    };
  });
}

if (typeof document !== 'undefined') initFaq(document);
