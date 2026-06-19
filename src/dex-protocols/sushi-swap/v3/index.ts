import { createPricer } from '../../core/clmm/pricer';
import { createQuoter } from '../../core/clmm/quoter';
import { createReducer } from '../../core/clmm/reducer';

export const sushiSwapV3Module = {
  reducer: createReducer(),
  quoter: createQuoter(),
  pricer: createPricer(),
} as const;
