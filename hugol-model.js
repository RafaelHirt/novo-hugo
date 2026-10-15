import { hugolSource } from './hugol-source.js';
import { createIncrementModel } from './increment-model.js';
export const model = createIncrementModel(hugolSource, 'HUGOL');
export const { increments, presets, subtotalIssue, presetState, setIncrement, volume: hugolVolume, rowCost: hugolRowCost, snapshot: hugolSnapshot, workbookAudit } = model;
