import { model as hugolModel } from './hugol-model.js';
import { currency, signedCurrency, number, parseCurrency, escapeHtml as h } from './format.js';
import { icon } from './icons.js';
import { occupancyControl, syncOccupancyControls, bindOccupancyControls } from './occupancy.js';

export function initHugol(options = {}) {
  return initIncrementScenario({ model: hugolModel, panelId: 'hugol', prefix: 'hugol', basisName: 'HUGOL', storageKey: 'novo-hugo-hugol-v1', ...options });
}

export function initIncrementScenario({ model, panelId, prefix, basisName, storageKey, onChange, defaultPreset = 'new-0', includeOmittedWard = false, storageVersion = 1, migrateSavedConfig = value => value, exportFileName = 'novo-hugo-base-' + basisName.toLowerCase() + '.csv' }) {
  const { increments, presets, presetState, setIncrement, setHemodynamicsVolume, snapshot: hugolSnapshot, volume: hugolVolume, workbookAudit } = model;
  const root = document.getElementById(panelId);
  const $ = selector => root.querySelector(selector.replaceAll('#hugol-', '#' + prefix + '-'));
  const policy = { includeOmittedWard };
  const normalize = value => value.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  let config = presetState(defaultPreset), snapshot;
  const openGroups = new Map([['Enfermarias', true], ['UTI', true]]);
  try {
    const saved = migrateSavedConfig(JSON.parse(localStorage.getItem(storageKey)));
    if (saved) {
      const restored = model.normalizeConfig({ base: saved.base, selected: saved.selected, edits: saved.edits && typeof saved.edits === 'object' && !Array.isArray(saved.edits) ? saved.edits : {} });
      hugolSnapshot(restored, policy); config = restored;
    }
  } catch {}
  const hasIncrements = increments.length > 0;
  if (hasIncrements) {
    $('#hugol-preset').innerHTML = presets.map(item => `<option value="${item.id}">${h(item.name)}</option>`).join('') + '<option value="custom" disabled>Combinação personalizada</option>';
    const incrementIcons = { blood:'lab', mri:'activity', sad:'people', hemodynamics:'hospital', wardBeds:'bed', icuBeds:'activity' };
    $('#hugol-increments').innerHTML = increments.map(item => `<article class="increment-card"><label class="increment-card-choice"><input type="checkbox" data-increment="${item.id}"><span class="increment-card-body"><span class="increment-card-heading"><span class="increment-icon">${icon(incrementIcons[item.id])}</span><strong>${h(item.name)}</strong></span><span class="increment-description" data-increment-description="${item.id}">${h(item.description)}</span><span class="increment-amount" data-increment-amount="${item.id}">+ ${currency(item.amountCents / 100)}</span><small data-increment-caption="${item.id}">${item.addedBeds ? 'Acréscimo mensal desta opção isolada' : 'Referência mensal da planilha'}</small>${item.addedBeds ? `<small class="increment-breakdown">Leitos: ${currency(item.bedAmountCents / 100)}<br>SADT: ${currency(item.sadtAmountCents / 100)}</small>` : ''}</span></label>${item.id === 'hemodynamics' ? `<label class="increment-volume" for="${prefix}-hemodynamics-volume"><span>Procedimentos por mês</span><select id="${prefix}-hemodynamics-volume" aria-label="Procedimentos de hemodinâmica por mês na base ${basisName}"><option value="250">250 procedimentos</option><option value="450">450 procedimentos</option></select></label>` : ''}</article>`).join('');
  }
  $('#hugol-audit').innerHTML = workbookAudit(policy).map(item => `<tr><th scope="row">${h(item.name)}</th><td data-label="Planilha">${currency(item.sourceTotalCents / 100)}</td><td data-label="Dashboard">${currency(item.dashboardTotal)}</td><td data-label="Conferência" class="audit-result">${item.difference === 0 ? 'Conferido' : signedCurrency(item.difference)}</td></tr>`).join('');

  function field(row, key, label) {
    const state = snapshot.state[row.id];
    const common = `data-h-id="${row.id}" data-h-key="${key}" aria-label="${h(label + ' — ' + row.name)}" ${state.enabled && row.available ? '' : 'disabled'}`;
    if (key === 'unit') return `<input ${common} class="money-input" type="text" inputmode="decimal" value="${currency(state.unit)}">`;
    const occupancy = key === 'factor' && row.kind === 'bed';
    return `<input ${common} type="number" min="0" step="${key === 'qty' ? 1 : occupancy ? 0.5 : 0.01}" value="${state[key]}">`;
  }
  function renderTables() {
    const search = normalize($('#hugol-search').value.trim());
    const rows = snapshot.rows.filter(row => !search || normalize(row.name + ' ' + row.group).includes(search));
    $('#hugol-tables').innerHTML = [...new Set(rows.map(row => row.group))].map(group => {
      const groupRows = rows.filter(row => row.group === group), kind = groupRows[0].kind, withFactor = kind !== 'service';
      const quantity = kind === 'bed' ? 'Leitos' : kind === 'surgery' ? 'Nº de cirurgias' : 'Quantidade', factor = kind === 'bed' ? 'Ocupação' : 'Horas médias';
      return `<details data-h-category="${h(group)}" ${search || openGroups.get(group) ? 'open' : ''}><summary><span class="category-icon">${icon(kind === 'bed' ? 'bed' : kind === 'surgery' ? 'scissors' : 'document')}</span><span class="category-label"><strong>${h(group)}</strong><small>${groupRows.length} serviços</small></span><span class="category-cost" data-h-group="${h(group)}"></span><span class="category-chevron">${icon('chevron')}</span></summary>${kind === 'bed' ? occupancyControl(group) : ''}<div class="table-scroll" tabindex="0" role="region" aria-label="${h('Serviços da base ' + basisName + ': ' + group)}"><table class="${withFactor ? 'with-factor' : 'without-factor'}"><thead><tr><th>Ativo / serviço</th><th>${quantity}</th>${withFactor ? `<th>${factor}</th>` : ''}<th>Custo unitário</th><th>Total mensal</th><th><span class="sr-only">Restaurar serviço</span></th></tr></thead><tbody>${groupRows.map(row => {
        const state = snapshot.state[row.id], excluded = !includeOmittedWard && !row.countedInWorkbook;
        return `<tr data-h-row="${row.id}"><td><div class="service-cell"><label class="service-name"><input type="checkbox" class="service-switch" data-h-id="${row.id}" data-h-key="enabled" aria-label="${h('Incluir ' + row.name + ' na base ' + basisName)}" ${state.enabled ? 'checked' : ''} ${row.available ? '' : 'disabled'}><span>${h(row.name)}<small data-h-volume="${row.id}"></small>${excluded ? '<small class="excluded-label">Fora do subtotal da planilha</small>' : ''}</span></label><span class="row-badge" data-h-badge="${row.id}"></span></div></td><td data-label="${quantity}">${field(row, 'qty', quantity)}</td>${withFactor ? `<td data-label="${factor}"><span class="factor-field">${field(row, 'factor', factor)}<span>${kind === 'bed' ? '%' : 'h'}</span></span></td>` : ''}<td data-label="Custo unitário"><span class="unit-value">${field(row, 'unit', 'Custo unitário')}<small class="unit-source" data-h-unit-reference title="${h('Valor de origem: ' + currency(row.unit) + (row.sourceUnitCell ? ' · ' + row.sourceUnitCell : ''))}"></small></span></td><td class="row-total" data-label="${excluded ? 'Valor fora do subtotal' : 'Total mensal'}" data-h-total="${row.id}"></td><td class="row-actions"><button type="button" class="icon-button row-reset" data-h-restore="${row.id}" aria-label="${h('Restaurar ' + row.name + ' na base ' + basisName)}" title="Restaurar valores deste serviço">${icon('reset')}</button></td></tr>`;
      }).join('')}</tbody></table></div></details>`;
    }).join('') || '<div class="no-results"><h3>Nenhum serviço encontrado</h3><p>Tente outro termo de busca.</p></div>';
  }
  function refresh(rebuild = true) {
    snapshot = hugolSnapshot(config, policy);
    $('#hugol-total').textContent = currency(snapshot.total);
    $('#hugol-annual').textContent = currency(snapshot.total * 12) + ' / ano';
    $('#hugol-delta').textContent = signedCurrency(snapshot.delta);
    $('#hugol-delta-card').dataset.direction = snapshot.delta > 0 ? 'increase' : snapshot.delta < 0 ? 'decrease' : 'neutral';
    $('#hugol-delta-caption').textContent = snapshot.referenceCaption;
    $('#hugol-ward-beds').textContent = number(snapshot.beds.ward);
    $('#hugol-icu-beds').textContent = number(snapshot.beds.icu);
    $('#hugol-beds').textContent = number(snapshot.beds.total);
    $('#hugol-base-total').textContent = currency(snapshot.baseTotal);
    $('#hugol-base-name').textContent = snapshot.referenceName;
    if (hasIncrements) {
      $('#hugol-preset').value = snapshot.modifiedIds.length ? 'custom' : snapshot.preset?.id || 'custom';
      $('#hugol-increment-fieldset').disabled = config.base !== 'new';
      $('#hugol-base-instruction').hidden = config.base === 'new';
      $('#hugol-select-all').disabled = config.base !== 'new' || config.selected.length === increments.length;
      $('#hugol-clear-increments').disabled = config.selected.length === 0;
      for (const checkbox of root.querySelectorAll('[data-increment]')) checkbox.checked = config.selected.includes(checkbox.dataset.increment);
      const hemodynamics = snapshot.rows.find(row => row.group === 'Hemodinâmica');
      const volumeSelect = $('#hugol-hemodynamics-volume');
      volumeSelect.disabled = !hemodynamics || !snapshot.state[hemodynamics.id].enabled;
      if (hemodynamics) {
        const state = snapshot.state[hemodynamics.id], quantity = state.qty || 250;
        volumeSelect.innerHTML = [250, 450, ...([250, 450].includes(quantity) ? [] : [quantity])].map(value => `<option value="${value}">${number(value)} procedimentos</option>`).join('');
        volumeSelect.value = String(quantity);
        $('[data-increment-description="hemodynamics"]').textContent = `${number(quantity)} procedimentos por mês.`;
        $('[data-increment-amount="hemodynamics"]').textContent = '+ ' + currency(quantity * state.unit);
        $('[data-increment-caption="hemodynamics"]').textContent = `${number(quantity)} × ${currency(state.unit)} por procedimento`;
      } else {
        volumeSelect.innerHTML = '<option value="250">250 procedimentos</option><option value="450">450 procedimentos</option>';
        const reference = increments.find(item => item.id === 'hemodynamics');
        $('[data-increment-description="hemodynamics"]').textContent = reference.description;
        $('[data-increment-amount="hemodynamics"]').textContent = '+ ' + currency(reference.amountCents / 100);
        $('[data-increment-caption="hemodynamics"]').textContent = 'Referência mensal da planilha';
      }
      $('#hugol-selection-summary').textContent = `${config.selected.length} de ${increments.length} incrementos selecionados${snapshot.modifiedIds.length ? ` · ${snapshot.modifiedIds.length} ${snapshot.modifiedIds.length === 1 ? 'serviço ajustado manualmente' : 'serviços ajustados manualmente'}` : ''}`;
    }
    $('#hugol-change-count').textContent = `${snapshot.rows.filter(row => snapshot.state[row.id].enabled).length} serviços ativos`;
    if (rebuild) renderTables();
    for (const total of root.querySelectorAll('[data-h-group]')) total.textContent = currency(snapshot.totals.find(item => item.group === total.dataset.hGroup).total);
    for (const element of root.querySelectorAll('[data-h-row]')) {
      const row = snapshot.rows.find(item => item.id === element.dataset.hRow), state = snapshot.state[row.id], modified = snapshot.modifiedIds.includes(row.id);
      element.classList.toggle('disabled', !state.enabled); element.classList.toggle('modified', modified && state.enabled);
      element.querySelector('[data-h-total]').textContent = currency(snapshot.rawValues[row.id]);
      element.querySelector('[data-h-volume]').textContent = !row.available ? 'Selecione o incremento para incluir este serviço' : row.kind === 'bed' ? `Paciente-dia projetado: ${number(hugolVolume(row, state))}${row.volumeRounding === 'up' ? ' · arredondado para cima' : ''}` : row.kind === 'surgery' ? `${number(hugolVolume(row, state))} horas cirúrgicas` : row.criterion;
      const badge = element.querySelector('[data-h-badge]'); badge.hidden = !modified; badge.textContent = state.enabled ? 'Alterado' : 'Retirado';
      element.querySelector('[data-h-restore]').disabled = !modified;
      element.querySelector('[data-h-unit-reference]').textContent = `${state.unit === row.unit ? 'Referência: ' : 'Preço editado · ref. '}${row.unitBasis || 'Base R$ ' + basisName}`;
      for (const field of element.querySelectorAll('input:not([type=checkbox])')) field.disabled = !state.enabled || !row.available;
    }
    syncOccupancyControls($('#hugol-tables'), snapshot.rows, snapshot.state);
    try { localStorage.setItem(storageKey, JSON.stringify({ ...config, version: storageVersion })); $('#hugol-save-status').textContent = 'Salvo neste navegador'; }
    catch { $('#hugol-save-status').textContent = 'Salvamento automático indisponível'; }
    onChange?.(snapshot);
  }
  if (hasIncrements) {
    $('#hugol-increments').addEventListener('change', event => { if (event.target.dataset.increment) { config = setIncrement(config, event.target.dataset.increment, event.target.checked); refresh(); } });
    $('#hugol-hemodynamics-volume').addEventListener('change', event => { config = setHemodynamicsVolume(config, Number(event.target.value)); refresh(); });
    $('#hugol-preset').addEventListener('change', event => { config = presetState(event.target.value); refresh(); });
    $('#hugol-select-all').addEventListener('click', () => { for (const item of increments) config = setIncrement(config, item.id, true); refresh(); });
    $('#hugol-clear-increments').addEventListener('click', () => { for (const item of increments) config = setIncrement(config, item.id, false); refresh(); });
  }
  $('#hugol-reset').addEventListener('click', () => { config = presetState(defaultPreset); $('#hugol-search').value = ''; refresh(); });
  $('#hugol-search').addEventListener('input', () => refresh());
  const tables = $('#hugol-tables');
  bindOccupancyControls(tables, () => snapshot, changes => {
    for (const [id, patch] of Object.entries(changes)) config.edits[id] = { ...config.edits[id], ...patch };
    refresh();
  });
  tables.addEventListener('toggle', event => { if (event.target.dataset.hCategory) openGroups.set(event.target.dataset.hCategory, event.target.open); }, true);
  tables.addEventListener('input', event => {
    const field = event.target, id = field.dataset.hId, key = field.dataset.hKey; if (!id || !key) return;
    const value = key === 'enabled' ? field.checked : key === 'unit' ? parseCurrency(field.value) : field.value !== '' && field.validity.valid ? Number(field.value) : null;
    field.setAttribute('aria-invalid', value === null ? 'true' : 'false'); if (value === null) return;
    config.edits[id] = { ...config.edits[id], [key]: value }; refresh(false);
  });
  tables.addEventListener('focusin', event => {
    const field = event.target; if (field.dataset.hKey !== 'unit') return;
    field.value = snapshot.state[field.dataset.hId].unit.toLocaleString('pt-BR', { useGrouping: false, minimumFractionDigits: 2, maximumFractionDigits: 2 }); field.select();
  });
  tables.addEventListener('focusout', event => {
    const field = event.target, key = field.dataset.hKey; if (!key || key === 'enabled') return;
    const state = snapshot.state[field.dataset.hId]; field.value = key === 'unit' ? currency(state.unit) : state[key]; field.removeAttribute('aria-invalid');
  });
  tables.addEventListener('click', event => { const button = event.target.closest('[data-h-restore]'); if (button) { delete config.edits[button.dataset.hRestore]; refresh(); } });
  $('#hugol-export').addEventListener('click', () => {
    const decimal = value => value.toFixed(2).replace('.', ',');
    const lines = [['Categoria','Serviço','Ativo','Quantidade / leitos','Ocupação (%) / horas médias','Custo unitário (R$)','Referência do custo','Custo da linha (R$)','Custeio considerado (R$)'], ...snapshot.rows.map(row => [row.group, row.name, snapshot.state[row.id].enabled ? 'Sim' : 'Não', snapshot.state[row.id].qty, row.factor === undefined ? '' : String(snapshot.state[row.id].factor).replace('.', ','), decimal(snapshot.state[row.id].unit), `${row.unitBasis || 'Base R$ ' + basisName}${snapshot.state[row.id].unit === row.unit ? '' : ' (preço editado)'}`, decimal(snapshot.rawValues[row.id]), decimal(snapshot.values[row.id])]), ['TOTAL','','','','','','','',decimal(snapshot.total)]];
    const csv = lines.map(row => row.map(value => '"' + String(value).replaceAll('"','""') + '"').join(';')).join('\r\n');
    const url = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = exportFileName; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  refresh();
}
