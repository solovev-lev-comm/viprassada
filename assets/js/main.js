// Shared header behavior: mobile menu toggle, used on every page.
(function () {
  const menuBtn = document.querySelector('[data-menu-toggle]');
  const overlay = document.querySelector('[data-menu-overlay]');
  const closeEls = document.querySelectorAll('[data-menu-close]');

  function closeMenu() {
    document.body.classList.remove('menu-open');
  }

  if (menuBtn) {
    menuBtn.addEventListener('click', () => {
      document.body.classList.toggle('menu-open');
    });
  }
  if (overlay) overlay.addEventListener('click', closeMenu);
  closeEls.forEach((el) => el.addEventListener('click', closeMenu));
})();
