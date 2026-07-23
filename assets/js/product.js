(function () {
  const root = document.querySelector('[data-product-root]');

  function specHtml(label, value) {
    if (!value) return '';
    return `
      <div>
        <div class="product-main__spec-label">${VIPRASSADA.escapeHtml(label)}</div>
        <div class="product-main__spec-value">${VIPRASSADA.escapeHtml(value)}</div>
      </div>
    `;
  }

  function relatedSectionHtml(related) {
    if (related.length === 0) return '';
    return `
      <section class="related">
        <h2 class="related__title">Похожие товары</h2>
        <div class="product-grid">
          ${related.map((p) => VIPRASSADA.productCardHtml(p)).join('')}
        </div>
      </section>
    `;
  }

  function renderNotFound() {
    root.innerHTML = `
      <div class="page-head">
        <a href="catalog.html" class="breadcrumb-back">← Назад в каталог</a>
        <h1 class="page-head__title">Товар не найден</h1>
        <p class="page-head__meta">Возможно, он был снят с продажи. Посмотрите остальные товары в <a href="catalog.html">каталоге</a>.</p>
      </div>
    `;
  }

  function renderProduct(product, related) {
    document.title = `${product.title} — VIPRASSADA`;

    const specs = specHtml('Размер кассеты', product.trayUnit);

    root.innerHTML = `
      <div class="page-head">
        <a href="catalog.html?category=${encodeURIComponent(product.category)}" class="breadcrumb-back">← Назад в каталог</a>
        <div class="breadcrumb-trail">
          <a href="catalog.html">Каталог</a> / <a href="catalog.html?category=${encodeURIComponent(product.category)}">${VIPRASSADA.escapeHtml(product.categoryName)}</a> / ${VIPRASSADA.escapeHtml(product.title)}
        </div>
      </div>

      <div class="product-main">
        ${VIPRASSADA.productPhotoHtml(product.photo, 'product-main__photo')}

        <div class="product-main__info">
          <div class="product-main__category">${VIPRASSADA.escapeHtml(product.categoryName)}</div>
          <h1 class="product-main__title">${VIPRASSADA.escapeHtml(product.title)}</h1>

          <div class="product-main__badge">${VIPRASSADA.availabilityBadgeHtml(product)}${VIPRASSADA.groundTypeBadgeHtml(product)}</div>

          <div class="product-main__price-block">
            <span class="product-main__price">${VIPRASSADA.priceDisplayHtml(product)}</span>
          </div>

          ${specs ? `<div class="product-main__specs">${specs}</div>` : ''}

          ${product.description ? `<p class="product-main__desc">${VIPRASSADA.escapeHtml(product.description)}</p>` : ''}

          <button class="btn btn-primary">Позвонить по этому товару</button>
        </div>
      </div>

      ${relatedSectionHtml(related)}
    `;
  }

  VIPRASSADA.loadData().then((data) => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const product = data.products.find((p) => p.id === id);

    if (!product) {
      renderNotFound();
      return;
    }

    const related = data.products
      .filter((p) => p.id !== product.id && p.category === product.category)
      .slice(0, 4);

    renderProduct(product, related);
  }).catch((err) => {
    root.innerHTML = '<div class="page-head"><p class="page-head__meta">Не удалось загрузить данные товара.</p></div>';
    console.error(err);
  });
})();
