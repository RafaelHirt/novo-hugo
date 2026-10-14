import { rows, reference, cost, initial } from './data.js';
import { currency, signedCurrency, number, parseCurrency, roundCurrency } from './format.js';

let state = initial();
try {
  const saved = JSON.parse(localStorage.getItem('novo-hugo-v1'));
  if (Array.isArray(saved) && saved.length === rows.length) {
    state = saved.map((s, i) => ({
      enabled: typeof s.enabled === 'boolean' ? s.enabled : true,
      qty: Number.isFinite(s.qty) && s.qty >= 0 ? s.qty : rows[i].qty,
      unit: Number.isFinite(s.unit) && s.unit >= 0 ? s.unit : rows[i].unit,
      factor: rows[i].factor === undefined ? undefined
        : Number.isFinite(s.factor) && s.factor >= 0 && (rows[i].kind !== 'bed' || s.factor <= 100)
          ? s.factor : rows[i].factor,
    }));
  }
} catch {}

const groups = [...new Set(rows.map(r => r.group))];

function field(row, key, label) {
  const common = `aria-label="${label} — ${row.name}" data-id="${row.id}" data-key="${key}"`;
  if (key === 'unit') {
    return `<input ${common} class="money-input" type="text" inputmode="decimal" value="${currency(state[row.id][key])}">`;
  }
  return `<input ${common} type="number" min="0" ${key === 'factor' && row.kind === 'bed' ? 'max="100"' : ''} step="${key === 'qty' ? '1' : '0.01'}" value="${state[row.id][key]}">`;
}

function tables() {
  const query = document.querySelector('#search').value.toLocaleLowerCase('pt-BR');
  document.querySelector('#tables').innerHTML = groups.map(group => {
    const filtered = rows.filter(r => r.group === group && r.name.toLocaleLowerCase('pt-BR').includes(query));
    if (!filtered.length) return '';
    return `<details open>
      <summary>${group}<span data-group="${group}"></span></summary>
      <div class="table-scroll"><table>
        <thead><tr><th>Ativo / serviço</th><th>Quantidade / leitos</th><th>Ocupação / horas</th><th>Custo unitário</th><th>Total mensal</th></tr></thead>
        <tbody>${filtered.map(r => `<tr data-row="${r.id}" class="${state[r.id].enabled ? '' : 'disabled'}">
          <td><label class="service-name"><input type="checkbox" data-id="${r.id}" data-key="enabled" ${state[r.id].enabled ? 'checked' : ''}>
            <span>${r.name}<small>${r.kind === 'bed' ? 'Paciente-dia · referência ' + number(r.patientDays) : r.kind === 'surgery' ? 'Hora cirúrgica' : r.group === 'Escritório de gestão de altas' ? 'Nº de leitos' : 'Produção mensal'}</small></span>
          </label></td>
          <td>${field(r, 'qty', r.kind === 'bed' ? 'Leitos' : 'Quantidade')}</td>
          <td>${r.factor === undefined ? '<span class="muted">—</span>' : field(r, 'factor', r.kind === 'bed' ? 'Ocupação (%)' : 'Horas médias') + (r.kind === 'bed' ? ' %' : ' h')}</td>
          <td>${field(r, 'unit', 'Custo unitário')}</td>
          <td class="row-total" data-total="${r.id}"></td>
        </tr>`).join('')}</tbody>
      </table></div>
    </details>`;
  }).join('') || '<p>Nenhum serviço encontrado.</p>';
  update();
}

function scenario() {
  const values = rows.map((row, i) => roundCurrency(cost(row, state[i])));
  // Sum cents so the cards, chart, rows and exported total always agree.
  const total = values.reduce((sum, value) => sum + Math.round(value * 100), 0) / 100;
  return { values, total };
}

function update() {
  const { values, total } = scenario();
  const delta = roundCurrency(total - reference);
  document.querySelector('#total').textContent = currency(total);
  document.querySelector('#annual').textContent = currency(total * 12) + ' / ano';
  document.querySelector('#delta').textContent = signedCurrency(delta);
  document.querySelector('#percent').textContent = number(delta / reference * 100) + '% em relação à referência';
  document.querySelector('#beds').textContent = number(rows.reduce((sum, row) => sum + (row.kind === 'bed' && state[row.id].enabled ? state[row.id].qty : 0), 0));
  document.querySelector('#reference').textContent = currency(reference);
  const totals = groups.map(group => ({
    group,
    total: rows.filter(row => row.group === group).reduce((sum, row) => sum + Math.round(values[row.id] * 100), 0) / 100,
  }));
  const max = Math.max(...totals.map(t => t.total), 1);
  document.querySelector('#chart').innerHTML = totals.map(t => `<div class="chart-row">
    <div><span>${t.group}</span><strong>${currency(t.total)}</strong></div>
    <div class="track"><div style="width:${t.total / max * 100}%"></div></div>
  </div>`).join('');
  document.querySelectorAll('[data-total]').forEach(el => el.textContent = currency(values[+el.dataset.total]));
  document.querySelectorAll('[data-group]').forEach(el => el.textContent = currency(totals.find(t => t.group === el.dataset.group).total));
  try { localStorage.setItem('novo-hugo-v1', JSON.stringify(state)); } catch {}
}

const tableContainer = document.querySelector('#tables');
tableContainer.addEventListener('input', event => {
  const el = event.target;
  if (!el.dataset.key) return;
  const id = +el.dataset.id, key = el.dataset.key;
  if (key === 'enabled') {
    state[id].enabled = el.checked;
    el.closest('tr').classList.toggle('disabled', !el.checked);
  } else if (key === 'unit') {
    const value = parseCurrency(el.value);
    el.setAttribute('aria-invalid', value === null ? 'true' : 'false');
    if (value === null) return;
    state[id].unit = value;
  } else {
    if (el.value === '' || !el.validity.valid) return;
    state[id][key] = Number(el.value);
  }
  update();
});

tableContainer.addEventListener('focusin', event => {
  const el = event.target;
  if (el.dataset.key !== 'unit') return;
  el.value = state[+el.dataset.id].unit.toLocaleString('pt-BR', {
    useGrouping: false, minimumFractionDigits: 2, maximumFractionDigits: 2,
  });
  el.select();
});
tableContainer.addEventListener('focusout', event => {
  const el = event.target;
  if (el.dataset.key !== 'unit') return;
  el.value = currency(state[+el.dataset.id].unit);
  el.removeAttribute('aria-invalid');
});

document.querySelector('#search').addEventListener('input', tables);
document.querySelector('#reset').addEventListener('click', () => {
  if (confirm('Restaurar todos os valores da planilha? Os ajustes atuais serão descartados.')) {
    state = initial();
    tables();
  }
});
document.querySelectorAll('[data-tab]').forEach(btn => btn.addEventListener('click', () => {
  document.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('active', b === btn));
  document.querySelector('#hugo').hidden = btn.dataset.tab !== 'hugo';
  document.querySelector('#hugol').hidden = btn.dataset.tab !== 'hugol';
}));
document.querySelector('#export').addEventListener('click', () => {
  const { values, total } = scenario();
  const decimal = value => value.toFixed(2).replace('.', ',');
  const csv = [
    ['Grupo', 'Serviço', 'Ativo', 'Quantidade / leitos', 'Ocupação (%) / horas médias', 'Custo unitário (R$)', 'Total mensal (R$)'],
    ...rows.map(r => [r.group, r.name, state[r.id].enabled ? 'Sim' : 'Não', String(state[r.id].qty).replace('.', ','), state[r.id].factor === undefined ? '' : String(state[r.id].factor).replace('.', ','), decimal(state[r.id].unit), decimal(values[r.id])]),
    ['TOTAL', '', '', '', '', '', decimal(total)],
  ].map(row => row.map(value => '"' + String(value).replaceAll('"', '""') + '"').join(';')).join('\r\n');
  const url = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'novo-hugo-cenario.csv';
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

tables();
