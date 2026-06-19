import { createPricer } from './pricer';
import { createQuoter } from './quoter';
import { createReducer } from './reducer';

export const ekuboV2Module = {
  reducer: createReducer(),
  quoter: createQuoter(),
  pricer: createPricer(),
} as const;
