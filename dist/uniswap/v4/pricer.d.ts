import type { UniswapV4PoolRuntime } from './types';
export type UniswapV4PricerParams = {
    runtime: UniswapV4PoolRuntime;
};
export declare function createPricer(): {
    computeSpotPrices: ({ runtime }: UniswapV4PricerParams) => import("../../core/clmm/pricer").UniswapV3PricerReturn;
};
//# sourceMappingURL=pricer.d.ts.map