(function () {
  const PAGE_SIZE = 12;

  const els = {
    totalCount: document.querySelector('[data-total-count]'),
    categoryList: document.querySelector('[data-category-list]'),
    priceMin: document.querySelector('[data-price-min]'),
    priceMax: document.querySelector('[data-price-max]'),
    availability: document.querySelector('[data-availability]'),
    search: document.querySelector('[data-search]'),
    grid: document.querySelector('[data-product-grid]'),
    pagination: document.querySelector('[data-pagination]'),
    catalogTitle: document.querySelector('[data-catalog-title]'),
    catalogCount: document.querySelector('[data-catalog-count]'),
    filtersToggle: document.querySelector('[data-filters-toggle]'),
    filtersCount: document.querySelector('[data-filters-count]'),
  };

  document.querySelectorAll('[data-filters-close]').forEach((el) => {
    el.addEventListener('click', () => document.body.classList.remove('filters-open'));
  });
  if (els.filtersToggle) {
    els.filtersToggle.addEventListener('click', () => document.body.classList.add('filters-open'));
  }

  const state = {
    categories: [],
    products: [],
    selectedCategories: new Set(),
    minPrice: null,
    maxPrice: null,
    availability: 'all',
    search: '',
    page: 1,
  };

  function updateFiltersCount() {
    let count = 0;
    if (state.selectedCategories.size > 0 && state.selectedCategories.size < state.categories.length) count++;
    if (state.minPrice != null || state.maxPrice != null) count++;
    if (state.availability !== 'all') count++;
    if (els.filtersCount) els.filtersCount.textContent = String(count);
  }

  function renderCategoryList() {
    els.categoryList.innerHTML = state.categories.map((cat) => `
      <label class="filters__checkbox">
        <input type="checkbox" data-category-checkbox value="${VIPRASSADA.escapeHtml(cat.slug)}" ${state.selectedCategories.has(cat.slug) ? 'checked' : ''}>
        ${VIPRASSADA.escapeHtml(cat.name)}
      </label>
    `).join('');

    els.categoryList.querySelectorAll('[data-category-checkbox]').forEach((cb) => {
      cb.addEventListener('change', () => {
        if (cb.checked) state.selectedCategories.add(cb.value);
        else state.selectedCategories.delete(cb.value);
        state.page = 1;
        render();
      });
    });
  }

  function getFilteredProducts() {
    const search = state.search.trim().toLowerCase();
    return state.products.filter((p) => {
      if (state.selectedCategories.size > 0 && !state.selectedCategories.has(p.category)) return false;
      if (state.minPrice != null && p.price < state.minPrice) return false;
      if (state.maxPrice != null && p.price > state.maxPrice) return false;
      if (state.availability === 'in_stock' && p.availability !== 'in_stock') return false;
      if (state.availability === 'preorder' && p.availability === 'in_stock') return false;
      if (search && !p.title.toLowerCase().includes(search)) return false;
      return true;
    });
  }

  function pluralProducts(n) {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return 'товар';
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'товара';
    return 'товаров';
  }

  function renderToolbar(filtered) {
    if (state.selectedCategories.size === 1) {
      const slug = [...state.selectedCategories][0];
      const cat = state.categories.find((c) => c.slug === slug);
      els.catalogTitle.textContent = cat ? cat.name : 'Товары';
    } else {
      els.catalogTitle.textContent = 'Все товары';
    }
    els.catalogCount.textContent = `${filtered.length} ${pluralProducts(filtered.length)}`;
  }

  function renderGrid(filtered) {
    const start = (state.page - 1) * PAGE_SIZE;
    const pageItems = filtered.slice(start, start + PAGE_SIZE);

    if (pageItems.length === 0) {
      els.grid.innerHTML = '<div class="empty-state">По вашему запросу ничего не найдено. Попробуйте изменить фильтры.</div>';
      els.grid.style.display = 'block';
    } else {
      els.grid.style.display = '';
      els.grid.innerHTML = pageItems.map((p) => VIPRASSADA.productCardHtml(p)).join('');
    }
  }

  function renderPagination(filtered) {
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    if (state.page > totalPages) state.page = totalPages;

    if (totalPages <= 1) {
      els.pagination.innerHTML = '';
      return;
    }

    const pages = new Set([1, totalPages, state.page, state.page - 1, state.page + 1]);
    const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);

    let html = `<button type="button" class="page-nav" data-page="${state.page - 1}" ${state.page === 1 ? 'disabled' : ''}>‹</button>`;
    let prev = 0;
    sorted.forEach((p) => {
      if (prev && p - prev > 1) html += '<span>…</span>';
      html += `<button type="button" class="${p === state.page ? 'active' : ''}" data-page="${p}">${p}</button>`;
      prev = p;
    });
    html += `<button type="button" class="page-nav" data-page="${state.page + 1}" ${state.page === totalPages ? 'disabled' : ''}>›</button>`;

    els.pagination.innerHTML = html;
    els.pagination.querySelectorAll('[data-page]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const p = Number(btn.getAttribute('data-page'));
        if (p >= 1 && p <= totalPages) {
          state.page = p;
          render();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    });
  }

  function render() {
    updateFiltersCount();
    const filtered = getFilteredProducts();
    renderToolbar(filtered);
    renderGrid(filtered);
    renderPagination(filtered);
  }

  function init() {
    VIPRASSADA.loadData().then((data) => {
      state.categories = data.categories;
      state.products = data.products.slice().sort((a, b) => a.title.localeCompare(b.title, 'ru'));

      const params = new URLSearchParams(window.location.search);
      const categoryParam = params.get('category');
      if (categoryParam && state.categories.some((c) => c.slug === categoryParam)) {
        state.selectedCategories.add(categoryParam);
      }

      els.totalCount.textContent = `${state.products.length} ${pluralProducts(state.products.length)}`;

      renderCategoryList();

      els.priceMin.addEventListener('input', () => {
        state.minPrice = els.priceMin.value ? Number(els.priceMin.value) : null;
        state.page = 1;
        render();
      });
      els.priceMax.addEventListener('input', () => {
        state.maxPrice = els.priceMax.value ? Number(els.priceMax.value) : null;
        state.page = 1;
        render();
      });

      els.availability.querySelectorAll('button').forEach((btn) => {
        btn.addEventListener('click', () => {
          els.availability.querySelectorAll('button').forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          state.availability = btn.getAttribute('data-value');
          state.page = 1;
          render();
        });
      });

      els.search.addEventListener('input', () => {
        state.search = els.search.value;
        state.page = 1;
        render();
      });

      render();
    }).catch((err) => {
      els.grid.innerHTML = '<div class="empty-state">Не удалось загрузить каталог товаров.</div>';
      console.error(err);
    });
  }

  init();
})();
