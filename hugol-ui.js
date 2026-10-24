import { model as hugolModel } from './hugol-model.js';
import { currency, signedCurrency, number, parseCurrency, describePriceReference, escapeHtml as h } from './format.js';
import { icon } from './icons.js';
import { blockControls, syncBlockControls, bindBlockControls, updateOccupancyComparison } from './occupancy.js';

export function initHugol(options = {}) {
  return initIncrementScenario({ model: hugolModel, panelId: 'hugol', prefix: 'hugol', basisName: 'HUGOL', storageKey: 'novo-hugo-hugol-v1', storageVersion: 2, ...options });
}

export function initIncrementScenario({ model, panelId, prefix, basisName, storageKey, onChange, defaultPreset = 'new-0', includeOmittedWard = false, storageVersion = 1, migrateSavedConfig = value => value, showUnitReferences = true, exportFileName = 'novo-hugo-base-' + basisName.toLowerCase() + '.csv' }) {
  const { increments, presets, presetState, setIncrement, setHemodynamicsVolume, restoreGroup, snapshot: hugolSnapshot, volume: hugolVolume, workbookAudit } = model;
  const root = document.getElementById(panelId);
  const $ = selector => root.querySelector(selector.replaceAll('#hugol-', '#' + prefix + '-'));
  const policy = { includeOmittedWard };
  const normalize = value => value.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const scenarioChoices = [...root.querySelectorAll('[data-scenario-choice]')];
  const drafts = {};
  let config = presetState(defaultPreset), snapshot;
  const openGroups = new Map([['Enfermarias', true], ['UTI', true]]);
  function restoreConfig(candidate) {
    const restored = model.normalizeConfig({ base: candidate.base, selected: candidate.selected, edits: candidate.edits && typeof candidate.edits === 'object' && !Array.isArray(candidate.edits) ? candidate.edits : {} });
    hugolSnapshot(restored, policy); return restored;
  }
  try {
    const saved = migrateSavedConfig(JSON.parse(localStorage.getItem(storageKey)));
    if (saved) {
      if (scenarioChoices.length && saved.drafts && typeof saved.drafts === 'object') {
        for (const [base, candidate] of Object.entries(saved.drafts)) try {
          const restored = restoreConfig(candidate); if (restored.base === base) drafts[base] = restored;
        } catch {}
      }
      config = restoreConfig(saved);
    }
  } catch {}
  const hasIncrements = increments.length > 0;
  const priceInputs = model.priceInputs || [];
  if (hasIncrements) {
    $('#hugol-preset').innerHTML = presets.map(item => `<option value="${item.id}">${h(item.name)}</option>`).join('') + '<option value="custom" disabled>Combinação personalizada</option>';
    const incrementIcons = { blood:'lab', mri:'activity', sad:'people', hemodynamics:'hospital', wardBeds:'bed', icuBeds:'activity' };
    $('#hugol-increments').innerHTML = increments.map(item => `<article class="increment-card"><label class="increment-card-choice"><input type="checkbox" data-increment="${item.id}"><span class="increment-card-body"><span class="increment-card-heading"><span class="increment-icon">${icon(incrementIcons[item.id])}</span><strong>${h(item.name)}</strong></span><span class="increment-description" data-increment-description="${item.id}">${h(item.description)}</span><span class="increment-amount" data-increment-amount="${item.id}">+ ${currency(item.amountCents / 100)}</span><small data-increment-caption="${item.id}">${item.addedBeds ? 'Acréscimo mensal desta opção isolada' : 'Referência mensal da planilha'}</small>${item.addedBeds ? `<small class="increment-breakdown">Leitos: ${currency(item.bedAmountCents / 100)}<br>SADT: ${currency(item.sadtAmountCents / 100)}</small>` : ''}</span></label>${item.id === 'hemodynamics' ? `<label class="increment-volume" for="${prefix}-hemodynamics-volume"><span>Procedimentos por mês</span><select id="${prefix}-hemodynamics-volume" aria-label="Procedimentos de hemodinâmica por mês na base ${basisName}"><option value="250">250 procedimentos</option><option value="450">450 procedimentos</option></select></label>` : ''}</article>`).join('');
    for (const item of increments.filter(item => priceInputs.some(input => input.increment === item.id))) {
      const card = root.querySelector(`[data-increment="${item.id}"]`).closest('.increment-card');
      card.querySelector('.increment-card-heading').insertAdjacentHTML('afterend', `<span class="increment-state" data-increment-state="${item.id}"></span>`);
      const fields = priceInputs.filter(input => input.increment === item.id).map(input => `<label class="increment-price"><span>${h(input.label)} · custo unitário</span><input class="money-input" type="text" inputmode="decimal" data-increment-price="${input.key}" aria-label="${h('Custo atualizado: ' + input.label)}" placeholder="Informar custo em R$"><small data-price-status="${input.key}"></small></label>`).join('');
      card.insertAdjacentHTML('beforeend', `<details class="increment-prices"><summary data-price-editor="${item.id}">Informar custos unitários${icon('chevron')}</summary><div>${fields}</div></details>`);
    }
  }
  $('#hugol-audit').innerHTML = workbookAudit(policy).map(item => `<tr><th scope="row">${h(item.name)}</th><td data-label="Planilha">${currency(item.sourceTotalCents / 100)}</td><td data-label="Dashboard">${currency(item.dashboardTotal)}</td><td data-label="Conferência" class="audit-result">${item.difference === 0 ? 'Conferido' : `${item.corrected ? 'Preço corrigido · ' : ''}${signedCurrency(item.difference)}`}</td></tr>`).join('');

  function field(row, key, label) {
    const state = snapshot.state[row.id];
    const common = `data-h-id="${row.id}" data-h-key="${key}" aria-label="${h(label + ' — ' + row.name)}" ${state.enabled && row.available ? '' : 'disabled'}`;
    if (key === 'unit') return `<input ${common} class="money-input" type="text" inputmode="decimal" placeholder="Custo pendente" value="${Number.isFinite(state.unit) ? currency(state.unit) : ''}">`;
    const occupancy = key === 'factor' && row.kind === 'bed';
    return `<input ${common} type="number" min="0" step="${key === 'qty' ? 1 : occupancy ? 0.5 : 0.01}" value="${state[key]}">`;
  }
  function renderTables() {
    const search = normalize($('#hugol-search').value.trim());
    const rows = snapshot.rows.filter(row => !search || normalize(row.name + ' ' + row.group).includes(search));
    $('#hugol-tables').innerHTML = [...new Set(rows.map(row => row.group))].map(group => {
      const groupRows = rows.filter(row => row.group === group), kind = groupRows[0].kind, withFactor = kind !== 'service';
      const quantity = kind === 'bed' ? 'Leitos' : kind === 'surgery' ? 'Nº de cirurgias' : 'Quantidade', factor = kind === 'bed' ? 'Ocupação' : 'Horas médias';
      return `<details data-h-category="${h(group)}" ${search || openGroups.get(group) ? 'open' : ''}><summary><span class="category-icon">${icon(kind === 'bed' ? 'bed' : kind === 'surgery' ? 'scissors' : 'document')}</span><span class="category-label"><strong>${h(group)}</strong><small>${groupRows.length} serviços</small></span><span class="category-cost" data-h-group="${h(group)}"></span><span class="category-chevron">${icon('chevron')}</span></summary>${blockControls(group, kind === 'bed')}<div class="table-scroll" tabindex="0" role="region" aria-label="${h('Serviços da base ' + basisName + ': ' + group)}"><table class="${withFactor ? 'with-factor' : 'without-factor'}"><thead><tr><th>Ativo / serviço</th><th>${quantity}</th>${withFactor ? `<th>${factor}</th>` : ''}<th>Custo unitário</th><th>Total mensal</th></tr></thead><tbody>${groupRows.map(row => {
        const state = snapshot.state[row.id], excluded = !includeOmittedWard && !row.countedInWorkbook;
        return `<tr data-h-row="${row.id}"><td><div class="service-cell"><label class="service-name"><input type="checkbox" class="service-switch" data-h-id="${row.id}" data-h-key="enabled" aria-label="${h('Incluir ' + row.name + ' na base ' + basisName)}" ${state.enabled ? 'checked' : ''} ${row.available ? '' : 'disabled'}><span>${h(row.name)}<small data-h-volume="${row.id}"></small>${excluded ? '<small class="excluded-label">Fora do subtotal da planilha</small>' : ''}</span></label><span class="row-badge" data-h-badge="${row.id}"></span></div></td><td data-label="${quantity}">${field(row, 'qty', quantity)}</td>${withFactor ? `<td data-label="${factor}"><span class="factor-field">${field(row, 'factor', factor)}<span>${kind === 'bed' ? '%' : 'h'}</span></span>${kind === 'bed' ? '<span class="occupancy-change" data-occupancy-change hidden></span>' : ''}</td>` : ''}<td data-label="Custo unitário"><span class="unit-value">${field(row, 'unit', 'Custo unitário')}<small class="unit-source" data-h-unit-reference title="${h('Valor de origem: ' + currency(row.unit) + (row.sourceUnitCell ? ' · ' + row.sourceUnitCell : ''))}"></small></span></td><td class="row-total" data-label="${excluded ? 'Valor fora do subtotal' : 'Total mensal'}" data-h-total="${row.id}"></td></tr>`;
      }).join('')}</tbody></table></div></details>`;
    }).join('') || '<div class="no-results"><h3>Nenhum serviço encontrado</h3><p>Tente outro termo de busca.</p></div>';
  }
  function refresh(rebuild = true) {
    snapshot = hugolSnapshot(config, policy);
    for (const button of scenarioChoices) {
      const previewConfig = presetState(button.dataset.scenarioChoice);
      const sameSelection = config.selected.length === previewConfig.selected.length && config.selected.every(id => previewConfig.selected.includes(id));
      button.setAttribute('aria-pressed', String(config.base === previewConfig.base && (button.dataset.choiceKind !== 'preset' || sameSelection)));
    }
    for (const section of root.querySelectorAll('[data-increments-only]')) section.hidden = config.base !== 'new';
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
      const ready = increments.filter(item => model.canSelectIncrement(config, item.id));
      $('#hugol-select-all').disabled = config.base !== 'new' || ready.every(item => config.selected.includes(item.id));
      $('#hugol-select-all').textContent = ready.length < increments.length ? 'Selecionar disponíveis' : 'Selecionar todos';
      $('#hugol-clear-increments').disabled = config.selected.length === 0;
      for (const checkbox of root.querySelectorAll('[data-increment]')) {
        checkbox.checked = config.selected.includes(checkbox.dataset.increment);
        checkbox.disabled = !model.canSelectIncrement(config, checkbox.dataset.increment);
      }
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
      if (priceInputs.length) {
        const pending = increments.length - ready.length;
        if (pending) $('#hugol-selection-summary').textContent += ` · ${pending} aguardam custo atualizado`;
        for (const input of priceInputs) {
          const field = root.querySelector(`[data-increment-price="${input.key}"]`), value = config.edits?.[input.rowIds[0]]?.unit;
          if (document.activeElement !== field) field.value = Number.isFinite(value) ? currency(value) : '';
          root.querySelector(`[data-price-status="${input.key}"]`).textContent = Number.isFinite(value) ? 'Preço informado para esta simulação' : 'Sem preço na base de valores e produção';
        }
        for (const item of increments.filter(item => priceInputs.some(input => input.increment === item.id))) {
          const known = model.canSelectIncrement(config, item.id);
          const state = root.querySelector(`[data-increment-state="${item.id}"]`);
          state.textContent = known ? 'Preço informado' : 'Aguardando preço'; state.dataset.ready = String(known);
          const editor = root.querySelector(`[data-price-editor="${item.id}"]`);
          editor.firstChild.textContent = known ? 'Editar custos unitários' : 'Informar custos unitários';
          if (!known) {
            $(`[data-increment-amount="${item.id}"]`).textContent = 'Custo a informar';
            $(`[data-increment-caption="${item.id}"]`).textContent = 'Defina o custo para incluir este serviço';
          } else if (item.id !== 'hemodynamics') {
            $(`[data-increment-amount="${item.id}"]`).textContent = '+ ' + currency(model.incrementQuote(config, item.id, policy));
            $(`[data-increment-caption="${item.id}"]`).textContent = 'Calculado com os preços informados';
          }
        }
        const readiness = root.querySelector('[data-cost-readiness]');
        if (readiness) {
          readiness.dataset.ready = String(pending === 0);
          readiness.textContent = pending ? `${ready.length} incrementos disponíveis · ${pending} aguardam preço atualizado. Use “Informar custos unitários” no serviço desejado para liberar sua seleção.` : 'Todos os incrementos têm preços definidos. Escolha os serviços que deseja incluir.';
        }
        const hemoCard = root.querySelector('[data-increment="hemodynamics"]').closest('.increment-card');
        hemoCard.querySelector('.increment-volume').hidden = !model.canSelectIncrement(config, 'hemodynamics');
      }
    }
    $('#hugol-change-count').textContent = `${snapshot.rows.filter(row => snapshot.state[row.id].enabled).length} serviços ativos`;
    if (rebuild) renderTables();
    if (!showUnitReferences) for (const reference of root.querySelectorAll('[data-h-unit-reference]')) reference.remove();
    for (const total of root.querySelectorAll('[data-h-group]')) total.textContent = currency(snapshot.totals.find(item => item.group === total.dataset.hGroup).total);
    for (const element of root.querySelectorAll('[data-h-row]')) {
      const row = snapshot.rows.find(item => item.id === element.dataset.hRow), state = snapshot.state[row.id], modified = snapshot.modifiedIds.includes(row.id);
      element.classList.toggle('disabled', !state.enabled); element.classList.toggle('modified', modified && state.enabled);
      element.querySelector('[data-h-total]').textContent = currency(snapshot.rawValues[row.id]);
      element.querySelector('[data-h-volume]').textContent = !row.available ? 'Selecione o incremento para incluir este serviço' : row.kind === 'bed' ? `Paciente-dia projetado: ${number(hugolVolume(row, state))}${row.volumeRounding === 'up' ? ' · arredondado para cima' : ''}` : row.kind === 'surgery' ? `${number(hugolVolume(row, state))} horas cirúrgicas` : row.criterion;
      const badge = element.querySelector('[data-h-badge]'); badge.hidden = !modified; badge.textContent = state.enabled ? 'Alterado' : 'Retirado';
      const reference = element.querySelector('[data-h-unit-reference]');
      if (reference) {
        const description = describePriceReference(row, state.unit, 'Base R$ ' + basisName);
        reference.textContent = description.label;
        reference.dataset.percentile = description.percentile;
        reference.dataset.referenceStatus = description.status;
        reference.dataset.edited = String(description.edited);
        reference.title = description.title;
        let detail = element.querySelector('[data-h-reference-detail]');
        if (!detail) {
          detail = document.createElement('small'); detail.className = 'reference-detail'; detail.dataset.hReferenceDetail = '';
          reference.after(detail);
        }
        detail.textContent = description.detail; detail.hidden = !description.detail;
      }
      if (row.kind === 'bed') updateOccupancyComparison(element.querySelector('[data-occupancy-change]'), row.factor, state.factor);
      for (const field of element.querySelectorAll('input:not([type=checkbox])')) field.disabled = !state.enabled || !row.available;
    }
    syncBlockControls($('#hugol-tables'), snapshot.rows, snapshot.state, snapshot.modifiedIds);
    if (scenarioChoices.length) drafts[config.base] = structuredClone(config);
    try { localStorage.setItem(storageKey, JSON.stringify({ ...config, version: storageVersion, ...(scenarioChoices.length ? {drafts} : {}) })); $('#hugol-save-status').textContent = 'Salvo neste navegador'; }
    catch { $('#hugol-save-status').textContent = 'Salvamento automático indisponível'; }
    onChange?.(snapshot);
  }
  if (hasIncrements) {
    function selectPreset(id, useDraft = false) {
      const next = presetState(id);
      if (scenarioChoices.length && useDraft) {
        if (next.base === config.base) return;
        drafts[config.base] = structuredClone(config);
        config = drafts[next.base] ? structuredClone(drafts[next.base]) : next;
      } else {
        for (const input of priceInputs) for (const rowId of input.rowIds) if (Number.isFinite(config.edits?.[rowId]?.unit)) next.edits[rowId] = { unit: config.edits[rowId].unit };
        config = next;
      }
      refresh();
    }
    for (const button of scenarioChoices) button.addEventListener('click', () => selectPreset(button.dataset.scenarioChoice, button.dataset.choiceKind !== 'preset'));
    $('#hugol-increments').addEventListener('change', event => { if (event.target.dataset.increment) { config = setIncrement(config, event.target.dataset.increment, event.target.checked); refresh(); } });
    $('#hugol-hemodynamics-volume').addEventListener('change', event => { config = setHemodynamicsVolume(config, Number(event.target.value)); refresh(); });
    $('#hugol-preset').addEventListener('change', event => selectPreset(event.target.value));
    $('#hugol-select-all').addEventListener('click', () => { for (const item of increments) if (model.canSelectIncrement(config, item.id)) config = setIncrement(config, item.id, true); refresh(); });
    $('#hugol-clear-increments').addEventListener('click', () => { for (const item of increments) config = setIncrement(config, item.id, false); refresh(); });
    $('#hugol-increments').addEventListener('input', event => {
      const field = event.target, key = field.dataset.incrementPrice; if (!key) return;
      const value = parseCurrency(field.value);
      field.setAttribute('aria-invalid', value === null ? 'true' : 'false'); if (value === null) return;
      config = model.setIncrementPrice(config, key, value); refresh();
    });
    $('#hugol-increments').addEventListener('focusin', event => {
      const key = event.target.dataset.incrementPrice; if (!key) return;
      const input = priceInputs.find(input => input.key === key), value = config.edits?.[input.rowIds[0]]?.unit;
      event.target.value = Number.isFinite(value) ? value.toLocaleString('pt-BR', {useGrouping:false,minimumFractionDigits:2}) : ''; event.target.select();
    });
    $('#hugol-increments').addEventListener('focusout', event => { if (event.target.dataset.incrementPrice) { event.target.removeAttribute('aria-invalid'); refresh(false); } });
  }
  $('#hugol-reset').addEventListener('click', () => {
    const activeChoice = scenarioChoices.find(button => presetState(button.dataset.scenarioChoice).base === config.base);
    config = presetState(activeChoice?.dataset.scenarioChoice || defaultPreset); $('#hugol-search').value = ''; refresh();
  });
  $('#hugol-search').addEventListener('input', () => refresh());
  const tables = $('#hugol-tables');
  bindBlockControls(tables, () => snapshot, changes => {
    for (const [id, patch] of Object.entries(changes)) config.edits[id] = { ...config.edits[id], ...patch };
    refresh();
  }, group => {
    config = restoreGroup(config, group);
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
  $('#hugol-export').addEventListener('click', () => {
    const decimal = value => Number.isFinite(value) ? value.toFixed(2).replace('.', ',') : '';
    const lines = [['Categoria','Serviço','Ativo','Quantidade / leitos','Ocupação (%) / horas médias','Custo unitário (R$)','Referência do custo','Custo da linha (R$)','Custeio considerado (R$)'], ...snapshot.rows.map(row => [row.group, row.name, snapshot.state[row.id].enabled ? 'Sim' : 'Não', snapshot.state[row.id].qty, row.factor === undefined ? '' : String(snapshot.state[row.id].factor).replace('.', ','), decimal(snapshot.state[row.id].unit), describePriceReference(row, snapshot.state[row.id].unit, 'Base R$ ' + basisName).exportLabel, decimal(snapshot.rawValues[row.id]), decimal(snapshot.values[row.id])]), ['TOTAL','','','','','','','',decimal(snapshot.total)]];
    if (!showUnitReferences) for (const line of lines) line.splice(6, 1);
    const csv = lines.map(row => row.map(value => '"' + String(value).replaceAll('"','""') + '"').join(';')).join('\r\n');
    const url = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = exportFileName; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  refresh();
}
