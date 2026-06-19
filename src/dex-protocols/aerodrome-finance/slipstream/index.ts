import { createPricer } from '../../core/clmm/pricer';

import { createQuoter } from './quoter';
import { createReducer } from './reducer';

export const aerodromeSlipstreamModule = {
  reducer: createReducer(),
  quoter: createQuoter(),
  pricer: createPricer(),
} as const;
