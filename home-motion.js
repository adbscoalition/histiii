(() => {
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (motionPreference.matches || !('IntersectionObserver' in window)) return;

  const revealTargets = document.querySelectorAll(
    '.home-section-heading, .home-format, .home-steps article, .home-area-list article, ' +
    '.privacy-summary, .home-before, .home-final'
  );

  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.remove('home-reveal-pending');
      observer.unobserve(entry.target);
    }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.01 });

  for (const target of revealTargets) {
    // Never hide anything already visible when the script starts.
    if (target.getBoundingClientRect().top <= window.innerHeight * .88) continue;
    const siblings = Array.from(target.parentElement.children);
    const stagger = Math.min(siblings.indexOf(target), 3) * 65;
    target.style.setProperty('--home-reveal-delay', `${stagger}ms`);
    target.classList.add('home-reveal', 'home-reveal-pending');
    observer.observe(target);
  }

  motionPreference.addEventListener('change', event => {
    if (!event.matches) return;
    observer.disconnect();
    for (const target of revealTargets) target.classList.remove('home-reveal-pending');
  }, { once: true });
})();
