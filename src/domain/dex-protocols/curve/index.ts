import { createPricer } from './pricer';
import { createQuoter } from './quoter';
import { createReducer } from './reducer';

export const curveModule = {
  reducer: createReducer(),
  quoter: createQuoter(),
  pricer: createPricer(),
} as const;
