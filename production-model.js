import { productionSource } from './production-source.js';
import { hugoSource } from './hugo-source.js';
import { createIncrementModel } from './increment-model.js';

// Quantities/distribution: the approved new-building scenarios. Prices and Ps:
// only the current values-and-production source, matched explicitly by service.
// null means a missing price, never a zero-cost or borrowed price.
const priceRows = {
  6:6, 7:6, 8:7, 9:7, 10:7, 11:7, 16:13, 17:13, 18:13,
  23:22, 26:null, 29:25, 32:28, 33:29, 34:30,
  38:35, 39:35, 40:35, 41:34, 42:35,
  46:39, 47:40, 48:41, 49:42, 50:43, 51:45, 52:44, 53:46, 54:47,
  55:48, 56:49, 57:null, 58:50, 59:51, 60:52, 61:53, 62:54, 63:55, 64:56, 65:57,
  69:61, 70:44, 71:62, 72:63, 73:49, 74:null, 75:64, 76:65,
  80:null, 83:null, 84:null, 87:69,
};
const newId = id => id.replace(/^hugo-new-/, 'production-new-');
const newRows = hugoSource.bases.new.map(original => {
  if (!Object.hasOwn(priceRows, original.sourceRow)) throw new Error('Serviço sem mapeamento de preço atualizado.');
  const priceRow = productionSource.bases.new.find(row => row.sourceRow === priceRows[original.sourceRow]);
  const row = { ...original, id: newId(original.id), name: original.sourceRow === 26 ? 'Serviço de atendimento domiciliar' : original.name, unit: priceRow?.unit ?? null, unitBasis: priceRow?.unitBasis ?? null,
    unitReference: priceRow ? undefined : 'Custo atualizado não informado',
    quantitySource: { fileName: hugoSource.fileName, row: original.sourceRow },
    priceSource: priceRow ? { fileName: productionSource.fileName, sheet: productionSource.sourceSheet, row: priceRow.sourceRow, cell: priceRow.sourceUnitCell } : null,
    sourceUnitCell: priceRow?.sourceUnitCell, sourceGreenCell: priceRow?.sourceGreenCell,
    sourceSheet: priceRow?.sourceSheet,
  };
  delete row.sourceVolume; delete row.sourceTotalCents; delete row.sourceCell; delete row.sourceFormula;
  return row;
});
const increments = hugoSource.increments.map(increment => ({ ...increment, amountCents: null,
  patches: Object.fromEntries(Object.entries(increment.patches).map(([id, patch]) => [newId(id), { qty: patch.qty }])),
}));
const bedAdequacy = structuredClone(hugoSource.bedAdequacy);
bedAdequacy.sadtBaseQuantities = Object.fromEntries(Object.entries(bedAdequacy.sadtBaseQuantities).map(([id, qty]) => [newId(id), qty]));
export const productionScenarioSource = { ...productionSource,
  bases: { same: productionSource.bases.new, new: newRows }, increments, bedAdequacy,
  referenceBase: 'same',
  baseNames: { same: productionSource.baseNames.new, new: 'Novo Prédio - Base Ago/25 - Jul/26' },
  presets: [ { ...productionSource.presets[0], base: 'same' },
    { id: 'new-0', name: 'Novo Prédio - Base Ago/25 - Jul/26', base: 'new', selected: [], isSimulation: true, sourceTotalCents: null } ],
  priceInputs: [
    { key: 'blood', increment: 'blood', label: 'Bolsa de sangue total', rowIds: ['production-new-83'] },
    { key: 'platelets', increment: 'blood', label: 'Bolsa de plaquetas por aférese', rowIds: ['production-new-84'] },
    { key: 'mri', increment: 'mri', label: 'Ressonância magnética (interno e externo)', rowIds: ['production-new-57', 'production-new-74'] },
    { key: 'sad', increment: 'sad', label: 'Atendimento domiciliar (SAD)', rowIds: ['production-new-26'] },
    { key: 'hemodynamics', increment: 'hemodynamics', label: 'Procedimento de hemodinâmica', rowIds: ['production-new-80'] },
  ],
};

export const model = createIncrementModel(productionScenarioSource, 'HUGO · valores e produção');

export function migrateSavedConfig(saved) {
  // v1 used "new" for the existing 42-service worksheet, before there was a
  // new-building simulation. Preserve all existing row edits and production.
  return saved && (!Number.isInteger(saved.version) || saved.version < 2) && saved.base === 'new' ? { ...saved, base: 'same' } : saved;
}
