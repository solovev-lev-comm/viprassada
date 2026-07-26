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

  // Static store-wide payment/wholesale info — same on every product page,
  // not driven by product data.
  function paymentAccordionHtml() {
    return `
      <div class="payment-accordion" data-payment-accordion>
        <button type="button" class="payment-accordion__toggle" data-payment-toggle aria-expanded="false">
          <span class="payment-accordion__toggle-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 13h6M9 17h4"/></svg>
          </span>
          <span class="payment-accordion__toggle-label">Оплата и опт</span>
          <svg class="payment-accordion__chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
        </button>
        <div class="payment-accordion__panel" data-payment-panel>
          <div class="payment-accordion__panel-inner">
            ${VIPRASSADA.paymentInfoRowsHtml()}
          </div>
        </div>
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

          ${paymentAccordionHtml()}

          <a href="tel:+79297675020" class="btn btn-primary product-main__cta">Позвонить по этому товару</a>
        </div>
      </div>

      ${relatedSectionHtml(related)}
    `;

    const paymentToggle = root.querySelector('[data-payment-toggle]');
    if (paymentToggle) {
      paymentToggle.addEventListener('click', () => {
        const accordion = paymentToggle.closest('[data-payment-accordion]');
        const isOpen = accordion.classList.toggle('payment-accordion--open');
        paymentToggle.setAttribute('aria-expanded', String(isOpen));
      });
    }
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
