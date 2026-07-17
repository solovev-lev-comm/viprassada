// Shared header behavior: mobile menu toggle + smart hide-on-scroll header.
// Included on every page.
(function () {
  const menuBtn = document.querySelector('[data-menu-toggle]');
  const overlay = document.querySelector('[data-menu-overlay]');
  const closeEls = document.querySelectorAll('[data-menu-close]');
  const header = document.querySelector('.site-header');

  function isMenuOpen() {
    return document.body.classList.contains('menu-open');
  }

  function closeMenu() {
    document.body.classList.remove('menu-open');
  }

  function openMenu() {
    document.body.classList.add('menu-open');
    if (header) header.classList.remove('site-header--hidden');
  }

  if (menuBtn) {
    menuBtn.addEventListener('click', () => {
      if (isMenuOpen()) closeMenu();
      else openMenu();
    });
  }
  if (overlay) overlay.addEventListener('click', closeMenu);
  closeEls.forEach((el) => el.addEventListener('click', closeMenu));

  // Smart header: hides on scroll-down, reappears instantly on any
  // scroll-up, stays visible near the top of the page, and never
  // hides while the mobile menu is open. Scroll handling is throttled
  // to one update per animation frame so fast/inertial scrolling on
  // mobile stays smooth.
  if (header) {
    const NEAR_TOP = 80; // px — always show the header in this zone
    const DOWN_DELTA = 5; // px — ignore tiny jitter before hiding

    let lastScrollY = Math.max(0, window.scrollY);
    let ticking = false;

    function updateHeader() {
      const currentY = Math.max(0, window.scrollY);

      if (isMenuOpen()) {
        header.classList.remove('site-header--hidden');
        lastScrollY = currentY;
        return;
      }

      if (currentY <= NEAR_TOP) {
        header.classList.remove('site-header--hidden');
      } else if (currentY > lastScrollY + DOWN_DELTA) {
        header.classList.add('site-header--hidden');
      } else if (currentY < lastScrollY) {
        header.classList.remove('site-header--hidden');
      }

      lastScrollY = currentY;
    }

    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        updateHeader();
        ticking = false;
      });
    }, { passive: true });
  }
})();
