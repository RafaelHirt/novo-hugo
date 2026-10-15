import { hugolSource } from './hugol-source.js';
import { bedTotals, DAYS_PER_MONTH } from './data.js';
import { roundCurrency } from './format.js';

export const increments = hugolSource.increments;
export const presets = hugolSource.presets;
export const subtotalIssue = hugolSource.subtotalIssue;
const incrementById = new Map(increments.map(item => [item.id, item]));
const roundUp = value => Math.ceil(value - Math.abs(value) * Number.EPSILON * 4);

export function presetState(id) {
  const preset = presets.find(item => item.id === id);
  if (!preset) throw new Error('Cenário da planilha não encontrado.');
  return { base: preset.base, selected: [...preset.selected], edits: {} };
}

export function setIncrement(config, id, enabled) {
  if (config.base !== 'new' || !incrementById.has(id)) throw new Error('Incremento indisponível nesta base.');
  const selected = new Set(config.selected);
  if (enabled) selected.add(id); else selected.delete(id);
  const edits = { ...config.edits };
  // Toggling a package restores its own rows; unrelated manual changes remain.
  for (const rowId of Object.keys(incrementById.get(id).patches)) delete edits[rowId];
  return { ...config, selected: increments.filter(item => selected.has(item.id)).map(item => item.id), edits };
}

export function hugolVolume(row, state) {
  if (!state.enabled) return 0;
  let value = state.qty;
  if (row.kind === 'bed') value *= state.factor / 100 * DAYS_PER_MONTH;
  if (row.kind === 'surgery') value *= state.factor;
  if (row.volumeRounding === 'up') return roundUp(value);
  if (row.volumeRounding === 'nearest') return Math.round(value);
  return value;
}

export function hugolRowCost(row, state) {
  return roundCurrency(hugolVolume(row, state) * state.unit);
}

function buildRows(config) {
  const selected = new Set(config.selected);
  return hugolSource.bases[config.base].map(original => {
    let row = { ...original };
    if (config.base === 'new') {
      for (const increment of increments) {
        const patch = increment.patches[row.id];
        if (patch && original.qty === 0) row.requiredIncrement = increment.id;
        if (patch && selected.has(increment.id)) row = { ...row, ...patch, sourceSheet: increment.sourceSheet };
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
    rawValues[row.id] = hugolRowCost(row, state[row.id]);
    values[row.id] = includeOmittedWard || row.countedInWorkbook ? rawValues[row.id] : 0;
  }
  const groups = [...new Set(rows.map(row => row.group))];
  const totals = groups.map(group => ({ group, total: rows.filter(row => row.group === group).reduce((cents, row) => cents + Math.round(values[row.id] * 100), 0) / 100 }));
  const total = totals.reduce((cents, item) => cents + Math.round(item.total * 100), 0) / 100;
  return { rows, state, rawValues, values, totals, total, beds: bedTotals(state, rows) };
}

export function hugolSnapshot(config, { includeOmittedWard } = {}) {
  if (typeof includeOmittedWard !== 'boolean') throw new Error('Defina o tratamento do subtotal da UI do 2º andar.');
  if (!['same', 'new'].includes(config.base) || !Array.isArray(config.selected)) throw new Error('Base de cenário inválida.');
  if (config.selected.some(id => !incrementById.has(id)) || config.base === 'same' && config.selected.length) throw new Error('Seleção de incrementos inválida para esta base.');
  const rows = buildRows(config);
  const snapshot = priceRows(rows, config.edits || {}, includeOmittedWard);
  const base = priceRows(buildRows({ base: config.base, selected: [] }), {}, includeOmittedWard);
  const matchingPreset = presets.find(item => item.base === config.base && item.selected.length === config.selected.length && item.selected.every(id => config.selected.includes(id)));
  const modified = rows.filter(row => {
    const original = { enabled: row.available && row.qty > 0, qty: row.qty, unit: row.unit, factor: row.factor };
    return Object.keys(original).some(key => snapshot.state[row.id][key] !== original[key]);
  });
  return {
    ...snapshot, baseTotal: base.total, delta: roundCurrency(snapshot.total - base.total),
    selected: increments.filter(item => config.selected.includes(item.id)),
    baseName: config.base === 'new' ? 'Novo prédio' : 'HUGO · Base HUGOL (sem aumento)',
    preset: matchingPreset, modifiedIds: modified.map(row => row.id), includeOmittedWard,
    excludedAmount: rows.reduce((cents, row) => cents + Math.round((snapshot.rawValues[row.id] - snapshot.values[row.id]) * 100), 0) / 100,
  };
}

export function workbookAudit(policy) {
  return presets.map(preset => {
    const snapshot = hugolSnapshot(presetState(preset.id), policy);
    return { ...preset, dashboardTotal: snapshot.total, difference: roundCurrency(snapshot.total - preset.sourceTotalCents / 100) };
  });
}
