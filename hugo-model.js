import { hugoSource } from './hugo-source.js';
import { createIncrementModel } from './increment-model.js';
export const model = createIncrementModel(hugoSource, 'HUGO');
export const { increments, presets, presetState, setIncrement, volume, rowCost, snapshot, workbookAudit } = model;
