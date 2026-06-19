import { createPricer } from '@src/domain/dex-protocols/core/cpmm/pricer';
import { createQuoter } from '@src/domain/dex-protocols/core/cpmm/quoter';
import { createReducer } from '@src/domain/dex-protocols/core/cpmm/reducer';

export const sushiSwapV2Module = {
  reducer: createReducer(),
  quoter: createQuoter(),
  pricer: createPricer(),
} as const;
