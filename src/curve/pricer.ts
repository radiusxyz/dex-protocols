import { createPricer as createCryptoSwapPricer } from '../core/cryptoswap/pricer';
import { createPricer as createStableSwapPricer } from '../core/stableswap/pricer';

export function createPricer() {
  const stableSwapPricer = createStableSwapPricer();
  const cryptoSwapPricer = createCryptoSwapPricer();

  function computePrices(params: { reserve0: bigint; reserve1: bigint }) {
    return params.reserve0 === 0n || params.reserve1 === 0n
      ? stableSwapPricer.computePrices(params)
      : cryptoSwapPricer.computePrices(params);
  }

  return { computePrices };
}
