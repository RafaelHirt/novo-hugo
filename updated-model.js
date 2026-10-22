import { updatedSource } from './updated-source.js';
import { createIncrementModel } from './increment-model.js';

export const model = createIncrementModel(updatedSource, 'HUGO atualizado');

export function migrateSavedConfig(saved) {
  // Replace only the untouched default from the first import. Keep chosen
  // increments, manual edits and explicit new-building selections after v2.
  if (saved && saved.version !== 2 && saved.base === 'new'
    && Array.isArray(saved.selected) && saved.selected.length === 0
    && saved.edits && typeof saved.edits === 'object' && !Array.isArray(saved.edits)
    && Object.keys(saved.edits).length === 0) return model.presetState('same');
  return saved;
}
