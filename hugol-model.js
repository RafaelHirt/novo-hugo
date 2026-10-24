import { hugolSource } from './hugol-source.js';
import { createIncrementModel } from './increment-model.js';
const baseNames = { same: 'Base HUGOL - Prédio atual', new: 'Base HUGOL - Novo prédio' };
const displaySource = { ...hugolSource, baseNames,
  presets: hugolSource.presets.map(preset => ({ ...preset,
    name: preset.id === 'same' ? baseNames.same : preset.id === 'new-0' ? baseNames.new : preset.name,
  })),
};
export const model = createIncrementModel(displaySource, 'HUGOL', { unitCorrections: [
  { id: 'same-69', unit: 4948.21, reason: 'Gestão de altas corrigida pelo usuário conforme a referência HUGOL.' },
  { id: 'new-87', unit: 4948.21, reason: 'Gestão de altas corrigida pelo usuário conforme a referência HUGOL.' },
] });
export const { increments, presets, subtotalIssue, presetState, setIncrement, volume: hugolVolume, rowCost: hugolRowCost, snapshot: hugolSnapshot, workbookAudit } = model;
