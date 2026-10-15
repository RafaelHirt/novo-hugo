import { currency, number } from './format.js';

export function renderComparison({ rows, state, values, total, totals, beds }) {
  document.querySelector('#comparison-current-total').textContent = currency(total);
  document.querySelector('#comparison-footer-total').textContent = currency(total);
  document.querySelector('#comparison-beds').textContent = `${number(beds.ward)} enfermaria + ${number(beds.icu)} UTI = ${number(beds.total)} leitos`;
  document.querySelector('#comparison-groups').innerHTML = totals.map(item => `<tr><th scope="row">${item.group}</th><td data-label="HUGO" class="compare-value">${currency(item.total)}</td><td data-label="Base HUGOL" class="compare-pending" aria-label="Dados HUGOL pendentes">—</td><td data-label="Diferença" class="compare-pending">—</td></tr>`).join('');
  document.querySelector('#comparison-services').innerHTML = rows.map(row => `<tr><th scope="row">${row.name}<small>${row.group}${state[row.id].enabled ? '' : ' · Retirado'}</small></th><td data-label="Quantidade / leitos">${number(state[row.id].enabled ? state[row.id].qty : 0)}</td><td data-label="HUGO" class="compare-value">${currency(values[row.id])}</td><td data-label="Base HUGOL" class="compare-pending" aria-label="Dados HUGOL pendentes">—</td><td data-label="Diferença" class="compare-pending">—</td></tr>`).join('');
}
