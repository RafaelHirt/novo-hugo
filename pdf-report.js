import { icon } from './icons.js';
import { currency, escapeHtml as h } from './format.js';
import { createScenarioReport, pdfSections, pdfColumns, selectedReportRows, selectedReportTotal, renderScenarioReport } from './pdf-model.js';

const normalize = text => text.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export function bindScenarioPdf(root, getScenario) {
  const actions = root.querySelector('.context-actions');
  if (!actions || actions.querySelector('[data-scenario-pdf]')) return;
  const button = document.createElement('button');
  button.type = 'button'; button.className = 'button secondary'; button.dataset.scenarioPdf = '';
  button.innerHTML = `${icon('printer')}Gerar PDF`;
  actions.insertBefore(button, actions.lastElementChild);
  button.addEventListener('click', () => openScenarioPdf(createScenarioReport({ title: root.querySelector('.context h2').textContent, ...getScenario() }), button));
}

function openScenarioPdf(report, trigger) {
  document.querySelector('#scenario-pdf-dialog')?.remove();
  const dialog = document.createElement('dialog');
  dialog.id = 'scenario-pdf-dialog'; dialog.className = 'pdf-dialog'; dialog.setAttribute('aria-labelledby', 'pdf-dialog-title');
  const choices = (items, kind) => items.map(item => `<label class="pdf-option"><input type="checkbox" data-pdf-${kind}="${item.key}" ${item.checked ? 'checked' : ''}><span>${h(item.label)}</span></label>`).join('');
  dialog.innerHTML = `<div class="pdf-dialog-header"><div><h2 id="pdf-dialog-title">Gerar PDF</h2><p>Escolha as informações e os serviços que deseja mostrar.</p></div><button type="button" class="button secondary" data-pdf-close aria-label="Fechar opções do PDF">${icon('close')}</button></div>
    <div class="pdf-dialog-body"><p class="pdf-dialog-context">${h(report.title)}</p>
      <fieldset class="pdf-settings"><legend>Informações do resumo</legend><div class="pdf-option-grid">${choices(pdfSections, 'section')}</div></fieldset>
      <fieldset class="pdf-settings"><legend>Colunas dos serviços</legend><div class="pdf-option-grid">${choices(pdfColumns, 'column')}</div></fieldset>
      <div class="pdf-services-heading"><h3>Serviços no relatório</h3><div><button type="button" class="text-button" data-pdf-active>Selecionar ativos</button><button type="button" class="text-button" data-pdf-clear>Limpar seleção</button></div></div>
      <label class="search"><span class="sr-only">Buscar serviços para o PDF</span>${icon('search')}<input type="search" data-pdf-search placeholder="Buscar categoria ou serviço"></label>
      <div class="pdf-service-list" data-pdf-services></div>
    </div>
    <div class="pdf-dialog-footer"><div><strong data-pdf-selection role="status" aria-live="polite"></strong><p>Na janela de impressão, escolha “Salvar como PDF”.</p></div><div class="pdf-dialog-actions"><button type="button" class="button secondary" data-pdf-close>Cancelar</button><button type="button" class="button primary" data-pdf-generate>${icon('printer')}Gerar PDF</button></div></div>`;
  document.body.append(dialog);
  const selected = new Set(report.rows.filter(row => row.enabled).map(row => row.id));
  const groups = [...new Set(report.rows.map(row => row.group))];
  let visibleGroups = new Map();
  const options = () => ({
    sections: [...dialog.querySelectorAll('[data-pdf-section]:checked')].map(input => input.dataset.pdfSection),
    columns: [...dialog.querySelectorAll('[data-pdf-column]:checked')].map(input => input.dataset.pdfColumn),
    selectedIds: selected,
  });
  function sync() {
    for (const input of dialog.querySelectorAll('[data-pdf-row]')) input.checked = selected.has(input.dataset.pdfRow);
    for (const input of dialog.querySelectorAll('[data-pdf-group]')) {
      const ids = visibleGroups.get(Number(input.dataset.pdfGroup)) || [];
      const count = ids.filter(id => selected.has(id)).length;
      input.checked = count === ids.length; input.indeterminate = count > 0 && count < ids.length;
    }
    const chosen = selectedReportRows(report, selected), config = options();
    dialog.querySelector('[data-pdf-selection]').textContent = `${chosen.length} serviços selecionados${config.columns.includes('amount') && chosen.length ? ' · Subtotal: ' + currency(selectedReportTotal(chosen)) : ''}`;
    dialog.querySelector('[data-pdf-generate]').disabled = !chosen.length && !config.sections.some(key => key !== 'scenario');
  }
  function renderRows() {
    const query = normalize(dialog.querySelector('[data-pdf-search]').value.trim());
    const visible = report.rows.filter(row => !query || normalize(row.name + ' ' + row.group).includes(query));
    visibleGroups = new Map();
    dialog.querySelector('[data-pdf-services]').innerHTML = groups.map((group, index) => {
      const items = visible.filter(row => row.group === group);
      if (!items.length) return '';
      visibleGroups.set(index, items.map(row => row.id));
      return `<fieldset class="pdf-service-group"><legend><label><input type="checkbox" data-pdf-group="${index}"><span>${h(group)}</span><small>${items.length} serviços</small></label></legend>${items.map(row => `<label class="pdf-service-choice"><input type="checkbox" data-pdf-row="${h(row.id)}"><span>${h(row.name)}${!row.enabled ? '<small>Não incluído no cenário</small>' : ''}</span><strong>${h(currency(row.amount))}</strong></label>`).join('')}</fieldset>`;
    }).join('') || '<p class="pdf-no-results">Nenhum serviço encontrado.</p>';
    sync();
  }
  dialog.addEventListener('change', event => {
    const input = event.target;
    if (input.dataset.pdfRow !== undefined) input.checked ? selected.add(input.dataset.pdfRow) : selected.delete(input.dataset.pdfRow);
    if (input.dataset.pdfGroup !== undefined) for (const id of visibleGroups.get(Number(input.dataset.pdfGroup)) || []) input.checked ? selected.add(id) : selected.delete(id);
    sync();
  });
  dialog.querySelector('[data-pdf-search]').addEventListener('input', renderRows);
  dialog.querySelector('[data-pdf-clear]').addEventListener('click', () => { selected.clear(); sync(); });
  dialog.querySelector('[data-pdf-active]').addEventListener('click', () => { selected.clear(); for (const row of report.rows) if (row.enabled) selected.add(row.id); sync(); });
  for (const close of dialog.querySelectorAll('[data-pdf-close]')) close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => trigger.focus());
  dialog.querySelector('[data-pdf-generate]').addEventListener('click', () => {
    document.querySelector('#scenario-pdf-document')?.remove();
    const documentRoot = document.createElement('article');
    documentRoot.id = 'scenario-pdf-document'; documentRoot.className = 'pdf-print-document';
    documentRoot.innerHTML = renderScenarioReport(report, options());
    document.body.append(documentRoot);
    const previousTitle = document.title;
    document.title = 'Novo HUGO - ' + report.title;
    document.body.dataset.pdfExport = '';
    const cleanup = () => { document.body.removeAttribute('data-pdf-export'); documentRoot.remove(); document.title = previousTitle; };
    window.addEventListener('afterprint', cleanup, { once: true });
    dialog.close();
    requestAnimationFrame(() => requestAnimationFrame(() => {
      try { window.print(); }
      catch { cleanup(); window.removeEventListener('afterprint', cleanup); dialog.showModal(); }
    }));
  });
  renderRows(); dialog.showModal();
}
