import { createPricer } from '../../core/clmm/pricer';
import { createQuoter } from '../../core/clmm/quoter';
import { createReducer } from '../../core/clmm/reducer';

export const uniswapV3Module = {
  reducer: createReducer(),
  quoter: createQuoter(),
  pricer: createPricer(),
} as const;
