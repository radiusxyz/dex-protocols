import { createPricer } from '@src/dex-protocols/core/cpmm/pricer';
import { createQuoter } from '@src/dex-protocols/core/cpmm/quoter';
import { createReducer } from '@src/dex-protocols/core/cpmm/reducer';

export const aerodromeVolatileModule = {
  reducer: createReducer(),
  quoter: createQuoter(),
  pricer: createPricer(),
} as const;
