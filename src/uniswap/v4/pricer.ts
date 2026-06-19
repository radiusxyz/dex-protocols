import { createPricer as createClmmPricer } from '../../core/clmm/pricer';

import type { UniswapV4PoolRuntime } from './types';

export type UniswapV4PricerParams = {
  runtime: UniswapV4PoolRuntime;
};

export function createPricer() {
  const clmmPricer = createClmmPricer();

  function computeSpotPrices({ runtime }: UniswapV4PricerParams) {
    return clmmPricer.computeSpotPrices({
      sqrtPriceX96: runtime.state.slot0.sqrtPriceX96,
    });
  }

  return { computeSpotPrices };
}
