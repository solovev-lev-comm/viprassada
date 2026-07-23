(function () {
  const root = document.querySelector('[data-pricelist-root]');
  const countEl = document.querySelector('[data-pricelist-count]');

  let groups = []; // [{ name, products: [...] }]

  function pluralProducts(n) {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return 'товар';
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'товара';
    return 'товаров';
  }

  function rowHtml(p) {
    const note = p.availability === 'preorder' ? '<span class="pricelist__note">под заказ</span>' : '';
    return `
      <a class="pricelist__row" href="product.html?id=${encodeURIComponent(p.id)}" target="_blank" rel="noopener">
        <span class="pricelist__name">${VIPRASSADA.escapeHtml(p.title)}${note}</span>
        <span class="pricelist__price">${VIPRASSADA.priceDisplayHtml(p)}</span>
      </a>
    `;
  }

  function groupHtml(group) {
    return `
      <section class="pricelist__group">
        <h2 class="pricelist__category">${VIPRASSADA.escapeHtml(group.name)}</h2>
        <div class="pricelist__rows">
          ${group.products.map(rowHtml).join('')}
        </div>
      </section>
    `;
  }

  function render() {
    root.innerHTML = groups.map(groupHtml).join('');
  }

  // --- Downloads ---------------------------------------------------------
  // No build step / bundler on this site, so exports use dependency-free
  // techniques rather than real binary .docx/.xlsx libraries:
  // Word  -> an HTML document served with a .doc extension (Word opens
  //          HTML files saved as .doc; it may show a one-time format
  //          confirmation prompt, which is expected).
  // Excel -> a semicolon-delimited CSV with a UTF-8 BOM, so Cyrillic text
  //          and separate ru-locale Excel columns both work out of the box.
  // PDF   -> the browser's native print dialog (print stylesheet hides
  //          everything except the price list) — "Save as PDF" there.

  function triggerDownload(filename, content, mime) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function buildWordDoc() {
    const sections = groups.map((group) => {
      const rows = group.products.map((p) => `
        <tr>
          <td>${VIPRASSADA.escapeHtml(p.title)}</td>
          <td>${p.priceWholesale != null ? VIPRASSADA.formatPrice(p.priceWholesale) : ''}</td>
          <td>${p.price != null ? VIPRASSADA.formatPrice(p.price) : 'по запросу'}</td>
          <td>${p.availability === 'in_stock' ? 'В наличии' : 'Под заказ'}</td>
        </tr>
      `).join('');
      return `
        <h2 style="font-family:Georgia,serif;color:#2D5A3D;">${VIPRASSADA.escapeHtml(group.name)}</h2>
        <table style="border-collapse:collapse;width:100%;margin-bottom:24px;">
          <thead>
            <tr style="background:#E4EEE7;">
              <th style="border:1px solid #ccc;padding:6px 10px;text-align:left;">Товар</th>
              <th style="border:1px solid #ccc;padding:6px 10px;text-align:left;">Опт</th>
              <th style="border:1px solid #ccc;padding:6px 10px;text-align:left;">Розница</th>
              <th style="border:1px solid #ccc;padding:6px 10px;text-align:left;">Наличие</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      `;
    }).join('');

    return `<!DOCTYPE html>
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="utf-8"><title>Прайс-лист VIPRASSADA</title></head>
      <body style="font-family:Calibri,Arial,sans-serif;font-size:14px;color:#1F2A24;">
        <h1 style="font-family:Georgia,serif;color:#2D5A3D;">Прайс-лист VIPRASSADA</h1>
        <p>Актуально на ${new Date().toLocaleDateString('ru-RU')}</p>
        ${sections}
      </body>
      </html>`;
  }

  function csvField(value) {
    const str = String(value == null ? '' : value);
    return /[";\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  }

  function buildCsv() {
    const lines = [['Категория', 'Товар', 'Опт, ₽', 'Розница, ₽', 'Наличие'].join(';')];
    groups.forEach((group) => {
      group.products.forEach((p) => {
        lines.push([
          csvField(group.name),
          csvField(p.title),
          csvField(p.priceWholesale != null ? p.priceWholesale : ''),
          csvField(p.price != null ? p.price : 'по запросу'),
          csvField(p.availability === 'in_stock' ? 'В наличии' : 'Под заказ'),
        ].join(';'));
      });
    });
    return '﻿' + lines.join('\r\n');
  }

  document.querySelectorAll('[data-download]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const type = btn.getAttribute('data-download');
      if (type === 'pdf') {
        window.print();
      } else if (type === 'word') {
        triggerDownload('Прайс-лист VIPRASSADA.doc', buildWordDoc(), 'application/msword');
      } else if (type === 'excel') {
        triggerDownload('Прайс-лист VIPRASSADA.csv', buildCsv(), 'text/csv;charset=utf-8');
      }
    });
  });

  VIPRASSADA.loadData().then((data) => {
    const byName = new Map();
    data.products.forEach((p) => {
      if (!byName.has(p.categoryName)) byName.set(p.categoryName, []);
      byName.get(p.categoryName).push(p);
    });

    groups = data.categories
      .map((cat) => ({
        name: cat.name,
        products: (byName.get(cat.name) || []).slice().sort((a, b) => a.title.localeCompare(b.title, 'ru')),
      }))
      .filter((group) => group.products.length > 0);

    countEl.textContent = `${data.products.length} ${pluralProducts(data.products.length)}`;
    render();
  }).catch((err) => {
    root.innerHTML = '<div class="empty-state">Не удалось загрузить прайс-лист.</div>';
    console.error(err);
  });
})();
