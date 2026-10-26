import { productionSource } from './production-source.js';
import { productionIncrementSource } from './production-increments-source.js';
import { createIncrementModel } from './increment-model.js';

// The current building retains its approved values-and-production worksheet.
// Every new-building quantity and price comes directly from the new attachment.
const occupancyLabels = { same: 'Taxa de Ocupação Real', new: 'Taxa de Ocupação Estimada' };
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
const coreModel = createIncrementModel(productionScenarioSource, 'HUGO · valores e produção');
export const model = { ...coreModel, snapshot(config, policy) {
  return { ...coreModel.snapshot(config, policy), occupancyLabel: occupancyLabels[config.base] };
} };

export function migrateSavedConfig(saved) {
  if (!saved) return saved;
  const filterEdits = (candidate, base) => {
    const ids = new Set(productionScenarioSource.bases[base].map(row => row.id));
    const edits = candidate?.edits && typeof candidate.edits === 'object' && !Array.isArray(candidate.edits) ? candidate.edits : {};
    return Object.fromEntries(Object.entries(edits).filter(([id]) => ids.has(id)));
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
