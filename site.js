// MedCUA site interactions: header state, mobile navigation, reveal-on-scroll, hero video and trace.
(() => {
  const root = document.documentElement;
  root.classList.add('js');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Header shadow once the page scrolls
  const header = document.querySelector('[data-header]');
  if (header) {
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // Mobile navigation
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('site-nav');
  if (toggle && nav) {
    const setOpen = open => {
      toggle.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
    };
    toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
    nav.addEventListener('click', event => { if (event.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && nav.classList.contains('is-open')) { setOpen(false); toggle.focus(); }
    });
    window.matchMedia('(min-width: 861px)').addEventListener('change', event => { if (event.matches) setOpen(false); });
  }

  // Reveal on scroll
  const revealables = document.querySelectorAll('[data-reveal]');
  if (!('IntersectionObserver' in window) || reduceMotion.matches) {
    revealables.forEach(el => el.classList.add('is-visible'));
  } else {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealables.forEach(el => revealObserver.observe(el));
  }

  // Hero video: respect reduced motion, pause while off screen
  const video = document.querySelector('[data-hero-video]');
  if (video) {
    const tryPlay = () => { const p = video.play(); if (p && p.catch) p.catch(() => {}); };
    if (reduceMotion.matches) {
      video.removeAttribute('autoplay');
      video.pause();
    } else if ('IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) tryPlay(); else video.pause();
      }, { threshold: 0.05 }).observe(video);
    }
    reduceMotion.addEventListener('change', event => { if (event.matches) video.pause(); else tryPlay(); });
  }

  // Agent trace plays once when visible
  const trace = document.querySelector('[data-trace]');
  if (trace) {
    if (!('IntersectionObserver' in window)) trace.classList.add('is-playing');
    else new IntersectionObserver((entries, observer) => {
      if (entries[0].isIntersecting) { trace.classList.add('is-playing'); observer.disconnect(); }
    }, { threshold: 0.3 }).observe(trace);
  }

  // Current year
  document.querySelectorAll('[data-year]').forEach(el => { el.textContent = String(new Date().getFullYear()); });
})();
