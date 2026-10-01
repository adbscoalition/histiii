(() => {
  const root = document.documentElement;
  const syncVisibility = () => root.classList.toggle('suite-motion-paused', document.hidden);
  document.addEventListener('visibilitychange', syncVisibility);
  window.addEventListener('pagehide', () => root.classList.add('suite-motion-paused'));
  window.addEventListener('pageshow', syncVisibility);
  syncVisibility();
})();
