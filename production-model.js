import { productionSource } from './production-source.js';
import { productionIncrementSource } from './production-increments-source.js';
import { createIncrementModel } from './increment-model.js';

// The current building retains its approved values-and-production worksheet.
// New-building values retain their source; approved corrections are applied below.
const occupancyLabels = { same: 'Atual HUGO - Taxa de ocupação real', new: 'Novo HUGO - Taxa de ocupação estimada' };
export const productionScenarioSource = { ...productionIncrementSource,
  bases: { same: productionSource.bases.new, new: productionIncrementSource.bases.new },
  presets: [ { ...productionSource.presets[0], base: 'same', name: occupancyLabels.same },
    ...productionIncrementSource.presets.filter(preset => preset.base === 'new').map(preset => ({ ...preset,
      name: occupancyLabels.new + ' · ' + (preset.id === 'new-0' ? 'HUGO - SEM BANCO DE SANGUE' : preset.name),
    })) ],
  referenceBase: undefined,
  baseNames: occupancyLabels,
  referenceCaption: 'Sobre a base selecionada, sem serviços adicionais',
  sourceFiles: {
    same: { fileName: productionSource.fileName, sha256: productionSource.sha256 },
    new: { fileName: productionIncrementSource.fileName, sha256: productionIncrementSource.sha256 },
  },
};
const fixedEmergencyId = 'production-increment-new-23';
const dischargeOfficeId = 'production-increment-new-87';
// Version 8 used revised SADT defaults. Discard only those quantity overrides
// once when rolling back, retaining prices, other edits and chosen increments.
const rolledBackSadtIds = new Set(productionIncrementSource.bases.new
  .filter(row => row.group.startsWith('SADT') && row.qty > 0
    && !['production-increment-new-70', 'production-increment-new-73'].includes(row.id))
  .map(row => row.id));
const coreModel = createIncrementModel(productionScenarioSource, 'HUGO · valores e produção', {
  unitCorrections: [{ id: dischargeOfficeId, unit: 6670.06, sourceUnitCell: 'HUGO - 1º TA!N70',
    reason: 'Escritório de gestão de altas: usar R$ 6.670,06 por unidade da Manifestação GEC (5), mantendo as 10 unidades autorizadas pelo usuário.' }],
  quantityCorrections: [{ id: fixedEmergencyId, qty: 3000, fixed: true,
    reason: 'Pronto Atendimento: 3.000 atendimentos mensais fixos, conforme autorização do usuário e HUGO - 1º TA!J21 da Manifestação GEC (5).' }],
});
export const model = { ...coreModel, snapshot(config, policy) {
  return { ...coreModel.snapshot(config, policy), occupancyLabel: occupancyLabels[config.base] };
} };

export function migrateSavedConfig(saved) {
  if (!saved) return saved;
  const filterEdits = (candidate, base) => {
    const ids = new Set(productionScenarioSource.bases[base].map(row => row.id));
    const edits = candidate?.edits && typeof candidate.edits === 'object' && !Array.isArray(candidate.edits) ? candidate.edits : {};
    return Object.fromEntries(Object.entries(edits).filter(([id]) => ids.has(id)).flatMap(([id, patch]) => {
      const fixedEmergency = base === 'new' && id === fixedEmergencyId;
      const resetOffice = base === 'new' && id === dischargeOfficeId && !(saved.version >= 7);
      const rollbackSadt = base === 'new' && saved.version === 8 && rolledBackSadtIds.has(id);
      if (!fixedEmergency && !resetOffice && !rollbackSadt) return [[id, patch]];
      const next = { ...patch };
      delete next.qty;
      if (resetOffice) delete next.unit;
      return Object.keys(next).length ? [[id, next]] : [];
    }));
  };
  const clean = (candidate, base) => ({ base, selected: base === 'new' && Array.isArray(candidate?.selected) ? candidate.selected : [], edits: filterEdits(candidate, base) });
  if (Number.isInteger(saved.version) && saved.version >= 5) {
    const base = saved.base === 'new' ? 'new' : 'same', result = clean(saved, base), drafts = {};
    for (const key of ['same', 'new']) if (saved.drafts?.[key]) drafts[key] = clean(saved.drafts[key], key);
    return { ...result, drafts };
  }
  // v1/v4 used "new" for the real 42-row worksheet; v2/v3 used it for a
  // discarded simulation. Only the actual worksheet edits can migrate to v5.
  const wasSimulation = saved.base === 'new' && Number.isInteger(saved.version) && saved.version >= 2 && saved.version < 4;
  const worksheet = wasSimulation ? saved.drafts?.same || saved : saved;
  const current = clean(worksheet, 'same');
  return { ...current, drafts: { same: current } };
}
