import { updatedSource } from './updated-source.js';
import { createIncrementModel } from './increment-model.js';

export const model = createIncrementModel(updatedSource, 'HUGO atualizado', { unitCorrections: [
  { id: 'updated-same-22', unit: 624.80, sourceUnitCell: 'M22', reason: 'Pronto Atendimento: usar o P75 de R$ 624,80, conforme correção do usuário.' },
  { id: 'updated-new-23', unit: 624.80, sourceUnitCell: 'O23', reason: 'Pronto Atendimento: usar o P75 de R$ 624,80, conforme correção do usuário.' },
] });

export function migrateSavedConfig(saved) {
  // Replace only the untouched default from the first import. Keep chosen
  // increments, manual edits and explicit new-building selections after v2.
  if (saved && saved.version !== 2 && saved.base === 'new'
    && Array.isArray(saved.selected) && saved.selected.length === 0
    && saved.edits && typeof saved.edits === 'object' && !Array.isArray(saved.edits)
    && Object.keys(saved.edits).length === 0) return model.presetState('same');
  return saved;
}
