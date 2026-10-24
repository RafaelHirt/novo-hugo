import { productionSource } from './production-source.js';
import { createIncrementModel } from './increment-model.js';

// Only the 42 services in the approved worksheet. New-building increments will
// require their own supplied costing sheet before they can be offered here.
export const model = createIncrementModel(productionSource, 'HUGO · valores e produção');

export function migrateSavedConfig(saved) {
  if (!saved) return saved;
  // v2/v3 used "new" for the simulation and "same" for the actual worksheet.
  // Recover the worksheet draft; never carry simulation rows or supplied prices.
  const wasSimulation = saved.base === 'new' && Number.isInteger(saved.version) && saved.version >= 2 && saved.version < 4;
  const worksheet = wasSimulation ? saved.drafts?.same || saved : saved;
  const ids = new Set(productionSource.bases.new.map(row => row.id));
  const candidate = worksheet.edits && typeof worksheet.edits === 'object' && !Array.isArray(worksheet.edits) ? worksheet.edits : {};
  return { base:'new', selected:[], edits:Object.fromEntries(Object.entries(candidate).filter(([id]) => ids.has(id))) };
}
