import { bedTotals, DAYS_PER_MONTH } from './data.js';
import { roundCurrency } from './format.js';

export function createIncrementModel(source, basisName) {
  const bedPackage = source.increments.find(item => item.id === 'beds');
  const newBase = source.bases.new;
  const bedPackageRows = newBase.filter(row => bedPackage?.patches[row.id]);
  const sadtRows = bedPackageRows.filter(row => row.group.startsWith('SADT'));
  const referenceBeds = source.bedAdequacy?.referenceBeds || newBase.filter(row => row.kind === 'bed').reduce((sum, row) => sum + row.qty, 0);
  const baseBeds = source.bedAdequacy?.baseBeds || referenceBeds;
  const bedOptions = [['wardBeds', 'ward', 'Enfermaria (UI)'], ['icuBeds', 'icu', 'UTI']].map(([id, type, label]) => {
    const rows = bedPackageRows.filter(row => row.bedType === type);
    const addedBeds = rows.reduce((sum, row) => sum + bedPackage.patches[row.id].qty - row.qty, 0);
    return { id, name: `Adequação · ${label}`, description: `+${addedBeds} leitos de ${label}, com o ajuste de SADT correspondente.`, addedBeds, sourceSheet: bedPackage?.sourceSheet, patches: Object.fromEntries(rows.map(row => [row.id, bedPackage.patches[row.id]])) };
  });
  const expandBedSelection = selected => [...new Set(selected.flatMap(id => id === 'beds' ? bedOptions.map(item => item.id) : [id]))];
  const normalizeConfig = config => ({ ...config, selected: Array.isArray(config.selected) ? expandBedSelection(config.selected) : config.selected });
  const increments = source.increments.flatMap(item => item.id === 'beds' ? bedOptions : [item]);
  const presets = source.presets.map(item => ({ ...item, selected: expandBedSelection(item.selected) }));
  const subtotalIssue = source.subtotalIssue;
  const incrementById = new Map(increments.map(item => [item.id, item]));
  const roundUp = value => Math.ceil(value - Math.abs(value) * Number.EPSILON * 4);

  function presetState(id) {
    const preset = presets.find(item => item.id === id);
    if (!preset) throw new Error('Cenário da planilha não encontrado.');
    return { base: preset.base, selected: [...preset.selected], edits: {} };
  }

  function setIncrement(config, id, enabled) {
    config = normalizeConfig(config);
    if (config.base !== 'new' || !incrementById.has(id)) throw new Error('Incremento indisponível nesta base.');
    const selected = new Set(config.selected);
    if (enabled) selected.add(id); else selected.delete(id);
    const edits = { ...config.edits };
    // Toggling a package restores its own rows; unrelated manual changes remain.
    for (const rowId of Object.keys(incrementById.get(id).patches)) delete edits[rowId];
    if (bedOptions.some(item => item.id === id)) for (const row of sadtRows) delete edits[row.id];
    return { ...config, selected: increments.filter(item => selected.has(item.id)).map(item => item.id), edits };
  }

  function setHemodynamicsVolume(config, quantity) {
    config = normalizeConfig(config);
    if (![250, 450].includes(quantity)) throw new Error('Escolha 250 ou 450 procedimentos de hemodinâmica por mês.');
    const row = source.bases.new.find(item => item.group === 'Hemodinâmica');
    if (!row) throw new Error('Hemodinâmica indisponível nesta base.');
    const next = config.selected.includes('hemodynamics') ? config : setIncrement(config, 'hemodynamics', true);
    return { ...next, edits: { ...next.edits, [row.id]: { ...next.edits[row.id], enabled: true, qty: quantity } } };
  }

  function volume(row, state) {
    if (!state.enabled) return 0;
    let value = state.qty;
    if (row.kind === 'bed') value *= state.factor / 100 * DAYS_PER_MONTH;
    if (row.kind === 'surgery') value *= state.factor;
    if (row.volumeRounding === 'up') return roundUp(value);
    if (row.volumeRounding === 'nearest') return Math.round(value);
    return value;
  }

  function rowCost(row, state) {
    return roundCurrency(volume(row, state) * state.unit);
  }

  function buildRows(config) {
    const selected = new Set(config.selected);
    const selectedBedOptions = bedOptions.filter(item => selected.has(item.id));
    const sadtMultiplier = Math.round((baseBeds + selectedBedOptions.reduce((sum, item) => sum + item.addedBeds, 0)) / referenceBeds * 100) / 100;
    return source.bases[config.base].map(original => {
      let row = { ...original };
      if (config.base === 'new') {
        for (const increment of increments) {
          const patch = increment.patches[row.id];
          if (patch && original.qty === 0) row.requiredIncrement = increment.id;
          if (patch && selected.has(increment.id)) row = { ...row, ...patch, sourceSheet: increment.sourceSheet };
        }
        if (selectedBedOptions.length && sadtRows.some(item => item.id === row.id)) {
          row = selectedBedOptions.length === bedOptions.length
            ? { ...row, ...bedPackage.patches[row.id] }
            : { ...row, qty: Math.round((source.bedAdequacy?.sadtBaseQuantities[row.id] ?? original.qty) * sadtMultiplier) };
        }
      }
      return { ...row, available: !row.requiredIncrement || selected.has(row.requiredIncrement) };
    });
  }

  function priceRows(rows, edits, includeOmittedWard) {
    const state = {}, rawValues = {}, values = {};
    for (const row of rows) {
      const candidate = edits[row.id] || {};
      state[row.id] = {
        enabled: row.available && (typeof candidate.enabled === 'boolean' ? candidate.enabled : row.qty > 0),
        qty: Number.isFinite(candidate.qty) && candidate.qty >= 0 && Number.isInteger(candidate.qty) ? candidate.qty : row.qty,
        unit: Number.isFinite(candidate.unit) && candidate.unit >= 0 ? roundCurrency(candidate.unit) : row.unit,
        factor: row.factor,
      };
      if (row.factor !== undefined && Number.isFinite(candidate.factor) && candidate.factor >= 0
        && (row.kind !== 'bed' || candidate.factor <= 100 && Number.isInteger(candidate.factor * 2))) state[row.id].factor = candidate.factor;
      rawValues[row.id] = rowCost(row, state[row.id]);
      values[row.id] = includeOmittedWard || row.countedInWorkbook ? rawValues[row.id] : 0;
    }
    const groups = [...new Set(rows.map(row => row.group))];
    const totals = groups.map(group => ({ group, total: rows.filter(row => row.group === group).reduce((cents, row) => cents + Math.round(values[row.id] * 100), 0) / 100 }));
    const total = totals.reduce((cents, item) => cents + Math.round(item.total * 100), 0) / 100;
    return { rows, state, rawValues, values, totals, total, beds: bedTotals(state, rows) };
  }

  function scenarioSnapshot(config, { includeOmittedWard } = {}) {
    config = normalizeConfig(config);
    if (typeof includeOmittedWard !== 'boolean') throw new Error('Defina o tratamento do subtotal da UI do 2º andar.');
    if (!Object.hasOwn(source.bases, config.base) || !Array.isArray(config.selected)) throw new Error('Base de cenário inválida.');
    if (config.selected.some(id => !incrementById.has(id)) || config.base === 'same' && config.selected.length) throw new Error('Seleção de incrementos inválida para esta base.');
    const rows = buildRows(config);
    const snapshot = priceRows(rows, config.edits || {}, includeOmittedWard);
    const referenceBase = source.referenceBase || config.base;
    const base = priceRows(buildRows({ base: referenceBase, selected: [] }), {}, includeOmittedWard);
    const baseName = key => source.baseNames?.[key] || (key === 'new' ? 'Novo Prédio - Base' : `HUGO · Base ${basisName} (sem aumento)`);
    const matchingPreset = presets.find(item => item.base === config.base && item.selected.length === config.selected.length && item.selected.every(id => config.selected.includes(id)));
    const modified = rows.filter(row => {
      const original = { enabled: row.available && row.qty > 0, qty: row.qty, unit: row.unit, factor: row.factor };
      return Object.keys(original).some(key => snapshot.state[row.id][key] !== original[key]);
    });
    return {
      ...snapshot, baseTotal: base.total, delta: roundCurrency(snapshot.total - base.total),
      selected: increments.filter(item => config.selected.includes(item.id)),
      baseName: baseName(config.base), referenceName: baseName(referenceBase),
      referenceCaption: source.referenceCaption || 'Sobre a base sem incrementos',
      periodLabel: source.periodLabel,
      preset: matchingPreset, modifiedIds: modified.map(row => row.id), includeOmittedWard,
      excludedAmount: rows.reduce((cents, row) => cents + Math.round((snapshot.rawValues[row.id] - snapshot.values[row.id]) * 100), 0) / 100,
    };
  }

  function workbookAudit(policy) {
    return presets.map(preset => {
      const snapshot = scenarioSnapshot(presetState(preset.id), policy);
      return { ...preset, dashboardTotal: snapshot.total, difference: roundCurrency(snapshot.total - preset.sourceTotalCents / 100) };
    });
  }

  const baseline = priceRows(buildRows({ base: 'new', selected: [] }), {}, false);
  for (const option of bedOptions) {
    const isolated = priceRows(buildRows({ base: 'new', selected: [option.id] }), {}, false);
    option.amountCents = Math.round((isolated.total - baseline.total) * 100);
    option.bedAmountCents = Math.round(Object.keys(option.patches).reduce((sum, id) => sum + isolated.values[id] - baseline.values[id], 0) * 100);
    option.sadtAmountCents = option.amountCents - option.bedAmountCents;
  }

  return { increments, presets, subtotalIssue, presetState, setIncrement, setHemodynamicsVolume, normalizeConfig, volume, rowCost, snapshot: scenarioSnapshot, workbookAudit };
}
