// Live search in the header search bar (all pages). Type-ahead dropdown of
// matching products; clicking one jumps straight to that product's own page.
//
// On mobile the bar itself lives inside a full-screen overlay (opened by
// the header's search icon, closed by its own back arrow) instead of a
// permanent strip under the header — see .site-header__search-btn /
// .site-search__back and the body.search-open toggle in style.css.
(function () {
  const inputs = document.querySelectorAll('.site-search__input');
  if (!inputs.length) return;

  const MAX_RESULTS = 30;
  const MOBILE_QUERY = '(max-width: 900px)';

  function isMobile() {
    return window.matchMedia(MOBILE_QUERY).matches;
  }

  function debounce(fn, wait) {
    let timer = null;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  function matchProducts(products, query) {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return products.filter((p) => p.title.toLowerCase().includes(q)).slice(0, MAX_RESULTS);
  }

  function resultPhotoHtml(product) {
    if (product.photo) {
      return `<div class="site-search__result-photo" style="background-image:url('${VIPRASSADA.escapeHtml(product.photo)}')"></div>`;
    }
    return `
      <div class="site-search__result-photo site-search__result-photo--placeholder">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21v-8"/><path d="M12 13c0-4 3-6 7-6 0 4-3 6-7 6z"/><path d="M12 13c0-3-3-5-6-5 0 3 3 5 6 5z"/></svg>
      </div>
    `;
  }

  function resultRowHtml(product) {
    return `
      <button type="button" class="site-search__result" data-id="${VIPRASSADA.escapeHtml(product.id)}">
        ${resultPhotoHtml(product)}
        <span class="site-search__result-body">
          <span class="site-search__result-name">${VIPRASSADA.escapeHtml(product.title)}</span>
          <span class="site-search__result-category">${VIPRASSADA.escapeHtml(product.categoryName)}</span>
        </span>
      </button>
    `;
  }

  function goToProduct(id) {
    window.location.href = '/product?id=' + encodeURIComponent(id);
  }

  VIPRASSADA.loadData().then((data) => {
    inputs.forEach((input) => {
      const box = input.closest('.site-search__box');
      const overlay = input.closest('.site-search');
      const backBtn = overlay ? overlay.querySelector('[data-mobile-search-close]') : null;
      if (!box) return;

      const results = document.createElement('div');
      results.className = 'site-search__results';
      box.appendChild(results);

      function hide() {
        results.classList.remove('site-search__results--open');
        results.innerHTML = '';
      }

      // Mobile overlay is a dedicated full screen, so an empty query still
      // shows a hint instead of just going blank — matches the reference.
      function update() {
        const query = input.value;
        if (!query.trim()) {
          if (isMobile() && document.body.classList.contains('search-open')) {
            results.innerHTML = '<div class="site-search__hint">Введите название товара или категорию</div>';
            results.classList.add('site-search__results--open');
          } else {
            hide();
          }
          return;
        }
        const matches = matchProducts(data.products, query);
        if (!matches.length) {
          results.innerHTML = `<div class="site-search__empty">Ничего не нашли по «${VIPRASSADA.escapeHtml(query.trim())}»</div>`;
        } else {
          results.innerHTML = matches.map(resultRowHtml).join('');
        }
        results.classList.add('site-search__results--open');
      }

      input.addEventListener('input', debounce(update, 120));
      input.addEventListener('focus', update);
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') hide();
        if (e.key === 'Enter') {
          const first = results.querySelector('.site-search__result');
          if (first) {
            e.preventDefault();
            goToProduct(first.getAttribute('data-id'));
          }
        }
      });

      results.addEventListener('click', (e) => {
        const btn = e.target.closest('.site-search__result');
        if (!btn) return;
        goToProduct(btn.getAttribute('data-id'));
      });

      document.addEventListener('click', (e) => {
        if (isMobile()) return; // the mobile overlay only closes via its own back button
        if (!box.contains(e.target)) hide();
      });

      if (backBtn) {
        backBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          document.body.classList.remove('search-open');
          input.value = '';
          hide();
        });
      }
    });
  });

  // Header search icon (mobile only) opens the full-screen overlay.
  document.querySelectorAll('[data-mobile-search-toggle]').forEach((toggleBtn) => {
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      document.body.classList.remove('menu-open');
      document.body.classList.add('search-open');
      const input = document.querySelector('.site-search__input');
      if (input) input.focus();
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.body.classList.contains('search-open')) {
      document.body.classList.remove('search-open');
    }
  });
})();
