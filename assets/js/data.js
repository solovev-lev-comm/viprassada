// Loads and exposes the product catalog from data/products.json.
window.VIPRASSADA = (function () {
  let dataPromise = null;

  function loadData() {
    if (!dataPromise) {
      dataPromise = fetch('data/products.json')
        .then((res) => {
          if (!res.ok) throw new Error('Failed to load products.json: ' + res.status);
          return res.json();
        });
    }
    return dataPromise;
  }

  function formatPrice(value) {
    return new Intl.NumberFormat('ru-RU').format(value) + ' ₽';
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

  function productCardHtml(product) {
    const oldPriceHtml = product.oldPrice
      ? `<span class="product-card__price-old">${formatPrice(product.oldPrice)}</span>`
      : '';
    return `
      <a class="product-card" href="product.html?id=${encodeURIComponent(product.id)}">
        <div class="product-card__photo" style="background-image:url('${escapeHtml(product.photo)}')"></div>
        <div class="product-card__body">
          <div class="product-card__name">${escapeHtml(product.title)}</div>
          <div class="product-card__category">${escapeHtml(product.categoryName)}</div>
          <div class="product-card__prices">
            ${oldPriceHtml}
            <span class="product-card__price">${formatPrice(product.price)}</span>
          </div>
          ${availabilityBadgeHtml(product)}
        </div>
      </a>
    `;
  }

  return { loadData, formatPrice, escapeHtml, availabilityBadgeHtml, productCardHtml };
})();
