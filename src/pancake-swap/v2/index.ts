import { createPricer } from '../../core/cpmm/pricer';
import { createQuoter } from '../../core/cpmm/quoter';
import { createReducer } from '../../core/cpmm/reducer';

export const pancakeSwapV2Module = {
  reducer: createReducer(),
  quoter: createQuoter(),
  pricer: createPricer(),
} as const;
