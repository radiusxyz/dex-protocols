import { createPricer } from '../../core/cpmm/pricer';
import { createQuoter } from '../../core/cpmm/quoter';
import { createReducer } from '../../core/cpmm/reducer';

export const aerodromeVolatileModule = {
  reducer: createReducer(),
  quoter: createQuoter(),
  pricer: createPricer(),
} as const;
