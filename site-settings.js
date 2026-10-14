// Apply saved preferences before page/intro scripts run. Only four non-answer
// preferences are stored; no observers, timers, frame loops, or network requests.
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
  const choices = [];

  function applyReading() {
    for (const node of document.querySelectorAll('[data-reading-simple]')) {
      // Only explicitly annotated guidance is rewritten, never test questions.
      if (!node.hasAttribute('data-reading-standard')) node.dataset.readingStandard = node.textContent;
      const text = preferences.reading === 'simple' ? node.dataset.readingSimple : node.dataset.readingStandard;
      if (node.textContent !== text) node.textContent = text;
    }
  }
  function apply() {
    root.dataset.reading = preferences.reading;
    root.dataset.contrast = preferences.contrast;
    root.dataset.textSize = preferences.textSize;
    root.dataset.performance = preferences.performance ? 'on' : 'off';
    if (document.body) applyReading();
    for (const choice of choices) choice.setAttribute('aria-pressed', String(preferences[choice.dataset.setting] === choice.dataset.value));
    if (performanceButton) {
      performanceButton.setAttribute('aria-checked', String(preferences.performance));
      performanceButton.querySelector('[data-performance-label]').textContent = preferences.performance ? 'On' : 'Off';
    }
    // Motion owners clear their own pending work and restore their own UI state.
    document.dispatchEvent(new CustomEvent('histi:preferences', { detail:{...preferences} }));
    if (preferences.performance) document.getAnimations?.().forEach(animation => animation.cancel());
  }
  function change(key, value) {
    const next = normalizePreferences({...preferences, [key]:value});
    if (JSON.stringify(next) === JSON.stringify(preferences)) return;
    preferences = next;
    let saved = true;
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences)); } catch { saved = false; }
    apply();
    if (status) status.textContent = saved ? 'Saved only in this browser.' : 'Applied here. This browser did not allow saving.';
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
    close.addEventListener('click',()=>dialog.close()); head.append(title,close);
    const reading = group('reading','Reading level','Plain language uses shorter explanations. Test questions and scoring stay the same.',[['standard','Standard'],['simple','Plain language']]);
    const contrast = group('contrast','Contrast','Make text and boundaries stand out more.',[['standard','Standard'],['high','High contrast']]);
    const text = group('textSize','Text size','Make reading text and question choices larger.',[['normal','Normal'],['large','Larger'],['largest','Largest']]);
    const performance = el('fieldset','histi-settings-field');
    performance.append(el('legend','','Performance mode'),el('p','histi-settings-help','Stops animations, drifting decorations, page transitions, and scroll glide. Controls still work.'));
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
      apply(); status.textContent = saved ? 'Settings reset. Your check-in answers are unchanged.' : 'Reset for this page. This browser did not allow saving.';
    });
    foot.append(reset,status);
    dialog.append(head,reading,contrast,text,performance,foot); document.body.append(trigger,dialog);
    dialog.addEventListener('click',event=>{
      if (event.target === dialog) {
        const rect = dialog.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
        return;
      }
      const choice = event.target.closest('button[data-setting]');
      if (choice && choices.includes(choice)) change(choice.dataset.setting,choice.dataset.value);
    });
    performanceButton.addEventListener('click',()=>change('performance',!preferences.performance));
    trigger.addEventListener('click',()=>{
      if (document.querySelector('dialog[open]')) return;
      dialog.showModal(); dialog.scrollTop = 0; trigger.setAttribute('aria-expanded','true'); close.focus({preventScroll:true});
    });
    dialog.addEventListener('close',()=>{ trigger.setAttribute('aria-expanded','false'); if (!document.hidden) trigger.focus({preventScroll:true}); });
    apply();
  }
  apply();
  window.addEventListener('storage',event=>{
    if (event.key !== STORAGE_KEY && event.key !== null) return;
    try { preferences = normalizePreferences(JSON.parse(event.newValue || 'null')); } catch { preferences = normalizePreferences(null); }
    apply();
    if (status) status.textContent = 'Preferences updated in this browser.';
  });
  window.addEventListener('pageshow',event=>{
    if (!event.persisted) return;
    try { preferences = normalizePreferences(JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null')); }
    catch { preferences = normalizePreferences(null); }
    apply();
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
