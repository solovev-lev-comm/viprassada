(function () {
  const PAGE_SIZE = 12;
  const TOMATO_SLUG = 'rassada-tomatov';
  const TOMATO_GROUND_TYPES = [
    { value: 'open', label: 'Открытый грунт' },
    { value: 'closed', label: 'Закрытый грунт' },
  ];
  const KAPUSTA_SLUG = 'kapusta';
  const CABBAGE_RIPENING_TYPES = [
    { value: 'early', label: 'Раннеспелая' },
    { value: 'mid', label: 'Среднеспелая' },
    { value: 'late', label: 'Позднеспелая' },
  ];

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
    tomatoGroundTypes: new Set(), // subset of {'open','closed'}; empty = none picked
    cabbageRipening: new Set(), // subset of {'early','mid','late'}; empty = none picked
    minPrice: null,
    maxPrice: null,
    availability: 'all',
    search: '',
    page: 1,
  };

  function updateFiltersCount() {
    let count = 0;
    if (state.selectedCategories.size > 0 && state.selectedCategories.size < state.categories.length) count++;
    if (state.tomatoGroundTypes.size > 0 && state.tomatoGroundTypes.size < TOMATO_GROUND_TYPES.length) count++;
    if (state.cabbageRipening.size > 0 && state.cabbageRipening.size < CABBAGE_RIPENING_TYPES.length) count++;
    if (state.minPrice != null || state.maxPrice != null) count++;
    if (state.availability !== 'all') count++;
    if (els.filtersCount) els.filtersCount.textContent = String(count);
  }

  // Single source of truth for the tomato category + grunt sub-filter.
  // The parent "Рассада томатов" checkbox only ever appears checked when
  // BOTH ground types are selected; picking just one leaves the parent
  // unchecked, matching the checkbox-tree convention the client asked for.
  function setTomatoGroundTypes(selected) {
    state.tomatoGroundTypes = selected;

    if (state.tomatoGroundTypes.size > 0) {
      state.selectedCategories.add(TOMATO_SLUG);
    } else {
      state.selectedCategories.delete(TOMATO_SLUG);
    }
  }

  function syncTomatoUI() {
    const parentCb = els.categoryList.querySelector(`[data-category-checkbox][value="${TOMATO_SLUG}"]`);
    if (parentCb) parentCb.checked = state.tomatoGroundTypes.size === TOMATO_GROUND_TYPES.length;
    els.categoryList.querySelectorAll('[data-growing-type]').forEach((cb) => {
      cb.checked = state.tomatoGroundTypes.has(cb.value);
    });
  }

  // Same pattern as the tomato ground-type filter, for the cabbage category's
  // ripening period — see setTomatoGroundTypes/syncTomatoUI above.
  function setCabbageRipening(selected) {
    state.cabbageRipening = selected;

    if (state.cabbageRipening.size > 0) {
      state.selectedCategories.add(KAPUSTA_SLUG);
    } else {
      state.selectedCategories.delete(KAPUSTA_SLUG);
    }
  }

  function syncCabbageUI() {
    const parentCb = els.categoryList.querySelector(`[data-category-checkbox][value="${KAPUSTA_SLUG}"]`);
    if (parentCb) parentCb.checked = state.cabbageRipening.size === CABBAGE_RIPENING_TYPES.length;
    els.categoryList.querySelectorAll('[data-ripening]').forEach((cb) => {
      cb.checked = state.cabbageRipening.has(cb.value);
    });
  }

  function categoryRowHtml(cat) {
    if (cat.slug !== TOMATO_SLUG && cat.slug !== KAPUSTA_SLUG) {
      return `
        <label class="filters__checkbox">
          <input type="checkbox" data-category-checkbox value="${VIPRASSADA.escapeHtml(cat.slug)}" ${state.selectedCategories.has(cat.slug) ? 'checked' : ''}>
          ${VIPRASSADA.escapeHtml(cat.name)}
        </label>
      `;
    }

    const isTomato = cat.slug === TOMATO_SLUG;
    const subOptions = (isTomato ? TOMATO_GROUND_TYPES : CABBAGE_RIPENING_TYPES).map(({ value, label }) => `
      <label class="filters__checkbox filters__checkbox--sub">
        <input type="checkbox" ${isTomato ? 'data-growing-type' : 'data-ripening'} value="${value}"> ${VIPRASSADA.escapeHtml(label)}
      </label>
    `).join('');
    const expandAttr = isTomato ? 'data-tomato-expand' : 'data-cabbage-expand';
    const subPanelAttr = isTomato ? 'data-tomato-subcategories' : 'data-cabbage-subcategories';
    const expandLabel = isTomato ? 'Показать подкатегории грунта' : 'Показать сроки созревания';

    return `
      <div class="filters__category-item">
        <div class="filters__category-row">
          <label class="filters__checkbox">
            <input type="checkbox" data-category-checkbox value="${cat.slug}" ${state.selectedCategories.has(cat.slug) ? 'checked' : ''}>
            ${VIPRASSADA.escapeHtml(cat.name)}
          </label>
          <button type="button" class="filters__expand-btn" ${expandAttr} aria-label="${expandLabel}" aria-expanded="false">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>
          </button>
        </div>
        <div class="filters__subcategories" ${subPanelAttr}>
          <div class="filters__subcategories-inner">
            ${subOptions}
          </div>
        </div>
      </div>
    `;
  }

  function renderCategoryList() {
    els.categoryList.innerHTML = state.categories.map(categoryRowHtml).join('');

    els.categoryList.querySelectorAll('[data-category-checkbox]').forEach((cb) => {
      cb.addEventListener('change', () => {
        if (cb.value === TOMATO_SLUG) {
          // Checking the parent selects both ground types; unchecking clears them.
          setTomatoGroundTypes(cb.checked ? new Set(TOMATO_GROUND_TYPES.map((t) => t.value)) : new Set());
          syncTomatoUI();
        } else if (cb.value === KAPUSTA_SLUG) {
          setCabbageRipening(cb.checked ? new Set(CABBAGE_RIPENING_TYPES.map((t) => t.value)) : new Set());
          syncCabbageUI();
        } else if (cb.checked) {
          state.selectedCategories.add(cb.value);
        } else {
          state.selectedCategories.delete(cb.value);
        }

        state.page = 1;
        render();
      });
    });

    const expandBtn = els.categoryList.querySelector('[data-tomato-expand]');
    const subPanel = els.categoryList.querySelector('[data-tomato-subcategories]');
    if (expandBtn && subPanel) {
      expandBtn.addEventListener('click', () => {
        const isOpen = subPanel.classList.toggle('filters__subcategories--open');
        expandBtn.classList.toggle('filters__expand-btn--open', isOpen);
        expandBtn.setAttribute('aria-expanded', String(isOpen));
      });
    }

    els.categoryList.querySelectorAll('[data-growing-type]').forEach((cb) => {
      cb.addEventListener('change', () => {
        const next = new Set(state.tomatoGroundTypes);
        if (cb.checked) next.add(cb.value); else next.delete(cb.value);
        setTomatoGroundTypes(next);
        syncTomatoUI();
        state.page = 1;
        render();
      });
    });

    const cabbageExpandBtn = els.categoryList.querySelector('[data-cabbage-expand]');
    const cabbageSubPanel = els.categoryList.querySelector('[data-cabbage-subcategories]');
    if (cabbageExpandBtn && cabbageSubPanel) {
      cabbageExpandBtn.addEventListener('click', () => {
        const isOpen = cabbageSubPanel.classList.toggle('filters__subcategories--open');
        cabbageExpandBtn.classList.toggle('filters__expand-btn--open', isOpen);
        cabbageExpandBtn.setAttribute('aria-expanded', String(isOpen));
      });
    }

    els.categoryList.querySelectorAll('[data-ripening]').forEach((cb) => {
      cb.addEventListener('change', () => {
        const next = new Set(state.cabbageRipening);
        if (cb.checked) next.add(cb.value); else next.delete(cb.value);
        setCabbageRipening(next);
        syncCabbageUI();
        state.page = 1;
        render();
      });
    });

    syncTomatoUI();
    syncCabbageUI();
  }

  function getFilteredProducts() {
    const search = state.search.trim().toLowerCase();

    // Picking just one ground type narrows the tomato results to that type
    // (products marked "both" always stay visible); picking both or
    // neither is equivalent to no ground-type filter at all.
    const groundFilterActive = state.tomatoGroundTypes.size === 1;
    const allowedGroundType = groundFilterActive ? [...state.tomatoGroundTypes][0] : null;

    // Picking a subset of ripening periods narrows the cabbage results to
    // those periods; picking all of them or none is the same as no filter.
    const ripeningFilterActive = state.cabbageRipening.size > 0 && state.cabbageRipening.size < CABBAGE_RIPENING_TYPES.length;

    return state.products.filter((p) => {
      if (state.selectedCategories.size > 0 && !state.selectedCategories.has(p.category)) return false;
      if (groundFilterActive && p.category === TOMATO_SLUG && p.growingType !== allowedGroundType && p.growingType !== 'both') return false;
      if (ripeningFilterActive && p.category === KAPUSTA_SLUG && !state.cabbageRipening.has(p.ripening)) return false;
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
      const categoryMatched = categoryParam && state.categories.some((c) => c.slug === categoryParam);
      if (categoryMatched) {
        if (categoryParam === TOMATO_SLUG) {
          setTomatoGroundTypes(new Set(TOMATO_GROUND_TYPES.map((t) => t.value)));
        } else if (categoryParam === KAPUSTA_SLUG) {
          setCabbageRipening(new Set(CABBAGE_RIPENING_TYPES.map((t) => t.value)));
        } else {
          state.selectedCategories.add(categoryParam);
        }
      }

      els.totalCount.textContent = `${state.products.length} ${pluralProducts(state.products.length)}`;

      renderCategoryList();

      // Короткая подсветка категории, пришедшей через ?category= (например,
      // с плиток категорий на главной) — видно, что фильтр применился сам,
      // а не просто оказался отмечен.
      if (categoryMatched) {
        const checkbox = els.categoryList.querySelector(`[data-category-checkbox][value="${categoryParam}"]`);
        const row = checkbox && checkbox.closest('.filters__checkbox');
        if (row) {
          row.classList.add('filters__checkbox--highlight');
          row.addEventListener('animationend', () => row.classList.remove('filters__checkbox--highlight'), { once: true });
        }
      }

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

      // "Сбросить" в мобильном дровере — возвращает все фильтры к
      // исходному состоянию, не закрывая панель (как у Кофемании).
      const resetBtn = document.querySelector('[data-filters-reset]');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          state.selectedCategories.clear();
          setTomatoGroundTypes(new Set());
          setCabbageRipening(new Set());
          state.minPrice = null;
          state.maxPrice = null;
          state.availability = 'all';
          els.priceMin.value = '';
          els.priceMax.value = '';
          els.availability.querySelectorAll('button').forEach((b) => {
            b.classList.toggle('active', b.getAttribute('data-value') === 'all');
          });
          els.categoryList.querySelectorAll('[data-category-checkbox]').forEach((cb) => { cb.checked = false; });
          syncTomatoUI();
          syncCabbageUI();
          state.page = 1;
          render();
        });
      }

      render();
    }).catch((err) => {
      els.grid.innerHTML = '<div class="empty-state">Не удалось загрузить каталог товаров.</div>';
      console.error(err);
    });
  }

  init();
})();
