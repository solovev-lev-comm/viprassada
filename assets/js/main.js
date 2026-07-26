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
    document.body.classList.remove('search-open');
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

// "Оплата" in the header's "Ещё" dropdown opens a small rounded popup with
// the store's payment/wholesale info — same content as the product page's
// accordion (see VIPRASSADA.paymentInfoRowsHtml in data.js). Built lazily on
// first open since data.js (loaded right after this file) needs to have run.
(function () {
  const triggers = document.querySelectorAll('[data-payment-modal-toggle]');
  if (!triggers.length) return;

  let modalEl = null;

  function closeModal() {
    if (!modalEl) return;
    modalEl.classList.remove('payment-modal--open');
    document.body.classList.remove('payment-modal-open');
  }

  function buildModal() {
    const el = document.createElement('div');
    el.className = 'payment-modal';
    el.innerHTML = `
      <div class="payment-modal__backdrop" data-payment-modal-close></div>
      <div class="payment-modal__card" role="dialog" aria-modal="true" aria-label="Оплата и опт">
        <button type="button" class="payment-modal__close" data-payment-modal-close aria-label="Закрыть">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
        </button>
        <h2 class="payment-modal__title">Оплата и опт</h2>
        <div class="payment-modal__rows">${VIPRASSADA.paymentInfoRowsHtml()}</div>
      </div>
    `;
    document.body.appendChild(el);
    el.querySelectorAll('[data-payment-modal-close]').forEach((btn) => btn.addEventListener('click', closeModal));
    el.querySelector('.payment-modal__card').addEventListener('click', (e) => e.stopPropagation());
    return el;
  }

  function openModal() {
    if (!modalEl) modalEl = buildModal();
    modalEl.classList.add('payment-modal--open');
    document.body.classList.add('payment-modal-open');
  }

  triggers.forEach((btn) => btn.addEventListener('click', openModal));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalEl && modalEl.classList.contains('payment-modal--open')) closeModal();
  });
})();

// Fixed header: thin separator line flashes on while the page is actively
// scrolling (any direction) and fades back out shortly after it stops.
(function () {
  const IDLE_DELAY = 500; // ms of no scroll events before the line hides

  let hideTimer = null;

  function onScroll() {
    document.body.classList.add('is-scrolled');
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      document.body.classList.remove('is-scrolled');
    }, IDLE_DELAY);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
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
