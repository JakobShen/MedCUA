/* Presentation-page navigation and optional replay. No contribution-form dependencies. */
(() => {
  document.documentElement.classList.add('js');
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

  const video = document.querySelector('[data-replay-video]');
  const control = document.querySelector('[data-replay-toggle]');
  if (video && control) {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let userPaused = reduceMotion.matches;
    let visible = true;
    control.hidden = false;
    const update = () => {
      control.textContent = video.paused ? 'Play replay' : 'Pause replay';
      control.setAttribute('aria-label', video.paused ? 'Play the 3D Slicer replay' : 'Pause the 3D Slicer replay');
    };
    const play = () => video.play().catch(update);
    control.addEventListener('click', () => {
      userPaused = !video.paused;
      if (userPaused) video.pause(); else play();
    });
    video.addEventListener('play', update);
    video.addEventListener('pause', update);
    video.addEventListener('error', () => { control.hidden = true; });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (!visible) video.pause(); else if (!userPaused) play();
      }, { threshold: .1 }).observe(video);
    }
    reduceMotion.addEventListener('change', event => {
      if (event.matches) { userPaused = true; video.pause(); }
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) video.pause(); else if (visible && !userPaused) play();
    });
    if (!userPaused) play();
    update();
  }
  document.querySelectorAll('[data-year]').forEach(el => { el.textContent = String(new Date().getFullYear()); });
})();
