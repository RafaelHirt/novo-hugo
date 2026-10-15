import { currency, number } from './format.js';

export function renderComparison({ rows, state, values, total, totals, beds }) {
  document.querySelector('#comparison-current-total').textContent = currency(total);
  document.querySelector('#comparison-footer-total').textContent = currency(total);
  document.querySelector('#comparison-beds').textContent = `${number(beds.ward)} enfermaria + ${number(beds.icu)} UTI = ${number(beds.total)} leitos`;
  const pending = `<td data-label="5º T.A · Base R$ HUGOL" class="compare-pending" aria-label="Dados do 5º T.A com base HUGOL pendentes">—</td><td data-label="5º T.A · Base R$ HUGO" class="compare-pending" aria-label="Dados do 5º T.A com base HUGO pendentes">—</td>`;
  document.querySelector('#comparison-groups').innerHTML = totals.map(item => `<tr><th scope="row">${item.group}</th><td data-label="T.A Atual" class="compare-value">${currency(item.total)}</td>${pending}</tr>`).join('');
  document.querySelector('#comparison-services').innerHTML = rows.map(row => `<tr><th scope="row">${row.name}<small>${row.group}${state[row.id].enabled ? '' : ' · Retirado'}</small></th><td data-label="${row.bedType === 'observation' ? 'Posições de observação' : row.kind === 'bed' ? 'Leitos' : 'Quantidade'} · T.A Atual">${number(state[row.id].enabled ? state[row.id].qty : 0)}</td><td data-label="T.A Atual" class="compare-value">${currency(values[row.id])}</td>${pending}</tr>`).join('');
}
