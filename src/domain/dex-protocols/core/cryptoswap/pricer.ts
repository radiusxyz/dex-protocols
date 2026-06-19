import { createPricer as createStableSwapPricer } from '../stableswap/pricer';

export function createPricer() {
  const stableSwapPricer = createStableSwapPricer();

  function computePrices(params: { reserve0: bigint; reserve1: bigint }) {
    return stableSwapPricer.computePrices(params);
  }

  return { computePrices };
}
