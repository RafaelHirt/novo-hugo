import { rows, reference, cost, initial, bedTotals, projectedPatientDays, DAYS_PER_MONTH } from './data.js';
import { currency, signedCurrency, number, parseCurrency, roundCurrency } from './format.js';
import { icon } from './icons.js';
import { renderComparison, setHugolComparison, setHugoComparison, setProductionComparison, setRebalanceComparison } from './comparison.js';
import { initHugol, initIncrementScenario } from './hugol-ui.js';
import { model as hugoIncrementModel } from './hugo-model.js';
import { model as updatedModel, migrateSavedConfig as migrateUpdatedConfig } from './updated-model.js';
import { blockControls, syncBlockControls, bindBlockControls, validOccupancy, updateOccupancyComparison } from './occupancy.js';
import { model as productionModel, migrateSavedConfig as migrateProductionConfig } from './production-model.js';
import { model as rebalanceModel } from './rebalance-model.js';

const $ = selector => document.querySelector(selector);
const normalize = value => value.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const defaults = initial();
let state = initial();
try {
  const saved = JSON.parse(localStorage.getItem('novo-hugo-v1'));
  if (Array.isArray(saved) && saved.length === rows.length) {
    state = saved.map((candidate, i) => {
      const s = candidate || {};
      return {
        enabled: typeof s.enabled === 'boolean' ? s.enabled : true,
        qty: Number.isFinite(s.qty) && s.qty >= 0 ? s.qty : rows[i].qty,
        unit: Number.isFinite(s.unit) && s.unit >= 0 ? s.unit : rows[i].unit,
        factor: rows[i].factor === undefined ? undefined
          : Number.isFinite(s.factor) && s.factor >= 0 && (rows[i].kind !== 'bed' || validOccupancy(s.factor))
            ? s.factor : rows[i].factor,
      };
    });
  }
} catch {}

const groups = [...new Set(rows.map(row => row.group))];
const groupIcons = ['bed', 'activity', 'hospital', 'calendar', 'people', 'scissors', 'lab', 'external', 'document'];
const colors = ['#007d76', '#35558b', '#519b86', '#92bdb4', '#637f9b', '#b99744', '#4c92a0', '#859bb2', '#aacbc2'];
const openGroups = new Map(groups.map((group, i) => [group, i < 2]));

for (const element of document.querySelectorAll('[data-icon]')) {
  element.innerHTML = icon(element.dataset.icon);
}
for (const group of groups) {
  const option = document.createElement('option');
  option.value = group;
  option.textContent = group;
  $('#group-filter').append(option);
}

const changed = id => ['enabled', 'qty', 'unit', 'factor'].some(key => state[id][key] !== defaults[id][key]);
function field(row, key, label) {
  const disabled = state[row.id].enabled ? '' : 'disabled';
  const common = `aria-label="${label} — ${row.name}" data-id="${row.id}" data-key="${key}" ${disabled}`;
  if (key === 'unit') {
    return `<input ${common} class="money-input" type="text" inputmode="decimal" value="${currency(state[row.id][key])}">`;
  }
  const occupancy = key === 'factor' && row.kind === 'bed';
  const step = key === 'qty' ? 1 : occupancy ? 0.5 : 0.01;
  return `<input ${common} type="number" min="0" step="${step}" value="${state[row.id][key]}">`;
}

function tables() {
  const query = normalize($('#search').value.trim());
  const category = $('#group-filter').value;
  const onlyChanged = $('#changed-only').checked;
  const filteredRows = rows.filter(row => (!category || row.group === category)
    && (!query || normalize(row.name + ' ' + row.group).includes(query))
    && (!onlyChanged || changed(row.id)));
  const visibleGroups = groups.filter(group => filteredRows.some(row => row.group === group));
  const filtered = Boolean(query || category || onlyChanged);
  $('#clear-search').hidden = !$('#search').value;
  $('#service-count').textContent = `${filteredRows.length}${filtered ? ` de ${rows.length}` : ''} serviços · ${visibleGroups.length} ${visibleGroups.length === 1 ? 'categoria' : 'categorias'}`;
  $('#tables').innerHTML = visibleGroups.map(group => {
    const groupRows = filteredRows.filter(row => row.group === group);
    const originalCount = rows.filter(row => row.group === group).length;
    const kind = groupRows[0].kind;
    const withFactor = kind === 'bed' || kind === 'surgery';
    const qtyLabel = kind === 'bed' ? 'Leitos' : kind === 'surgery' ? 'Nº de cirurgias' : 'Quantidade';
    const factorLabel = kind === 'bed' ? 'Ocupação' : 'Horas médias';
    const count = groupRows.length === originalCount ? `${originalCount} ${originalCount === 1 ? 'serviço' : 'serviços'}` : `${groupRows.length} de ${originalCount} serviços`;
    return `<details data-category="${group}" ${filtered || openGroups.get(group) ? 'open' : ''}>
      <summary>
        <span class="category-icon">${icon(groupIcons[groups.indexOf(group)])}</span>
        <span class="category-label"><strong>${group}</strong><small>${count}</small></span>
        <span class="category-cost" data-group="${group}" title="Custo total da categoria"></span>
        <span class="category-chevron">${icon('chevron')}</span>
      </summary>
      ${blockControls(group, kind === 'bed')}
      <div class="table-scroll" tabindex="0" role="region" aria-label="Serviços de ${group}">
        <table class="${withFactor ? 'with-factor' : 'without-factor'}">
          <thead><tr><th scope="col">Ativo / serviço</th><th scope="col">${qtyLabel}</th>${withFactor ? `<th scope="col">${factorLabel}</th>` : ''}<th scope="col">${kind === 'surgery' ? 'Custo / hora' : 'Custo unitário'}</th><th scope="col">Total mensal</th></tr></thead>
          <tbody>${groupRows.map(row => `<tr data-row="${row.id}">
            <td><div class="service-cell"><label class="service-name">
              <input class="service-switch" type="checkbox" aria-label="Incluir ${row.name}" data-id="${row.id}" data-key="enabled" ${state[row.id].enabled ? 'checked' : ''}>
              <span>${row.name}<small>${row.kind === 'bed' ? `<span data-patient-days="${row.id}"></span> · ${number(DAYS_PER_MONTH)} dias/mês` : row.kind === 'surgery' ? 'Hora cirúrgica' : row.group === 'Escritório de gestão de altas' ? 'Nº de leitos' : 'Produção mensal'}</small></span>
            </label><span class="row-badge" data-badge="${row.id}"></span></div></td>
            <td data-label="${qtyLabel}">${field(row, 'qty', qtyLabel)}</td>
            ${withFactor ? `<td data-label="${factorLabel}"><span class="factor-field">${field(row, 'factor', row.kind === 'bed' ? 'Ocupação (%)' : factorLabel)}<span>${row.kind === 'bed' ? '%' : 'h'}</span></span>${row.kind === 'bed' ? '<span class="occupancy-change" data-occupancy-change hidden></span>' : ''}</td>` : ''}
            <td data-label="${kind === 'surgery' ? 'Custo / hora' : 'Custo unitário'}"><span class="unit-value">${field(row, 'unit', 'Custo unitário')}<small class="unit-source" data-unit-reference="${row.id}">Referência contratual</small></span></td>
            <td class="row-total" data-label="Total mensal" data-total="${row.id}"></td>
          </tr>`).join('')}</tbody>
        </table>
      </div>
    </details>`;
  }).join('') || `<div class="no-results">${icon('search')}<h3>${onlyChanged && !query && !category ? 'Nenhum serviço alterado' : 'Nenhum serviço encontrado'}</h3><p>${onlyChanged && !query && !category ? 'Os serviços estão com os valores de referência.' : 'Tente outro termo ou remova os filtros.'}</p><button class="button secondary" id="clear-filters">Mostrar todos os serviços</button></div>`;
  update();
}

function scenario() {
  const values = rows.map((row, i) => roundCurrency(cost(row, state[i])));
  const total = values.reduce((sum, value) => sum + Math.round(value * 100), 0) / 100;
  return { values, total };
}

function update() {
  const { values, total } = scenario();
  const delta = roundCurrency(total - reference);
  $('#total').textContent = currency(total);
  $('#annual').textContent = currency(total * 12) + ' / ano';
  $('#delta').textContent = signedCurrency(delta);
  $('#percent').textContent = number(delta / reference * 100) + '% em relação à referência';
  $('.metric-delta').dataset.direction = delta > 0 ? 'increase' : delta < 0 ? 'decrease' : 'neutral';
  const beds = bedTotals(state);
  $('#ward-beds').textContent = number(beds.ward);
  $('#icu-beds').textContent = number(beds.icu);
  $('#beds').textContent = number(beds.total);
  $('#reference').textContent = currency(reference);
  const modifiedCount = rows.filter(row => changed(row.id)).length;
  const activeCount = state.filter(row => row.enabled).length;
  $('#change-count').textContent = `${activeCount} serviços ativos${modifiedCount ? ` · ${modifiedCount} ${modifiedCount === 1 ? 'alterado' : 'alterados'}` : ' · Sem alterações'}`;
  $('#reset').disabled = modifiedCount === 0;

  const totals = groups.map((group, index) => ({ group, index,
    total: rows.filter(row => row.group === group).reduce((sum, row) => sum + Math.round(values[row.id] * 100), 0) / 100,
  }));
  const max = Math.max(...totals.map(item => item.total), 1);
  renderComparison({ rows, state, values, total, totals, beds });
  $('#chart').innerHTML = [...totals].sort((a, b) => b.total - a.total).map(item => `<button class="chart-row" data-chart-group="${item.group}" aria-label="Ver serviços de ${item.group}, ${currency(item.total)}">
    <span class="chart-label"><span class="chart-dot" style="background:${colors[item.index]}"></span>${item.group}</span>
    <span class="track"><span style="width:${item.total / max * 100}%;background:${colors[item.index]}"></span></span>
    <strong>${currency(item.total)}</strong><span class="chart-percent">${number(total ? item.total / total * 100 : 0)}%</span>
    ${icon('chevron')}
  </button>`).join('');
  document.querySelectorAll('[data-group]').forEach(el => el.textContent = currency(totals.find(item => item.group === el.dataset.group).total));
  document.querySelectorAll('[data-row]').forEach(el => {
    const id = +el.dataset.row, isChanged = changed(id), enabled = state[id].enabled;
    el.classList.toggle('disabled', !enabled);
    el.classList.toggle('modified', isChanged && enabled);
    el.querySelector('[data-total]').textContent = currency(values[id]);
    const patientDays = el.querySelector('[data-patient-days]');
    if (patientDays) patientDays.textContent = `Paciente-dia projetado: ${number(projectedPatientDays(rows[id], state[id]))}`;
    const badge = el.querySelector('[data-badge]');
    badge.textContent = enabled ? 'Alterado' : 'Retirado';
    badge.hidden = !isChanged;
    el.querySelectorAll('input:not([type=checkbox])').forEach(input => input.disabled = !enabled);
    const reference = el.querySelector('[data-unit-reference]');
    reference.textContent = state[id].unit === rows[id].unit ? 'Valor contratual' : 'Editado · valor contratual';
    reference.dataset.edited = String(state[id].unit !== rows[id].unit);
    if (rows[id].kind === 'bed') updateOccupancyComparison(el.querySelector('[data-occupancy-change]'), rows[id].factor, state[id].factor);
  });
  syncBlockControls($('#tables'), rows, state, rows.filter(row => changed(row.id)).map(row => row.id));
  try {
    localStorage.setItem('novo-hugo-v1', JSON.stringify(state));
    $('#save-status').innerHTML = `${icon('check')}Salvo neste navegador`;
  } catch {
    $('#save-status').textContent = 'Salvamento automático indisponível';
  }
}

function clearFilters() {
  $('#search').value = '';
  $('#group-filter').value = '';
  $('#changed-only').checked = false;
  tables();
}
const tableContainer = $('#tables');
bindBlockControls(tableContainer, () => ({ rows, state }), changes => {
  for (const [id, patch] of Object.entries(changes)) Object.assign(state[id], patch);
  tables();
}, group => {
  for (const row of rows) if (row.group === group) state[row.id] = { ...defaults[row.id] };
  tables();
});
tableContainer.addEventListener('toggle', event => {
  if (event.target.tagName === 'DETAILS') openGroups.set(event.target.dataset.category, event.target.open);
}, true);
tableContainer.addEventListener('input', event => {
  const el = event.target;
  if (!el.dataset.key) return;
  const id = +el.dataset.id, key = el.dataset.key;
  if (key === 'enabled') {
    state[id].enabled = el.checked;
  } else if (key === 'unit') {
    const value = parseCurrency(el.value);
    el.setAttribute('aria-invalid', value === null ? 'true' : 'false');
    if (value === null) return;
    state[id].unit = value;
  } else {
    const valid = el.value !== '' && el.validity.valid;
    el.setAttribute('aria-invalid', valid ? 'false' : 'true');
    if (!valid) return;
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
  const key = el.dataset.key;
  if (!key || key === 'enabled') return;
  el.value = key === 'unit' ? currency(state[+el.dataset.id].unit) : state[+el.dataset.id][key];
  el.removeAttribute('aria-invalid');
  if ($('#changed-only').checked && !changed(+el.dataset.id)) tables();
});
tableContainer.addEventListener('click', event => {
  if (event.target.closest('#clear-filters')) clearFilters();
});
$('#search').addEventListener('input', tables);
$('#group-filter').addEventListener('change', tables);
$('#changed-only').addEventListener('change', tables);
$('#clear-search').addEventListener('click', () => {
  $('#search').value = '';
  tables();
  $('#search').focus();
});
for (const [selector, open] of [['#expand-all', true], ['#collapse-all', false]]) {
  $(selector).addEventListener('click', () => {
    groups.forEach(group => openGroups.set(group, open));
    tableContainer.querySelectorAll('details').forEach(details => details.open = open);
  });
}

const resetDialog = $('#reset-dialog');
$('#reset').addEventListener('click', () => resetDialog.showModal());
$('#confirm-reset').addEventListener('click', () => {
  state = initial();
  clearFilters();
  resetDialog.close();
  $('#search').focus({ preventScroll: true });
});
resetDialog.addEventListener('click', event => {
  if (event.target === resetDialog) resetDialog.close();
});

function refreshSummaryVisibility() {
  let height = 0;
  for (const dock of document.querySelectorAll('[data-summary-panel]')) {
    const panel = dock.dataset.summaryPanel;
    const visible = !$('#' + panel).hidden;
    const sentinel = document.querySelector(`[data-summary-sentinel="${panel}"]`);
    dock.classList.toggle('is-stuck', visible && sentinel.getBoundingClientRect().top < 8);
    if (visible) height = Math.ceil(dock.getBoundingClientRect().height);
  }
  document.documentElement.style.setProperty('--summary-height', height + 'px');
}
const summaryObserver = new IntersectionObserver(refreshSummaryVisibility, { rootMargin: '-8px 0px 0px 0px' });
for (const sentinel of document.querySelectorAll('[data-summary-sentinel]')) summaryObserver.observe(sentinel);
addEventListener('resize', refreshSummaryVisibility);
const summaryResizeObserver = new ResizeObserver(refreshSummaryVisibility);
for (const dock of document.querySelectorAll('[data-summary-panel]')) summaryResizeObserver.observe(dock);
const scrollTo = element => element.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });

function updateConnectionStatus() {
  const online = navigator.onLine;
  $('#connection-status').dataset.online = String(online);
  $('#connection-label').textContent = online ? 'Online' : 'Sem conexão';
}
addEventListener('online', updateConnectionStatus);
addEventListener('offline', updateConnectionStatus);
addEventListener('pageshow', event => { if (event.persisted) location.reload(); });
updateConnectionStatus();

const tabButtons = [...document.querySelectorAll('[data-tab]:not([hidden])')];
function selectTab(button, persist = true) {
  for (const tab of tabButtons) {
    const selected = tab === button;
    tab.classList.toggle('active', selected);
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
    $('#' + tab.dataset.tab).hidden = !selected;
  }
  $('#scenario-picker').value = button.dataset.tab;
  const services = $('#' + button.dataset.tab).querySelector('.services');
  if (services && !services.id) services.id = button.dataset.tab + '-services';
  $('.skip-link').href = '#' + (services?.id || button.dataset.tab);
  $('.skip-link').textContent = services ? 'Ir para os serviços' : 'Ir para o comparativo';
  if (persist) history.replaceState(null, '', '#' + button.dataset.tab);
  refreshSummaryVisibility();
}
$('#scenario-picker').addEventListener('change', event => {
  const button = tabButtons.find(item => item.dataset.tab === event.target.value);
  if (button) selectTab(button);
});
addEventListener('hashchange', () => {
  if (location.hash === '#hugo-updated') { selectTab(tabButtons.find(item => item.dataset.tab === 'hugo-production')); return; }
  const button = tabButtons.find(item => '#' + item.dataset.tab === location.hash);
  if (button) selectTab(button, false);
});
for (const button of tabButtons) {
  button.addEventListener('click', () => selectTab(button));
  button.addEventListener('keydown', event => {
    const index = tabButtons.indexOf(button);
    let next;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') next = (index + (event.key === 'ArrowRight' ? 1 : -1) + tabButtons.length) % tabButtons.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabButtons.length - 1;
    if (next === undefined) return;
    event.preventDefault();
    selectTab(tabButtons[next]);
    tabButtons[next].focus();
  });
}
$('#chart').addEventListener('click', event => {
  const row = event.target.closest('[data-chart-group]');
  if (!row) return;
  $('#group-filter').value = row.dataset.chartGroup;
  $('#search').value = '';
  $('#changed-only').checked = false;
  tables();
  scrollTo($('#services'));
});

$('#export').addEventListener('click', () => {
  const { values, total } = scenario();
  const decimal = value => value.toFixed(2).replace('.', ',');
  const csv = [
    ['Grupo', 'Serviço', 'Ativo', 'Quantidade / leitos', 'Ocupação (%) / horas médias', 'Custo unitário (R$)', 'Total mensal (R$)'],
    ...rows.map(row => [row.group, row.name, state[row.id].enabled ? 'Sim' : 'Não', String(state[row.id].qty).replace('.', ','), state[row.id].factor === undefined ? '' : String(state[row.id].factor).replace('.', ','), decimal(state[row.id].unit), decimal(values[row.id])]),
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
initHugol({ onChange: setHugolComparison });
initIncrementScenario({ model: hugoIncrementModel, panelId: 'hugo-increment', prefix: 'hugo-base', basisName: 'HUGO', storageKey: 'novo-hugo-hugo-v1', onChange: setHugoComparison });
initIncrementScenario({ model: updatedModel, panelId: 'hugo-updated', prefix: 'updated', basisName: 'HUGO atualizado', storageKey: 'novo-hugo-updated-v1', defaultPreset: 'same', storageVersion: 2, migrateSavedConfig: migrateUpdatedConfig, exportFileName: 'novo-hugo-atualizacao-valores.csv' });
initIncrementScenario({ model: productionModel, panelId: 'hugo-production', prefix: 'production', basisName: 'HUGO · valores e produção', storageKey: 'novo-hugo-production-v1', defaultPreset: 'production', storageVersion: 3, migrateSavedConfig: migrateProductionConfig, exportFileName: 'novo-hugo-atualizacao-valores-producao.csv', onChange: setProductionComparison });
initIncrementScenario({ model: rebalanceModel, panelId: 'hugo-rebalance', prefix: 'rebalance', basisName: 'Reequilíbrio Jan/25 - Dez/25', storageKey: 'novo-hugo-rebalance-v1', defaultPreset: 'rebalance', exportFileName: 'novo-hugo-reequilibrio-jan25-dez25.csv', onChange: setRebalanceComparison });
selectTab(tabButtons.find(button => '#' + button.dataset.tab === location.hash) || (location.hash === '#hugo-updated' ? tabButtons.find(button => button.dataset.tab === 'hugo-production') : tabButtons[0]), location.hash === '#hugo-updated');
