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

  function productCardHtml(product) {
    return `
      <a class="product-card" href="product.html?id=${encodeURIComponent(product.id)}">
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

  return { loadData, formatPrice, priceDisplayHtml, escapeHtml, availabilityBadgeHtml, groundTypeBadgeHtml, productPhotoHtml, productCardHtml };
})();
