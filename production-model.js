import { productionSource } from './production-source.js';
import { createIncrementModel } from './increment-model.js';

export const model = createIncrementModel(productionSource, 'HUGO · valores e produção');
