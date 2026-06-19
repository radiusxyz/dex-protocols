import { createPricer } from '@src/dex-protocols/core/clmm/pricer';
import { createQuoter } from '@src/dex-protocols/core/clmm/quoter';
import { createReducer } from '@src/dex-protocols/core/clmm/reducer';

export const pancakeSwapV3Module = {
  reducer: createReducer(),
  quoter: createQuoter(),
  pricer: createPricer(),
} as const;
