import { createPricer } from './pricer';
import { createQuoter } from './quoter';
import { createReducer } from './reducer';

export { isEkuboV3ExtensionEnabled, resolveEkuboV3Domain } from './domain';

export const ekuboV3Module = {
  reducer: createReducer(),
  quoter: createQuoter(),
  pricer: createPricer(),
} as const;
