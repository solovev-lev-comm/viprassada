// Shared header behavior: mobile menu toggle. Included on every page.
(function () {
  const menuBtn = document.querySelector('[data-menu-toggle]');
  const overlay = document.querySelector('[data-menu-overlay]');
  const closeEls = document.querySelectorAll('[data-menu-close]');

  function isMenuOpen() {
    return document.body.classList.contains('menu-open');
  }

  function closeMenu() {
    document.body.classList.remove('menu-open');
  }

  function openMenu() {
    document.body.classList.add('menu-open');
  }

  if (menuBtn) {
    menuBtn.addEventListener('click', () => {
      if (isMenuOpen()) closeMenu();
      else openMenu();
    });
  }
  if (overlay) overlay.addEventListener('click', closeMenu);
  closeEls.forEach((el) => el.addEventListener('click', closeMenu));
})();

// Cookie consent banner — shown once per browser (localStorage), on every
// page, after a short delay so it doesn't pop in instantly on load.
(function () {
  const STORAGE_KEY = 'viprassada_cookie_consent';
  const SHOW_DELAY = 700; // ms
  const HIDE_DURATION = 300; // ms — must match the CSS transition duration

  if (localStorage.getItem(STORAGE_KEY)) return;

  function dismiss(banner) {
    localStorage.setItem(STORAGE_KEY, '1');
    banner.classList.remove('cookie-banner--visible');
    setTimeout(() => banner.remove(), HIDE_DURATION);
  }

  function showBanner() {
    if (localStorage.getItem(STORAGE_KEY)) return;

    const banner = document.createElement('div');
    banner.className = 'cookie-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-live', 'polite');
    banner.innerHTML =
      '<div class="cookie-banner__text">Мы используем cookie для улучшения работы сайта. ' +
      'Подробнее — в <a href="privacy.html">Политике конфиденциальности</a>.</div>' +
      '<div class="cookie-banner__actions">' +
      '<button type="button" class="cookie-banner__decline">Не разрешать</button>' +
      '<button type="button" class="cookie-banner__accept">Разрешить</button>' +
      '</div>';

    document.body.appendChild(banner);
    banner.querySelector('.cookie-banner__decline').addEventListener('click', () => dismiss(banner));
    banner.querySelector('.cookie-banner__accept').addEventListener('click', () => dismiss(banner));

    // Force a synchronous layout flush so the browser commits the initial
    // (hidden) state before we flip to --visible — otherwise it may
    // coalesce both style changes into one frame and skip the transition.
    // Using this instead of requestAnimationFrame also means the animation
    // still fires correctly if the tab was opened in the background.
    void banner.offsetHeight;
    banner.classList.add('cookie-banner--visible');
  }

  setTimeout(showBanner, SHOW_DELAY);
})();
