import { currency, signedCurrency, number, roundCurrency, describePriceReference, escapeHtml as h } from './format.js';

export const pdfSections = [
  { key: 'total', label: 'Total mensal do cenário', checked: true },
  { key: 'beds', label: 'Mapa de leitos', checked: true },
  { key: 'delta', label: 'Variação sobre a base', checked: false },
  { key: 'base', label: 'Base de referência', checked: false },
  { key: 'scenario', label: 'Identificação da opção selecionada', checked: true },
];
export const pdfColumns = [
  { key: 'quantity', label: 'Quantidade / leitos', checked: true },
  { key: 'factor', label: 'Ocupação / horas médias', checked: true },
  { key: 'volume', label: 'Produção mensal', checked: false },
  { key: 'unit', label: 'Custo unitário', checked: true },
  { key: 'reference', label: 'Referência do custo', checked: true },
  { key: 'amount', label: 'Total mensal por serviço', checked: true },
];

export function createScenarioReport({ title, snapshot, baseTotal = snapshot.baseTotal, volume, createdAt = new Date() }) {
  return {
    title, period: snapshot.periodLabel || 'Valores mensais',
    scenario: snapshot.occupancyLabel || snapshot.baseName || '',
    issuedAt: new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' }).format(createdAt),
    total: snapshot.total, baseTotal,
    delta: snapshot.delta ?? roundCurrency(snapshot.total - baseTotal),
    beds: { ...(snapshot.bedMap || snapshot.beds) },
    rows: snapshot.rows.map(row => {
      const state = snapshot.state[row.id];
      return {
        id: String(row.id), group: row.group, name: row.name, kind: row.kind,
        criterion: row.criterion || (row.kind === 'bed' ? 'Paciente-dia' : row.kind === 'surgery' ? 'Hora cirúrgica' : ''),
        enabled: state.enabled, available: row.available !== false,
        quantity: state.qty, factor: state.factor, unit: state.unit,
        volume: volume ? volume(row, state) : state.qty,
        reference: describePriceReference(row, state.unit).exportLabel,
        amount: snapshot.values[row.id] ?? 0,
        excluded: snapshot.includeOmittedWard === false && row.countedInWorkbook === false,
      };
    }),
  };
}

export function selectedReportRows(report, selectedIds) {
  const selected = selectedIds === undefined
    ? new Set(report.rows.filter(row => row.enabled).map(row => row.id))
    : new Set([...selectedIds].map(String));
  return report.rows.filter(row => selected.has(row.id));
}

export function selectedReportTotal(rows) {
  return rows.reduce((sum, row) => sum + Math.round(row.amount * 100), 0) / 100;
}

export function renderScenarioReport(report, options = {}) {
  const sections = new Set(options.sections ?? pdfSections.filter(item => item.checked).map(item => item.key));
  const columns = pdfColumns.filter(item => (options.columns ?? pdfColumns.filter(item => item.checked).map(item => item.key)).includes(item.key));
  const rows = selectedReportRows(report, options.selectedIds);
  const cards = [];
  if (sections.has('total')) cards.push(['Total mensal do cenário', currency(report.total)]);
  if (sections.has('beds')) cards.push(['Mapa de leitos do cenário', `${number(report.beds.ward)} enfermaria + ${number(report.beds.icu)} UTI = ${number(report.beds.total)} leitos`]);
  if (sections.has('delta')) cards.push(['Variação sobre a base', signedCurrency(report.delta)]);
  if (sections.has('base')) cards.push(['Base de referência', currency(report.baseTotal)]);
  const cell = (row, key) => {
    if (key === 'quantity') return number(row.quantity);
    if (key === 'factor') return row.factor === undefined ? '—' : `${number(row.factor)}${row.kind === 'bed' ? '%' : ' h'}`;
    if (key === 'volume') return number(row.volume);
    if (key === 'unit') return Number.isFinite(row.unit) ? currency(row.unit) : 'Não informado';
    if (key === 'reference') return row.reference || '—';
    return currency(row.amount);
  };
  const groups = [...new Set(rows.map(row => row.group))];
  const hasAmounts = columns.some(column => column.key === 'amount');
  return `<header class="pdf-report-header"><span>NOVO HUGO · RELATÓRIO DE CUSTEIO</span><h1>${h(report.title)}</h1><p>${h(report.period)} · Emitido em ${h(report.issuedAt)} (Brasília)</p>${sections.has('scenario') && report.scenario ? `<p class="pdf-report-scenario">${h(report.scenario)}</p>` : ''}</header>
    ${cards.length ? `<dl class="pdf-report-cards">${cards.map(([label, value]) => `<div><dt>${h(label)}</dt><dd>${h(value)}</dd></div>`).join('')}</dl>` : ''}
    ${rows.length ? `<p class="pdf-report-scope">${rows.length} de ${report.rows.length} serviços incluídos neste relatório.${cards.length ? ' Os indicadores acima se referem ao cenário completo.' : ''}</p>` : ''}
    ${groups.map(group => {
      const items = rows.filter(row => row.group === group);
      return `<section class="pdf-report-group"><h2>${h(group)}</h2><table><thead><tr><th>Serviço</th>${columns.map(column => `<th>${h(column.label)}</th>`).join('')}</tr></thead><tbody>${items.map(row => `<tr><td><strong>${h(row.name)}</strong>${row.criterion ? `<small>${h(row.criterion)}</small>` : ''}${!row.enabled ? '<small>Não incluído no cenário · custo considerado zero</small>' : ''}${row.excluded ? '<small>Fora do subtotal financeiro da fonte</small>' : ''}</td>${columns.map(column => `<td class="pdf-col-${column.key}">${h(cell(row, column.key))}</td>`).join('')}</tr>`).join('')}</tbody></table></section>`;
    }).join('')}
    ${rows.length && hasAmounts ? `<footer class="pdf-report-subtotal"><span>${rows.length === report.rows.length ? 'Total dos serviços apresentados' : 'Subtotal dos serviços selecionados'}</span><strong>${h(currency(selectedReportTotal(rows)))}</strong></footer>` : ''}`;
}
