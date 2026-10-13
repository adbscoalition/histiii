// A single input-driven glide. No idle frames, generated nodes, storage, or requests.
const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
export function wheelDistance(event, viewportHeight) {
  const delta = Number(event.deltaY);
  if (!Number.isFinite(delta)) return 0;
  const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? viewportHeight * .85 : 1;
  return clamp(delta * unit, -1800, 1800);
}
export function glidePosition(position, target, elapsed) {
  if (Math.abs(target - position) <= 1) return target;
  const fraction = 1 - Math.exp(-clamp(elapsed, 1, 40) / 90);
  return position + (target - position) * fraction;
}

export function initVisitorScroll(root, host = root.defaultView) {
  if (!['home','formats','people','checkin','privacy','terms'].includes(root.body?.dataset.page) || root.documentElement.dataset.visitorScrollReady || typeof host?.requestAnimationFrame !== 'function') return;
  root.documentElement.dataset.visitorScrollReady = 'true';
  const motion = host.matchMedia('(prefers-reduced-motion: reduce)');
  const pointer = host.matchMedia('(hover: hover) and (pointer: fine)');
  const request = { left:0, top:0, behavior:'instant' };
  let frame = 0;
  let target = host.scrollY;
  let written = host.scrollY;
  let lastFrame = 0;
  let lastInput = 0;
  const activeState = value => {
    const text = String(value);
    if (root.documentElement.dataset.scrollGlideActive !== text) root.documentElement.dataset.scrollGlideActive = text;
  };
  const paused = () => root.body.classList.contains('visitor-motion-paused') || root.body.classList.contains('reduce-motion');
  const available = () => !motion.matches && pointer.matches && !root.hidden && !paused();
  const maximum = () => Math.max(0, root.scrollingElement.scrollHeight - host.innerHeight);
  const stop = () => {
    if (frame) host.cancelAnimationFrame(frame);
    frame = 0;
    target = written = host.scrollY;
    activeState(false);
  };
  const sync = stop;
  const write = value => {
    request.left = host.scrollX;
    request.top = written = value;
    host.scrollTo(request);
  };
  const tick = now => {
    frame = 0;
    if (!available() || Math.abs(host.scrollY - written) > 2) { stop(); return; }
    target = clamp(target, 0, maximum());
    const position = host.scrollY;
    // A hard deadline also stops a throttled tab or an unusually slow renderer.
    if (now - lastInput >= 650) { if (Math.abs(target-position) <= 8) write(target); stop(); return; }
    const next = glidePosition(position, target, now-lastFrame);
    lastFrame = now;
    write(next);
    if (Math.abs(target-next) <= .5) { write(target); stop(); return; }
    frame = host.requestAnimationFrame(tick);
  };
  const nestedScroll = element => {
    for (let node=element; node && node!==root.body && node!==root.documentElement; node=node.parentElement) {
      if (node.scrollHeight > node.clientHeight + 1 && /auto|scroll/.test(host.getComputedStyle(node).overflowY)) return true;
    }
    return false;
  };
  const onWheel = event => {
    if (!available() || event.defaultPrevented || !event.cancelable || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) { stop(); return; }
    const element = event.target?.nodeType === 1 ? event.target : event.target?.parentElement;
    if (element?.closest('input,textarea,select,button,[role="slider"],.h4-control,[contenteditable],[data-native-scroll]') || root.querySelector('dialog[open],main[inert],.h4-segment-control.is-dragging') || root.documentElement.matches?.('.histi-url-covered,.histi-intro-active,.histi-intro-pending') || nestedScroll(element)) { stop(); return; }
    const delta = wheelDistance(event, host.innerHeight);
    const max = maximum();
    if (!delta || !max || (delta < 0 && host.scrollY <= 0) || (delta > 0 && host.scrollY >= max)) { stop(); return; }
    // A reverse gesture replaces the previous momentum immediately.
    const base = frame && (target-host.scrollY)*delta >= 0 ? target : host.scrollY;
    const next = Math.round(clamp(base + delta, 0, max));
    if (next === host.scrollY && !frame) return;
    event.preventDefault();
    target = next;
    lastInput = host.performance.now();
    if (!frame) {
      written = host.scrollY;
      lastFrame = lastInput;
      activeState(true);
      frame = host.requestAnimationFrame(tick);
    }
  };
  host.addEventListener('wheel', onWheel, {passive:false});
  host.addEventListener('scroll', () => { if (frame && Math.abs(host.scrollY-written) > 2) stop(); }, {passive:true});
  for (const name of ['pointerdown','touchstart','keydown','resize','hashchange','pagehide']) host.addEventListener(name, stop, {passive:true});
  root.addEventListener('focusin', stop);
  root.addEventListener('visibilitychange', () => { if (root.hidden) stop(); });
  root.addEventListener('click', event => {
    const element = event.target?.nodeType === 1 ? event.target : event.target?.parentElement;
    if (element?.closest('[data-visitor-motion],[data-a11y="motion"]')) sync();
  });
  motion.addEventListener('change', sync);
  pointer.addEventListener('change', sync);
  sync();
}
if (typeof document !== 'undefined') initVisitorScroll(document);
