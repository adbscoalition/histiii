// Apply saved preferences before page/intro scripts run. Only four non-answer
// preferences are stored; no observers, polling, frame loops, or network requests.
(() => {
  const STORAGE_KEY = 'histi.preferences.v1';
  const DEFAULTS = Object.freeze({ reading:'standard', contrast:'standard', textSize:'normal', performance:false });
  function normalizePreferences(value) {
    const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    return {
      reading: ['standard','simple'].includes(source.reading) ? source.reading : DEFAULTS.reading,
      contrast: ['standard','high'].includes(source.contrast) ? source.contrast : DEFAULTS.contrast,
      textSize: ['normal','large','largest'].includes(source.textSize) ? source.textSize : DEFAULTS.textSize,
      performance: source.performance === true
    };
  }
  // The static browser loads a classic script; Node tests can import validation.
  if (typeof module !== 'undefined' && module.exports) module.exports = { DEFAULTS, STORAGE_KEY, normalizePreferences };
  if (typeof document === 'undefined' || typeof window === 'undefined') return;
  const root = document.documentElement;
  if (root.dataset.settingsReady) return;
  root.dataset.settingsReady = 'true';
  let preferences;
  try { preferences = normalizePreferences(JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null')); }
  catch { preferences = normalizePreferences(null); }
  let trigger, dialog, status, performanceButton;
  let appliedReading, closeTimer = null, statusAnimation = null;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const quiet = () => preferences.performance || motion.matches || document.hidden;
  const choices = [];

  function clearMotion() {
    if (closeTimer !== null) window.clearTimeout(closeTimer);
    closeTimer = null;
    if (!dialog) return;
    delete dialog.dataset.motion;
    delete dialog.dataset.contentMotion;
    dialog.style.removeProperty('--settings-exit-opacity');
    dialog.style.removeProperty('--settings-exit-transform');
    dialog.style.removeProperty('--settings-shade-exit-opacity');
  }
  function cancelStatusMotion() { statusAnimation?.cancel(); statusAnimation = null; }
  function notify(message) {
    if (!status) return;
    if (status.textContent !== message) status.textContent = message;
    cancelStatusMotion();
    if (quiet() || !dialog?.open || typeof status.animate !== 'function') return;
    const animation = status.animate([{opacity:.35,transform:'translateY(3px)'},{opacity:1,transform:'none'}],{duration:220,easing:'cubic-bezier(.16,1,.3,1)'});
    statusAnimation = animation;
    animation.finished.then(()=>{ if (statusAnimation === animation) statusAnimation = null; animation.cancel(); },()=>{ if (statusAnimation === animation) statusAnimation = null; });
  }
  function finishClose() {
    cancelStatusMotion();
    clearMotion();
    if (dialog?.open) dialog.close();
  }
  function stopMotion() {
    cancelStatusMotion();
    if (dialog?.dataset.motion === 'closing') finishClose();
    else clearMotion();
  }
  function requestClose() {
    if (!dialog?.open || dialog.dataset.motion === 'closing') return;
    if (quiet()) { finishClose(); return; }
    // Reverse an interrupted entrance from its current pose, not a new jump.
    const pose = window.getComputedStyle(dialog);
    dialog.style.setProperty('--settings-exit-opacity', pose.opacity);
    dialog.style.setProperty('--settings-exit-transform', pose.transform);
    dialog.style.setProperty('--settings-shade-exit-opacity', window.getComputedStyle(dialog,'::backdrop').opacity);
    dialog.dataset.motion = 'closing';
    // One bounded fallback; cleared on animation completion/cancellation.
    closeTimer = window.setTimeout(finishClose, 240);
  }

  function applyReading() {
    for (const node of document.querySelectorAll('[data-reading-simple]')) {
      // Only explicitly annotated guidance is rewritten, never test questions.
      if (!node.hasAttribute('data-reading-standard')) node.dataset.readingStandard = node.textContent;
      const text = preferences.reading === 'simple' ? node.dataset.readingSimple : node.dataset.readingStandard;
      if (node.textContent !== text) node.textContent = text;
    }
  }
  function apply(initial = false) {
    const performance = preferences.performance ? 'on' : 'off';
    const motionChanged = root.dataset.performance !== performance;
    for (const [key,value] of Object.entries({reading:preferences.reading,contrast:preferences.contrast,textSize:preferences.textSize,performance})) {
      if (root.dataset[key] !== value) root.dataset[key] = value;
    }
    if (document.body && (initial || appliedReading !== preferences.reading)) { applyReading(); appliedReading = preferences.reading; }
    for (const choice of choices) {
      const pressed = String(preferences[choice.dataset.setting] === choice.dataset.value);
      if (choice.getAttribute('aria-pressed') !== pressed) choice.setAttribute('aria-pressed', pressed);
    }
    if (performanceButton) {
      const checked = String(preferences.performance);
      if (performanceButton.getAttribute('aria-checked') !== checked) {
        performanceButton.setAttribute('aria-checked', checked);
        performanceButton.querySelector('[data-performance-label]').textContent = preferences.performance ? 'On' : 'Off';
      }
    }
    // Text/contrast changes must not restart every motion owner or scan animations.
    if (motionChanged || initial) {
      if (preferences.performance) stopMotion();
      document.dispatchEvent(new CustomEvent('histi:preferences', { detail:{...preferences} }));
      if (preferences.performance) document.getAnimations?.().forEach(animation => animation.cancel());
    }
  }
  function change(key, value) {
    const next = normalizePreferences({...preferences, [key]:value});
    if (JSON.stringify(next) === JSON.stringify(preferences)) return;
    preferences = next;
    let saved = true;
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences)); } catch { saved = false; }
    apply();
    notify(saved ? 'Saved only in this browser.' : 'Applied here. This browser did not allow saving.');
  }
  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  function group(key, title, help, options) {
    const field = el('fieldset', 'histi-settings-field');
    const description = el('p', 'histi-settings-help', help); description.id = `settings-${key}-help`;
    field.append(el('legend','',title), description);
    const row = el('div','histi-settings-options');
    for (const [value,label] of options) {
      const button = el('button','',label); button.type = 'button';
      button.dataset.setting = key; button.dataset.value = value;
      button.setAttribute('aria-describedby',description.id);
      choices.push(button); row.append(button);
    }
    field.append(row); return field;
  }
  function init() {
    if (document.getElementById('histi-settings-btn')) return;
    if (document.querySelector('.bottom-utility')) document.body.classList.add('histi-has-fixed-footer');
    trigger = el('button','histi-settings-trigger'); trigger.id = 'histi-settings-btn'; trigger.type = 'button';
    trigger.setAttribute('aria-haspopup','dialog'); trigger.setAttribute('aria-controls','histi-settings-dialog'); trigger.setAttribute('aria-expanded','false');
    const icon = document.createElementNS('http://www.w3.org/2000/svg','svg');
    icon.setAttribute('viewBox','0 0 24 24'); icon.setAttribute('aria-hidden','true'); icon.setAttribute('focusable','false');
    const path = document.createElementNS('http://www.w3.org/2000/svg','path');
    path.setAttribute('d','M9 3h6l.7 3 2.6 1 2.5 2.5-1.7 2.5 1.7 2.5-2.5 2.5-2.6 1-.7 3H9l-.7-3-2.6-1-2.5-2.5L4.9 12 3.2 9.5 5.7 7l2.6-1L9 3Z');
    const circle = document.createElementNS('http://www.w3.org/2000/svg','circle'); circle.setAttribute('cx','12');circle.setAttribute('cy','12');circle.setAttribute('r','3');
    icon.append(path,circle); trigger.append(icon,el('span','','Settings'));
    dialog = el('dialog','histi-settings-dialog'); dialog.id = 'histi-settings-dialog';
    dialog.setAttribute('aria-labelledby','histi-settings-title');
    const head = el('div','histi-settings-head');
    const title = el('h2','','Settings'); title.id = 'histi-settings-title';
    const close = el('button','histi-settings-close','Close'); close.type = 'button'; close.setAttribute('aria-label','Close settings');
    close.addEventListener('click',requestClose); head.append(title,close);
    const reading = group('reading','Reading level','Plain language uses shorter explanations. Test questions and scoring stay the same.',[['standard','Standard'],['simple','Plain language']]);
    const contrast = group('contrast','Contrast','Make text and boundaries stand out more.',[['standard','Standard'],['high','High contrast']]);
    const text = group('textSize','Text size','Make reading text and question choices larger.',[['normal','Normal'],['large','Larger'],['largest','Largest']]);
    const performance = el('fieldset','histi-settings-field');
    performance.append(el('legend','','Performance mode'),el('p','histi-settings-help','No motion, scroll glide, decorative spots, blur, or shadows. Controls still work.'));
    performanceButton = el('button','histi-settings-switch'); performanceButton.type = 'button'; performanceButton.id = 'settings-performance';
    performanceButton.setAttribute('role','switch'); performanceButton.setAttribute('aria-label','Performance mode');
    const switchLabel = el('span','','Off'); switchLabel.dataset.performanceLabel = '';
    const track = el('span','histi-switch-track'); track.setAttribute('aria-hidden','true'); track.append(el('span'));
    performanceButton.append(switchLabel,track); performance.append(performanceButton);
    const foot = el('div','histi-settings-foot');
    const reset = el('button','histi-settings-reset','Reset settings'); reset.type = 'button';
    status = el('p','histi-settings-status','Preferences stay in this browser.'); status.setAttribute('role','status');
    reset.addEventListener('click',()=>{
      preferences = normalizePreferences(null);
      let saved = true;
      try { window.localStorage.removeItem(STORAGE_KEY); } catch { saved = false; }
      apply(); notify(saved ? 'Settings reset. Your check-in answers are unchanged.' : 'Reset for this page. This browser did not allow saving.');
    });
    foot.append(reset,status);
    dialog.append(head,reading,contrast,text,performance,foot); document.body.append(trigger,dialog);
    dialog.addEventListener('click',event=>{
      if (dialog.dataset.motion === 'closing') return;
      if (event.target === dialog) {
        const rect = dialog.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) requestClose();
        return;
      }
      const choice = event.target.closest('button[data-setting]');
      if (choice && choices.includes(choice)) change(choice.dataset.setting,choice.dataset.value);
    });
    performanceButton.addEventListener('click',()=>change('performance',!preferences.performance));
    trigger.addEventListener('click',()=>{
      if (document.querySelector('dialog[open]')) return;
      clearMotion();
      dialog.showModal(); dialog.scrollTop = 0; trigger.setAttribute('aria-expanded','true'); close.focus({preventScroll:true});
      if (!quiet()) { dialog.dataset.motion = 'opening'; dialog.dataset.contentMotion = 'true'; }
    });
    dialog.addEventListener('cancel',event=>{ event.preventDefault(); requestClose(); });
    dialog.addEventListener('animationend',event=>{
      if (event.target !== dialog) return;
      if (event.animationName === 'settings-depart' && dialog.dataset.motion === 'closing') finishClose();
      else if (event.animationName === 'settings-arrive' && dialog.dataset.motion === 'opening') clearMotion();
    });
    dialog.addEventListener('close',()=>{ cancelStatusMotion(); clearMotion(); trigger.setAttribute('aria-expanded','false'); if (!document.hidden) trigger.focus({preventScroll:true}); });
    apply(true);
  }
  apply();
  window.addEventListener('storage',event=>{
    if (event.key !== STORAGE_KEY && event.key !== null) return;
    try { preferences = normalizePreferences(JSON.parse(event.newValue || 'null')); } catch { preferences = normalizePreferences(null); }
    apply();
    notify('Preferences updated in this browser.');
  });
  window.addEventListener('pageshow',event=>{
    if (!event.persisted) return;
    try { preferences = normalizePreferences(JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null')); }
    catch { preferences = normalizePreferences(null); }
    apply();
  });
  motion.addEventListener('change',()=>{ if (motion.matches) stopMotion(); });
  document.addEventListener('visibilitychange',()=>{ if (document.hidden) stopMotion(); });
  window.addEventListener('pagehide',stopMotion);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
