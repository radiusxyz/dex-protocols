import { createPricer } from '@src/domain/dex-protocols/core/clmm/pricer';
import { createQuoter } from '@src/domain/dex-protocols/core/clmm/quoter';
import { createReducer } from '@src/domain/dex-protocols/core/clmm/reducer';

export const pancakeSwapV3Module = {
  reducer: createReducer(),
  quoter: createQuoter(),
  pricer: createPricer(),
} as const;
