// Measure the same A4 layout used for printing. Small categories stay together;
// large tables repeat their category/column headers on every continuation page.
export function paginateScenarioReport(root) {
  const header = root.querySelector('.pdf-report-header');
  const overview = [...root.children].filter(node => node.matches('.pdf-report-cards, .pdf-report-scope'));
  const groups = [...root.querySelectorAll('.pdf-report-group')];
  const subtotal = root.querySelector('.pdf-report-subtotal');
  const pages = [];
  root.replaceChildren();
  function newPage() {
    const sheet = document.createElement('section');
    sheet.className = 'pdf-sheet' + (pages.length ? ' pdf-sheet-continuation' : '');
    sheet.append(header.cloneNode(true));
    const body = document.createElement('div'); body.className = 'pdf-sheet-body'; sheet.append(body);
    const footer = document.createElement('div'); footer.className = 'pdf-sheet-footer';
    const brand = document.createElement('span'); brand.textContent = 'NOVO HUGO · Relatório de custeio';
    const count = document.createElement('span'); count.className = 'pdf-page-number';
    footer.append(brand, count); sheet.append(footer); root.append(sheet);
    const page = { sheet, body }; pages.push(page); return page;
  }
  const fits = page => page.body.scrollHeight <= page.body.clientHeight + 1;
  let page = newPage();
  for (const node of overview) page.body.append(node);
  for (const [index, group] of groups.entries()) {
    const trailing = index === groups.length - 1 ? subtotal : null;
    const rows = [...group.querySelector('tbody').children];
    const hasContent = page.body.children.length > 0;
    page.body.append(group); if (trailing) page.body.append(trailing);
    if (fits(page)) continue;
    group.remove(); trailing?.remove();
    if (hasContent && rows.length <= 8) {
      page = newPage(); page.body.append(group); if (trailing) page.body.append(trailing);
      if (fits(page)) continue;
      group.remove(); trailing?.remove();
    }
    if (hasContent && rows.length > 8) {
      const probe = group.cloneNode(true);
      probe.querySelector('tbody').replaceChildren(...rows.slice(0, 2).map(row => row.cloneNode(true)));
      page.body.append(probe);
      const roomForStart = fits(page); probe.remove();
      if (!roomForStart) page = newPage();
    }
    let next = 0, continuation = false;
    while (next < rows.length) {
      const fragment = group.cloneNode(true);
      const body = fragment.querySelector('tbody'); body.replaceChildren();
      fragment.querySelector('.pdf-continuation').hidden = !continuation;
      page.body.append(fragment);
      const start = next;
      while (next < rows.length) {
        body.append(rows[next].cloneNode(true));
        const last = next === rows.length - 1;
        if (last && trailing) page.body.append(trailing);
        if (!fits(page)) {
          body.lastElementChild.remove(); trailing?.remove();
          if (next === start) throw new Error('Uma linha excede a área disponível da página.');
          // Keep at least two service rows on a continuation when possible.
          if (rows.length - next === 1 && body.children.length > 2) { body.lastElementChild.remove(); next--; }
          break;
        }
        next++;
      }
      if (next < rows.length) { continuation = true; page = newPage(); }
    }
  }
  for (const [index, item] of pages.entries()) {
    item.sheet.querySelector('.pdf-page-number').textContent = `Página ${index + 1} de ${pages.length}`;
  }
  return pages.length;
}
