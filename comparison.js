import { currency, number, escapeHtml as h } from './format.js';

let current, hugol;
const key = row => (row.group + '|' + row.name).toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9|]/g, '');
const pending = '<td data-label="5º T.A · Base R$ HUGO" class="compare-pending" aria-label="Dados do 5º T.A com base HUGO pendentes">—</td>';
const bedLabel = beds => `${number(beds.ward)} enfermaria + ${number(beds.icu)} UTI = ${number(beds.total)} leitos`;
export function renderComparison(snapshot) { current = snapshot; refresh(); }
export function setHugolComparison(snapshot) { hugol = snapshot; refresh(); }

function refresh() {
  if (!current) return;
  document.querySelector('#comparison-current-total').textContent = currency(current.total);
  document.querySelector('#comparison-footer-total').textContent = currency(current.total);
  document.querySelector('#comparison-beds').textContent = bedLabel(current.beds);
  document.querySelector('#comparison-hugol-total').textContent = hugol ? currency(hugol.total) : '—';
  document.querySelector('#comparison-hugol-footer-total').textContent = hugol ? currency(hugol.total) : '—';
  document.querySelector('#comparison-hugol-selection').textContent = hugol ? hugol.selected.map(item => item.name).join(' · ') || hugol.baseName + ' · Sem incrementos' : '';
  document.querySelector('#comparison-hugol-beds').textContent = hugol ? bedLabel(hugol.beds) : '';
  const groups = [...new Set([...current.totals, ...(hugol?.totals || [])].map(item => item.group))];
  document.querySelector('#comparison-groups').innerHTML = groups.map(group => `<tr><th scope="row">${h(group)}</th><td data-label="T.A Atual" class="compare-value">${currency(current.totals.find(item => item.group === group)?.total || 0)}</td><td data-label="5º T.A · Base R$ HUGOL" class="compare-value">${hugol ? currency(hugol.totals.find(item => item.group === group)?.total || 0) : '—'}</td>${pending}</tr>`).join('');
  const entries = new Map();
  for (const row of current.rows) entries.set(key(row), { current: row });
  for (const row of hugol?.rows || []) entries.set(key(row), { ...entries.get(key(row)), hugol: row });
  function cell(row, snapshot, label) {
    if (!row || !snapshot) return `<td data-label="${label}" class="compare-pending">—<small class="comparison-quantity">Sem este serviço</small></td>`;
    const state = snapshot.state[row.id], quantityLabel = row.bedType === 'observation' ? 'Posições de observação' : row.kind === 'bed' ? 'Leitos' : 'Quantidade';
    const excluded = snapshot.includeOmittedWard === false && row.countedInWorkbook === false;
    return `<td data-label="${label}" class="compare-value"><span>${currency(snapshot.values[row.id])}</span><small class="comparison-quantity">${quantityLabel}: ${number(state.enabled ? state.qty : 0)}${state.enabled ? '' : row.available === false ? ' · Não selecionado' : ' · Retirado'}${excluded ? ' · Fora do subtotal' : ''}</small></td>`;
  }
  document.querySelector('#comparison-services').innerHTML = [...entries.values()].map(entry => {
    const row = entry.current || entry.hugol;
    return `<tr><th scope="row">${h(row.name)}<small>${h(row.group)}</small></th>${cell(entry.current, current, 'T.A Atual')}${cell(entry.hugol, hugol, '5º T.A · Base R$ HUGOL')}${pending}</tr>`;
  }).join('');
}
