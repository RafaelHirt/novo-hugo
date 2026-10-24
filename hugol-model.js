import { hugolSource } from './hugol-source.js';
import { createIncrementModel } from './increment-model.js';
export const model = createIncrementModel(hugolSource, 'HUGOL', { unitCorrections: [
  { id: 'same-69', unit: 4948.21, reason: 'Gestão de altas corrigida pelo usuário conforme a referência HUGOL.' },
  { id: 'new-87', unit: 4948.21, reason: 'Gestão de altas corrigida pelo usuário conforme a referência HUGOL.' },
] });
export const { increments, presets, subtotalIssue, presetState, setIncrement, volume: hugolVolume, rowCost: hugolRowCost, snapshot: hugolSnapshot, workbookAudit } = model;
