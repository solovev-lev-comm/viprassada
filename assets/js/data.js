// Loads and exposes the 2026 product catalog from data/products_2026.json.
window.VIPRASSADA = (function () {
  let dataPromise = null;

  // Fixed display order + URL slugs for the known categories. Any category
  // name in the data file that isn't listed here falls back to a
  // transliterated slug, so a future rename/addition in products_2026.json
  // doesn't break the catalog.
  const CATEGORY_ORDER = [
    ['Рассада томатов', 'rassada-tomatov'],
    ['Овощи', 'ovoschi'],
    ['Капуста', 'kapusta'],
    ['Однолетние растения', 'odnoletnie-rasteniya'],
    ['Пряные травы', 'pryanye-travy'],
    ['Огород на окне', 'ogorod-na-okne'],
    ['Клубника и земляника', 'klubnika-i-zemlyanika'],
    ['Укоренённые черенки', 'cherenki'],
  ];
  const CATEGORY_SLUGS = new Map(CATEGORY_ORDER);
  const CATEGORY_RANK = new Map(CATEGORY_ORDER.map(([name], i) => [name, i]));

  const TRANSLIT = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i',
    й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't',
    у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '',
    э: 'e', ю: 'yu', я: 'ya',
  };
  function slugify(name) {
    return name
      .toLowerCase()
      .split('')
      .map((ch) => (ch in TRANSLIT ? TRANSLIT[ch] : (/[a-z0-9]/.test(ch) ? ch : '-')))
      .join('')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
  function slugForCategory(name) {
    return CATEGORY_SLUGS.get(name) || slugify(name);
  }

  function loadData() {
    if (!dataPromise) {
      dataPromise = fetch('data/products_2026.json')
        .then((res) => {
          if (!res.ok) throw new Error('Failed to load products_2026.json: ' + res.status);
          return res.json();
        })
        .then((rawProducts) => {
          const categoryNames = [];
          rawProducts.forEach((p) => {
            if (!categoryNames.includes(p.category)) categoryNames.push(p.category);
          });
          categoryNames.sort((a, b) => {
            const ra = CATEGORY_RANK.has(a) ? CATEGORY_RANK.get(a) : Infinity;
            const rb = CATEGORY_RANK.has(b) ? CATEGORY_RANK.get(b) : Infinity;
            return ra - rb;
          });

          const categories = categoryNames.map((name) => ({ slug: slugForCategory(name), name }));

          const products = rawProducts.map((p) => ({
            id: p.id,
            title: p.name,
            category: slugForCategory(p.category),
            categoryName: p.category,
            subcategory: p.subcategory,
            growingType: p.growingType,
            ripening: p.ripening,
            description: p.description,
            price: p.price_retail,
            priceWholesale: p.price_wholesale,
            trayUnit: p.tray_unit,
            photo: p.image,
            availability: p.in_stock ? 'in_stock' : 'preorder',
          }));

          return { categories, products };
        });
    }
    return dataPromise;
  }

  function formatNumber(value) {
    return new Intl.NumberFormat('ru-RU').format(value);
  }

  function formatPrice(value) {
    if (value == null) return 'Цена по запросу';
    return formatNumber(value) + ' ₽';
  }

  // Client wants wholesale shown alongside retail as "опт / розница" —
  // a single "25 / 35 ₽", no labels. Falls back to a plain retail price
  // (or the "Цена по запросу" placeholder) when there's no wholesale price.
  function priceDisplayHtml(product) {
    if (product.priceWholesale != null && product.price != null) {
      return `${formatNumber(product.priceWholesale)} / ${formatNumber(product.price)} ₽`;
    }
    return formatPrice(product.price);
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str == null ? '' : String(str);
    return div.innerHTML;
  }

  function availabilityBadgeHtml(product) {
    if (product.availability === 'in_stock') {
      return '<span class="badge badge-stock">В наличии</span>';
    }
    return '<span class="badge badge-preorder">Под заказ</span>';
  }

  const GROUND_TYPE_LABELS = { open: 'Открытый грунт', closed: 'Закрытый грунт' };

  // Only tomatoes carry a growingType; renders one badge, or both when the
  // variety suits either ground type.
  function groundTypeBadgeHtml(product) {
    if (!product.growingType) return '';
    const types = product.growingType === 'both' ? ['open', 'closed'] : [product.growingType];
    return types.map((t) => `<span class="badge badge-ground">${GROUND_TYPE_LABELS[t]}</span>`).join('');
  }

  const RIPENING_LABELS = { early: 'Раннеспелая', mid: 'Среднеспелая', late: 'Позднеспелая' };

  // Only the white cabbage varieties carry a ripening period — same badge
  // treatment as the tomatoes' ground type.
  function ripeningBadgeHtml(product) {
    if (!product.ripening) return '';
    return `<span class="badge badge-ground">${RIPENING_LABELS[product.ripening]}</span>`;
  }

  // Renders the photo area for a product card / product page. Falls back to
  // a branded placeholder (leaf icon on a primary/accent gradient) when the
  // product has no photo yet, instead of an empty box or broken image.
  function productPhotoHtml(photo, baseClass) {
    if (photo) {
      return `<div class="${baseClass}" style="background-image:url('${escapeHtml(photo)}')"></div>`;
    }
    return `
      <div class="${baseClass} ${baseClass}--placeholder">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21v-8"/><path d="M12 13c0-4 3-6 7-6 0 4-3 6-7 6z"/><path d="M12 13c0-3-3-5-6-5 0 3 3 5 6 5z"/></svg>
      </div>
    `;
  }

  // Store-wide payment/wholesale info — same content wherever it's shown
  // (product page accordion, header "Оплата" popup), so it lives here once.
  function paymentInfoRowsHtml() {
    return `
      <div class="payment-accordion__row">
        <span class="payment-accordion__row-icon">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>
        </span>
        <span><strong>Наличными</strong> — при получении заказа</span>
      </div>
      <div class="payment-accordion__row">
        <span class="payment-accordion__row-icon">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>
        </span>
        <span><strong>Картой / СБП</strong> — перевод при встрече</span>
      </div>
      <div class="payment-accordion__row">
        <span class="payment-accordion__row-icon">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
        </span>
        <span><strong>Безнал</strong> — счёт для ИП и юрлиц, опт</span>
      </div>
      <p class="payment-accordion__note">Опт считаем от кассеты — 40, 54 или 28 шт. в зависимости от культуры, не от суммы заказа. К каждому клиенту — индивидуальный подход, всё обсуждаем по звонку.</p>
    `;
  }

  function productCardHtml(product) {
    return `
      <a class="product-card" href="/product?id=${encodeURIComponent(product.id)}">
        ${productPhotoHtml(product.photo, 'product-card__photo')}
        <div class="product-card__body">
          <div class="product-card__name">${escapeHtml(product.title)}</div>
          <div class="product-card__category">${escapeHtml(product.categoryName)}</div>
          <div class="product-card__prices">
            <span class="product-card__price">${priceDisplayHtml(product)}</span>
          </div>
          <div class="product-card__badges">
            ${availabilityBadgeHtml(product)}
          </div>
        </div>
      </a>
    `;
  }

  return { loadData, formatPrice, priceDisplayHtml, escapeHtml, availabilityBadgeHtml, groundTypeBadgeHtml, ripeningBadgeHtml, productPhotoHtml, productCardHtml, paymentInfoRowsHtml };
})();
